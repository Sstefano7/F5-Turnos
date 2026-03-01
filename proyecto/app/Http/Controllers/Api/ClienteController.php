<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function index(Request $request)
{
    $perPage = $request->get('per_page', 15);
    $clientes = Cliente::with('turnos')->paginate($perPage);
    return response()->json($clientes);
}
    public function show($id)
    {
        $cliente = Cliente::with('turnos.cancha')->findOrFail($id);
        return response()->json($cliente);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'email' => 'required|email|unique:clientes,email',
            'telefono' => 'required|string',
            'dni' => 'nullable|string|unique:clientes,dni',
        ]);

        $cliente = Cliente::create($request->all());

        return response()->json($cliente, 201);
    }

    public function update(Request $request, $id)
    {
        $cliente = Cliente::findOrFail($id);

        $request->validate([
            'nombre' => 'string|max:255',
            'apellido' => 'string|max:255',
            'email' => 'email|unique:clientes,email,' . $id,
            'telefono' => 'string',
            'dni' => 'nullable|string|unique:clientes,dni,' . $id,
        ]);

        $cliente->update($request->all());

        return response()->json($cliente);
    }

    public function destroy($id)
    {
        $cliente = Cliente::findOrFail($id);
        $cliente->delete();

        return response()->json([
            'message' => 'Cliente eliminado correctamente'
        ]);
    }
}