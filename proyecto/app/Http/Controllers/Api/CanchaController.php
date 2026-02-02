<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cancha;
use Illuminate\Http\Request;

class CanchaController extends Controller
{
    public function index()
    {
        $canchas = Cancha::activas()->get();
        return response()->json($canchas);
    }

    public function show($id)
    {
        $cancha = Cancha::with('horarios')->findOrFail($id);
        return response()->json($cancha);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|in:futbol5,padel',
            'descripcion' => 'nullable|string',
            'precio_hora' => 'required|numeric|min:0',
            'activa' => 'boolean',
            'imagen' => 'nullable|string',
        ]);

        $cancha = Cancha::create($request->all());

        return response()->json($cancha, 201);
    }

    public function update(Request $request, $id)
    {
        $cancha = Cancha::findOrFail($id);

        $request->validate([
            'nombre' => 'string|max:255',
            'tipo' => 'in:futbol5,padel',
            'descripcion' => 'nullable|string',
            'precio_hora' => 'numeric|min:0',
            'activa' => 'boolean',
            'imagen' => 'nullable|string',
        ]);

        $cancha->update($request->all());

        return response()->json($cancha);
    }

    public function destroy($id)
    {
        $cancha = Cancha::findOrFail($id);
        $cancha->delete();

        return response()->json([
            'message' => 'Cancha eliminada correctamente'
        ]);
    }
}