<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use OwenIt\Auditing\Models\Audit;
use Barryvdh\DomPDF\Facade\Pdf; // 1. IMPORTANTE: Agregar esta línea para usar el PDF

class AuditController extends Controller
{
    // Función para llenar la tabla en React (La que ya tenías)
    public function index()
    {
        $audits = Audit::with('user')->orderBy('created_at', 'desc')->paginate(10);
        
        return response()->json($audits);
    }

    // 2. NUEVA FUNCIÓN: Para generar y descargar el PDF
    public function exportPdf()
    {
        // Traemos las últimas 500 auditorías (no usamos paginación aquí para que el PDF salga completo)
        $audits = Audit::with('user')->orderBy('created_at', 'desc')->limit(500)->get();

        // Le pasamos los datos a la vista que creamos
        $pdf = Pdf::loadView('pdf.audits', compact('audits'));

        // Retornamos el archivo PDF para que el navegador lo descargue
        return $pdf->download('auditorias.pdf');
    }
}