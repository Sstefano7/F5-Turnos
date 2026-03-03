<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BugReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf; 


class BugReportController extends Controller
{
    public function index(Request $request)
    {
        $query = BugReport::with(['user'])
            ->orderBy('created_at', 'desc');

        // Filtros
        if ($request->has('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('prioridad')) {
            $query->where('prioridad', $request->prioridad);
        }

        // --- EL ÚNICO CAMBIO ES ESTA LÍNEA ---
        // Cambiamos $query->paginate(15) por $query->get()
        $reports = $query->get();

        return response()->json($reports);
    }

    public function store(Request $request)
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'required|string',
            'tipo' => 'in:bug,mejora,pregunta',
            'prioridad' => 'in:baja,media,alta,critica',
            'pagina' => 'nullable|string',
            'navegador' => 'nullable|string',
            'pasos_reproducir' => 'nullable|string'
        ]);

        $bugReport = BugReport::create([
            'user_id' => $request->user() ? $request->user()->id : null,
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'tipo' => $request->tipo ?? 'bug',
            'prioridad' => $request->prioridad ?? 'media',
            'estado' => 'nuevo',
            'pagina' => $request->pagina,
            'navegador' => $request->navegador,
            'pasos_reproducir' => $request->pasos_reproducir,
            'metadata' => [
                'user_agent' => $request->header('User-Agent'),
                'ip' => $request->ip(),
            ]
        ]);

        // Enviar email al administrador
        $this->enviarEmailReporte($bugReport);

        return response()->json([
            'message' => 'Reporte enviado exitosamente',
            'bug_report' => $bugReport
        ], 201);
    }

    public function show($id)
    {
        $bugReport = BugReport::with(['user'])->findOrFail($id);
        return response()->json($bugReport);
    }

    public function update(Request $request, $id)
    {
        $bugReport = BugReport::findOrFail($id);

        $request->validate([
            'estado' => 'in:nuevo,en_revision,en_progreso,resuelto,cerrado',
            'prioridad' => 'in:baja,media,alta,critica'
        ]);

        $bugReport->update($request->only(['estado', 'prioridad']));

        return response()->json($bugReport);
    }

    public function destroy($id)
    {
        $bugReport = BugReport::findOrFail($id);
        $bugReport->delete();

        return response()->json([
            'message' => 'Reporte eliminado correctamente'
        ]);
    }

    private function enviarEmailReporte($bugReport)
    {
        try {
            // Email del administrador (configúralo en el .env)
            $adminEmail = env('ADMIN_EMAIL', 'admin@canchas.com');

            Mail::raw(
                "Nuevo reporte de bug:\n\n" .
                "Título: {$bugReport->titulo}\n" .
                "Tipo: {$bugReport->tipo}\n" .
                "Prioridad: {$bugReport->prioridad}\n" .
                "Descripción: {$bugReport->descripcion}\n\n" .
                "Usuario: " . ($bugReport->user ? $bugReport->user->name : 'Anónimo') . "\n" .
                "Página: {$bugReport->pagina}\n" .
                "Navegador: {$bugReport->navegador}\n\n" .
                "Ver más detalles en: " . env('APP_URL') . "/admin/bug-reports/{$bugReport->id}",
                function ($message) use ($adminEmail, $bugReport) {
                    $message->to($adminEmail)
                        ->subject("Nuevo Bug Report: {$bugReport->titulo}");
                }
            );
        } catch (\Exception $e) {
            Log::error('Error al enviar email de bug report: ' . $e->getMessage());
        }
    }
    public function exportPdf() 
    {
        // 1. Obtener los datos de la base de datos
        $bugs = BugReport::all(); 

        // 2. Pasar los datos a la vista usando compact('bugs')
        // El nombre dentro de compact debe ser el mismo que el de la variable
        $pdf = Pdf::loadView('pdf.bug_reports', compact('bugs'));

        return $pdf->download('reporte_bugs.pdf');
    }
}