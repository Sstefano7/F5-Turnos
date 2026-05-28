<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Turno;
use App\Models\Pago;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\MercadoPagoConfig;

class MercadoPagoController extends Controller
{
    public function __construct()
    {
        // Configurar el Access Token de MP con las credenciales del .env
        MercadoPagoConfig::setAccessToken(config('mercadopago.mp_access_token'));
    }

    /**
     * Crea una Preference de MercadoPago para pagar la seña de un turno.
     * El frontend redirige al usuario al checkout_url devuelto.
     */
    public function crearPreferencia(Request $request, $turnoId)
    {
        $turno = Turno::with(['cancha', 'cliente'])->findOrFail($turnoId);

        // Solo se puede iniciar pago si el turno está esperando la seña
        if ($turno->estado !== 'pendiente_senia') {
            return response()->json([
                'message' => 'Este turno no está pendiente de pago de seña.'
            ], 422);
        }

        // Verificar que el turno no haya expirado
        if ($turno->senia_vence_en && now()->isAfter($turno->senia_vence_en)) {
            $turno->update(['estado' => 'cancelado']);
            return response()->json([
                'message' => 'El tiempo para pagar la seña expiró. El turno fue cancelado.'
            ], 422);
        }

        // Verificar que el turno pertenece al usuario autenticado (o es admin)
        $user = $request->user();
        if (!in_array($user->role, ['admin', 'superadmin']) && $turno->user_id !== $user->id) {
            return response()->json(['message' => 'No tenés permiso para pagar este turno.'], 403);
        }

        $fechaFormateada = \Carbon\Carbon::parse($turno->fecha)->format('d/m/Y');
        $horaInicio = substr($turno->hora_inicio, 0, 5);
        $horaFin    = substr($turno->hora_fin, 0, 5);

        $client = new PreferenceClient();

        $preferenceData = [
            'items' => [
                [
                    'id'          => 'senia_turno_' . $turno->id,
                    'title'       => "Seña - {$turno->cancha->nombre} ({$fechaFormateada} {$horaInicio}-{$horaFin})",
                    'description' => "Seña del " . config('turnos.senia.porcentaje') . "% para reservar tu turno. Resto se abona en el local.",
                    'quantity'    => 1,
                    'unit_price'  => (float) $turno->monto_senia,
                    'currency_id' => 'ARS',
                ],
            ],
            'payer' => [
                'name'  => $turno->cliente->nombre,
                'email' => $turno->cliente->email,
            ],
            'back_urls' => [
                'success' => config('mercadopago.frontend_url') . '/mis-reservas?pago=exitoso&turno=' . $turno->id,
                'failure' => config('mercadopago.frontend_url') . '/mis-reservas?pago=fallido&turno=' . $turno->id,
                'pending' => config('mercadopago.frontend_url') . '/mis-reservas?pago=pendiente&turno=' . $turno->id,
            ],
            'auto_return'        => 'approved',
            'external_reference' => (string) $turno->id,
            'expires'            => true,
            'expiration_date_to' => $turno->senia_vence_en->toIso8601String(),
        ];

        // Solo agregar notification_url si hay una URL pública configurada (no funciona en localhost)
        $webhookUrl = config('mercadopago.mp_webhook_url');
        if ($webhookUrl) {
            $preferenceData['notification_url'] = $webhookUrl;
        }

        try {
            $preference = $client->create($preferenceData);

            // Guardar el preference_id en el turno para poder recuperarlo después
            $turno->update(['mp_preference_id' => $preference->id]);

            return response()->json([
                'checkout_url'  => $preference->init_point,       // URL de producción
                'sandbox_url'   => $preference->sandbox_init_point, // URL de prueba
                'preference_id' => $preference->id,
                'monto_senia'   => $turno->monto_senia,
                'monto_total'   => $turno->precio,
                'monto_restante'=> $turno->monto_restante,
                'vence_en'      => $turno->senia_vence_en,
            ]);

        } catch (\Exception $e) {
            Log::error('Error creando preferencia MP: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al conectar con MercadoPago. Intenta nuevamente.'
            ], 500);
        }
    }

    /**
     * Webhook que MercadoPago llama cuando hay una actualización de pago.
     * Para usarlo en desarrollo necesitás exponer el backend con ngrok.
     */
    public function webhook(Request $request)
    {
        // Validar firma del webhook si hay secret configurado
        $secret = config('mercadopago.mp_webhook_secret');
        if ($secret) {
            $xSignature   = $request->header('x-signature');
            $xRequestId   = $request->header('x-request-id');
            $dataId       = $request->query('data.id') ?? $request->input('data.id');

            if ($xSignature && $xRequestId && $dataId) {
                // Formato esperado: ts=<timestamp>,v1=<hash>
                $parts = explode(',', $xSignature);
                $signatureParts = [];
                foreach ($parts as $part) {
                    $item = explode('=', $part, 2);
                    if (count($item) === 2) {
                        $signatureParts[$item[0]] = $item[1];
                    }
                }

                $receivedHash = $signatureParts['v1'] ?? null;
                if (!$receivedHash) {
                    Log::warning('Webhook MP: no se encontró v1 en la firma');
                    return response()->json(['error' => 'Firma inválida'], 400);
                }

                $manifest = "id:{$dataId};request-id:{$xRequestId};";
                $expectedHash = hash_hmac('sha256', $manifest, $secret);

                if (!hash_equals($expectedHash, $receivedHash)) {
                    Log::warning('Webhook MP con firma inválida');
                    return response()->json(['error' => 'Firma inválida'], 400);
                }
            }
        }

        $type   = $request->input('type');
        $dataId = $request->input('data.id');

        // Solo nos interesan los eventos de pago
        if ($type !== 'payment' || !$dataId) {
            return response()->json(['status' => 'ok']);
        }

        try {
            // Consultar el detalle del pago a la API de MP
            $paymentClient = new \MercadoPago\Client\Payment\PaymentClient();
            $payment = $paymentClient->get($dataId);

            $turnoId    = $payment->external_reference;
            $mpStatus   = $payment->status;
            $mpPaymentId = $payment->id;
            $preferenceId = $payment->preference_id;

            $turno = Turno::find($turnoId);
            if (!$turno) {
                Log::warning("Webhook MP: turno {$turnoId} no encontrado");
                return response()->json(['status' => 'ok']);
            }

            if ($mpStatus === 'approved') {
                // Pago aprobado → confirmar turno y registrar pago
                $turno->update(['estado' => 'confirmado']);

                Pago::updateOrCreate(
                    ['turno_id' => $turno->id, 'tipo' => 'senia'],
                    [
                        'monto'          => $turno->monto_senia,
                        'metodo_pago'    => 'tarjeta',
                        'estado'         => 'completado',
                        'fecha_pago'     => now(),
                        'mp_preference_id' => $preferenceId,
                        'mp_payment_id'  => $mpPaymentId,
                        'mp_status'      => $mpStatus,
                        'tipo'           => 'senia',
                    ]
                );

                Log::info("Seña del turno #{$turnoId} pagada. MP Payment ID: {$mpPaymentId}");

            } elseif ($mpStatus === 'rejected') {
                // Pago rechazado → el turno sigue pendiente, puede intentar de nuevo
                Log::info("Pago rechazado para turno #{$turnoId}");
            }

        } catch (\Exception $e) {
            Log::error('Error procesando webhook MP: ' . $e->getMessage());
            return response()->json(['error' => 'Error interno'], 500);
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Permite consultar el estado de pago de un turno desde el frontend
     * (para actualizar la UI cuando el usuario vuelve del checkout de MP)
     */
    public function estadoPago($turnoId, Request $request)
    {
        $turno = Turno::with('pago')->findOrFail($turnoId);

        // Verificar que pertenece al usuario
        $user = $request->user();
        if (!in_array($user->role, ['admin', 'superadmin']) && $turno->user_id !== $user->id) {
            return response()->json(['message' => 'Sin permiso.'], 403);
        }

        $pago = Pago::where('turno_id', $turnoId)->where('tipo', 'senia')->first();

        return response()->json([
            'turno_id'       => $turno->id,
            'estado_turno'   => $turno->estado,
            'senia_pagada'   => $turno->estado === 'confirmado',
            'monto_senia'    => $turno->monto_senia,
            'monto_restante' => $turno->monto_restante,
            'vence_en'       => $turno->senia_vence_en,
            'pago'           => $pago,
        ]);
    }
}
