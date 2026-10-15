<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Turno;
use App\Models\Cancha;
use App\Models\Cliente;
use App\Models\Horario;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TurnoController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isAdmin = $user && in_array($user->role, ['admin', 'superadmin']);

        $query = Turno::with(['cancha', 'cliente']);

        // Sin scope por user_id, cualquier usuario autenticado podia listar
        // TODAS las reservas con los datos personales de los clientes.
        if (!$isAdmin) {
            $query->where('user_id', $user->id);
        }

        // Filtro de papelera para administradores
        if ($isAdmin && $request->boolean('solo_eliminados')) {
            $query->onlyTrashed();
        } elseif ($isAdmin && $request->boolean('con_eliminados')) {
            $query->withTrashed();
        }

        // Filtros opcionales
        if ($request->has('fecha')) {
            $query->whereDate('fecha', $request->fecha);
        }

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('cancha_id')) {
            $query->where('cancha_id', $request->cancha_id);
        }

        $perPage = min((int) $request->get('per_page', 15), 100);

        // Paginación
        $turnos = $query->orderBy('fecha', 'desc')
                       ->orderBy('hora_inicio')
                       ->paginate($perPage);

        // Enmascarar PII de los clientes para usuarios no administradores
        if (!$isAdmin) {
            $turnos->getCollection()->transform(function ($turno) {
                $data = $turno->toArray();
                $data['cliente'] = $this->clienteParaUsuario($turno->cliente);
                return $data;
            });
        }

        return response()->json($turnos);
    }

    public function show($id, Request $request)
    {
        $turno = Turno::with(['cancha', 'cliente'])->findOrFail($id);

        $user = $request->user();
        $esAdmin = $user && in_array($user->role, ['admin', 'superadmin']);

        // IDOR: sin esta validacion cualquier usuario podia leer cualquier
        // turno (DNI, telefono, email y precio) incrementando el id.
        if (!$esAdmin && $turno->user_id !== $user->id) {
            return response()->json([
                'message' => 'No tenés permiso para ver este turno.'
            ], 403);
        }

        $payload = $turno->toArray();
        if (!$esAdmin) {
            $payload['cliente'] = $this->clienteParaUsuario($turno->cliente);
        }

        return response()->json($payload);
    }

    /**
     * Versión sin PII sensible del cliente para usuarios no administradores.
     */
    private function clienteParaUsuario(?Cliente $cliente): ?array
    {
        if (!$cliente) {
            return null;
        }

        return [
            'id' => $cliente->id,
            'nombre' => $cliente->nombre,
            'apellido' => $cliente->apellido,
            'nombre_completo' => $cliente->nombre_completo,
        ];
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $esAdmin = $user && in_array($user->role, ['admin', 'superadmin']);

        $request->validate([
            'cancha_id' => 'required|exists:canchas,id',
            // cliente_id solo lo puede indicar un admin; para el resto el
            // cliente se resuelve en el servidor desde `cliente`.
            'cliente_id' => $esAdmin ? 'nullable|exists:clientes,id' : 'prohibited',
            'cliente' => $esAdmin ? 'nullable|array' : 'required|array',
            'cliente.nombre' => 'required|string|max:255',
            'cliente.apellido' => 'required|string|max:255',
            'cliente.email' => 'required|email|max:255',
            'cliente.telefono' => 'required|string|max:255',
            'cliente.dni' => 'nullable|string|max:20',
            'fecha' => 'required|date|after_or_equal:today',
            'hora_inicio' => 'required|date_format:H:i',
            'hora_fin' => 'required|date_format:H:i|after:hora_inicio',
            'observaciones' => 'nullable|string',
        ]);

        // Resolver el cliente en el servidor: el cliente normal no tiene
        // acceso al CRUD de clientes (contiene PII de todos los usuarios).
        $clienteId = $this->resolveClienteId($request, $esAdmin, $user);
        if ($clienteId === null) {
            return response()->json([
                'message' => 'No se pudieron resolver los datos del cliente'
            ], 422);
        }

        // Calcular el precio total
        $cancha = Cancha::whereKey($request->cancha_id)->where('activa', true)->first();
        if (!$cancha) {
            return response()->json(['message' => 'La cancha no está disponible para reservas.'], 422);
        }

        $diaSemana = [
            0 => 'domingo', 1 => 'lunes', 2 => 'martes', 3 => 'miercoles',
            4 => 'jueves', 5 => 'viernes', 6 => 'sabado',
        ][Carbon::parse($request->fecha)->dayOfWeek];

        $horarioDisponible = Horario::where('cancha_id', $cancha->id)
            ->where('dia_semana', $diaSemana)
            ->where('disponible', true)
            ->where('hora_inicio', $request->hora_inicio)
            ->where('hora_fin', $request->hora_fin)
            ->exists();

        if (!$horarioDisponible) {
            return response()->json(['message' => 'El horario seleccionado no está disponible para esa cancha.'], 422);
        }
        $horaInicio = Carbon::parse($request->hora_inicio);
        $horaFin    = Carbon::parse($request->hora_fin);
        $duracionHoras = $horaInicio->diffInMinutes($horaFin) / 60;
        $precioTotal   = round($cancha->precio_hora * $duracionHoras, 2);

        // Check-then-insert sin transaccion = doble reserva bajo concurrencia.
        // El lock sobre la fila de la cancha serializa los inserts del mismo
        // horario (en SQLite el lock es un no-op, pero la constraint de
        // exclusion de la migracion pgsql es el respaldo definitivo).
        try {
            $turno = DB::transaction(function () use ($request, $clienteId, $user, $cancha, $precioTotal) {
                Cancha::whereKey($cancha->id)->lockForUpdate()->first();

                $turnoExistente = Turno::where('cancha_id', $request->cancha_id)
                    ->whereDate('fecha', $request->fecha)
                    ->whereIn('estado', ['pendiente', 'confirmado', 'pendiente_senia'])
                    ->where(function ($q) use ($request) {
                        $q->where('hora_inicio', '<', $request->hora_fin)
                          ->where('hora_fin', '>', $request->hora_inicio);
                    })
                    ->lockForUpdate()
                    ->exists();

                if ($turnoExistente) {
                    return null;
                }

                return Turno::create([
                    'cancha_id'       => $request->cancha_id,
                    'cliente_id'      => $clienteId,
                    'user_id'         => $user ? $user->id : null,
                    'fecha'           => $request->fecha,
                    'hora_inicio'     => $request->hora_inicio,
                    'hora_fin'        => $request->hora_fin,
                    'precio'          => $precioTotal,
                    'estado'          => 'pendiente',
                    'observaciones'   => $request->observaciones,
                ]);
            });
        } catch (QueryException $e) {
            // 23P01 = exclusion_violation de PostgreSQL; 23505 cubre índices únicos.
            if (in_array($e->errorInfo[0] ?? null, ['23P01', '23505'], true)) {
                return response()->json([
                    'message' => 'Ya existe un turno reservado en ese horario'
                ], 422);
            }
            throw $e;
        }

        if ($turno === null) {
            return response()->json([
                'message' => 'Ya existe un turno reservado en ese horario'
            ], 422);
        }

        return response()->json([
            'turno'        => $this->turnoParaUsuario($turno->load(['cancha', 'cliente'])),
            'precio_total' => $precioTotal,
            'message'      => 'Reserva solicitada. Queda pendiente de confirmación por el administrador.'
        ], 201);
    }

    /**
     * Devuelve (o crea) el cliente al que pertenece la reserva, sin exponer
     * el listado de clientes al usuario normal.
     */
    private function resolveClienteId(Request $request, bool $esAdmin, $user): ?int
    {
        if ($esAdmin && $request->filled('cliente_id')) {
            return (int) $request->cliente_id;
        }

        return $user?->cliente?->id;
    }

    private function turnoParaUsuario(Turno $turno): array
    {
        $data = $turno->toArray();
        $data['cliente'] = $this->clienteParaUsuario($turno->cliente);

        return $data;
    }

    public function update(Request $request, $id)
    {
        $turno = Turno::findOrFail($id);

        $request->validate([
            'cancha_id' => 'exists:canchas,id',
            'cliente_id' => 'exists:clientes,id',
            'fecha' => 'date|after_or_equal:today',
            'hora_inicio' => 'date_format:H:i',
            'hora_fin' => 'date_format:H:i|after:hora_inicio',
            'estado' => 'in:pendiente,confirmado,cancelado,completado,pendiente_senia',
            'observaciones' => 'nullable|string',
        ]);

        // Si se cambia la cancha, la fecha u hora, verificar disponibilidad.
        // Antes 'cancha_id' quedaba fuera del if: mover el turno a otra
        // cancha lo hacia sin ningun chequeo de solapamiento.
        if ($request->has('fecha') || $request->has('hora_inicio') || $request->has('hora_fin') || $request->has('cancha_id')) {
            $fecha = $request->fecha ?? $turno->fecha;
            $horaInicio = $request->hora_inicio ?? $turno->hora_inicio;
            $horaFin = $request->hora_fin ?? $turno->hora_fin;
            $canchaId = $request->cancha_id ?? $turno->cancha_id;

            $turnoExistente = Turno::where('cancha_id', $canchaId)
                ->whereDate('fecha', $fecha)
                ->whereIn('estado', ['pendiente', 'confirmado', 'pendiente_senia'])
                ->where(function ($q) use ($horaInicio, $horaFin) {
                    $q->where('hora_inicio', '<', $horaFin)
                      ->where('hora_fin', '>', $horaInicio);
                })
                ->where('id', '!=', $id)
                ->first();

            if ($turnoExistente) {
                return response()->json([
                    'message' => 'Ya existe un turno reservado en ese horario'
                ], 422);
            }
        }

        // Recalcular precio si cambia la cancha o duración
        if ($request->has('cancha_id') || $request->has('hora_inicio') || $request->has('hora_fin')) {
            $canchaId = $request->cancha_id ?? $turno->cancha_id;
            $cancha = Cancha::findOrFail($canchaId);
            $horaInicio = Carbon::parse($request->hora_inicio ?? $turno->hora_inicio);
            $horaFin = Carbon::parse($request->hora_fin ?? $turno->hora_fin);
            
            $duracionHoras = $horaInicio->diffInMinutes($horaFin) / 60;
            
            $request->merge(['precio' => $cancha->precio_hora * $duracionHoras]);
        }

        $turno->update($request->only([
            'cancha_id', 'cliente_id', 'fecha',
            'hora_inicio', 'hora_fin', 'estado',
            'observaciones', 'precio',
        ]));

        return response()->json($turno->load(['cancha', 'cliente']));
    }

    public function destroy($id)
    {
        $turno = Turno::findOrFail($id);
        $turno->delete();

        return response()->json([
            'message' => 'Turno eliminado correctamente'
        ]);
    }

    public function restore($id)
    {
        $turno = Turno::withTrashed()->findOrFail($id);

        if (!$turno->trashed()) {
            return response()->json([
                'message' => 'El turno no está eliminado.'
            ], 422);
        }

        $fecha = Carbon::parse($turno->fecha)->toDateString();
        $horaInicio = Carbon::parse($turno->hora_inicio)->format('H:i');
        $horaFin = Carbon::parse($turno->hora_fin)->format('H:i');

        // Verificar si existe solapamiento con otro turno activo antes de restaurar
        $solapado = Turno::where('cancha_id', $turno->cancha_id)
            ->whereDate('fecha', $fecha)
            ->whereIn('estado', ['pendiente', 'confirmado', 'pendiente_senia'])
            ->where('id', '!=', $turno->id)
            ->where(function ($q) use ($horaInicio, $horaFin) {
                $q->where('hora_inicio', '<', $horaFin)
                  ->where('hora_fin', '>', $horaInicio);
            })
            ->exists();

        if ($solapado) {
            return response()->json([
                'message' => 'No se puede restaurar el turno porque el horario ya fue reservado por otro cliente.'
            ], 422);
        }

        $turno->restore();

        return response()->json([
            'message' => 'Turno restaurado correctamente.',
            'turno'   => $turno->load(['cancha', 'cliente'])
        ]);
    }

    public function misTurnos(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'message' => 'Usuario no autenticado'
            ], 401);
        }
        
        $turnos = Turno::with(['cancha', 'cliente'])
            ->where('user_id', $user->id)
            ->orderBy('fecha')
            ->orderBy('hora_inicio')
            ->get();

        return response()->json($turnos->map(fn (Turno $turno) => $this->turnoParaUsuario($turno)));
    }

    public function cancelar($id, Request $request)
    {
        $turno = Turno::findOrFail($id);

        // Verificar que el turno pertenece al usuario autenticado
        // a menos que sea admin o superadmin
        $user = $request->user();
        $esAdmin = in_array($user->role, ['admin', 'superadmin']);

        if (!$esAdmin && $turno->user_id !== $user->id) {
            return response()->json([
                'message' => 'No tenés permiso para cancelar este turno.'
            ], 403);
        }

        if ($turno->estado === 'cancelado') {
            return response()->json([
                'message' => 'El turno ya está cancelado'
            ], 422);
        }

        if ($turno->estado === 'completado') {
            return response()->json([
                'message' => 'No se puede cancelar un turno completado'
            ], 422);
        }

        $turno->update(['estado' => 'cancelado']);

        return response()->json([
            'message' => 'Turno cancelado correctamente',
            'turno' => $turno->load(['cancha', 'cliente'])
        ]);
    }
}
