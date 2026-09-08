<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use OwenIt\Auditing\Models\Audit;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min((int) $request->get('per_page', 15), 100);
        $audits = Audit::with('user')->orderBy('created_at', 'desc')->paginate($perPage);
        
        return response()->json($audits);
    }

    public function show($id)
    {
        $audit = Audit::with('user')->findOrFail($id);
        return response()->json($audit);
    }

    public function exportPdf()
    {
        $audits = Audit::with('user')->orderBy('created_at', 'desc')->limit(500)->get();
        $pdf = Pdf::loadView('pdf.audits', compact('audits'));

        return $pdf->download('auditorias.pdf');
    }
}