<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClienteResource;
use App\Models\Cliente;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min((int) $request->get('per_page', 15), 100);
        $query = Cliente::with('turnos');

        if ($request->has('search') && !empty($request->search)) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('dni', 'like', "%{$searchTerm}%")
                  ->orWhere('nombre', 'like', "%{$searchTerm}%")
                  ->orWhere('apellido', 'like', "%{$searchTerm}%")
                  ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }

        $clientes = $query->paginate($perPage);
        return ClienteResource::collection($clientes);
    }
    public function show($id)
    {
        $cliente = Cliente::with('turnos.cancha')->findOrFail($id);
        return new ClienteResource($cliente);
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

        $cliente = Cliente::create($request->only([
            'nombre', 'apellido', 'email', 'telefono', 'dni',
        ]));

        return (new ClienteResource($cliente))->response()->setStatusCode(201);
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

        $cliente->update($request->only([
            'nombre', 'apellido', 'email', 'telefono', 'dni',
        ]));

        return new ClienteResource($cliente);
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