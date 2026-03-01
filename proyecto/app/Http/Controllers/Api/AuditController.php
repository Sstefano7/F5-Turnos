<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use OwenIt\Auditing\Models\Audit;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $query = Audit::with(['user'])
            ->orderBy('created_at', 'desc');

        // Filtros
        if ($request->has('auditable_type')) {
            $query->where('auditable_type', $request->auditable_type);
        }

        if ($request->has('event')) {
            $query->where('event', $request->event);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $audits = $query->paginate(20);

        return response()->json($audits);
    }

    public function show($id)
    {
        $audit = Audit::with(['user'])->findOrFail($id);
        return response()->json($audit);
    }
}