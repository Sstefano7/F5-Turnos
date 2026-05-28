<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClienteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $esAdmin = $user && in_array($user->role, ['admin', 'superadmin']);

        $data = [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'apellido' => $this->apellido,
            'nombre_completo' => $this->nombre_completo,
            'turnos_count' => $this->whenLoaded('turnos', fn() => $this->turnos->count()),
        ];

        // Datos sensibles solo para administradores
        if ($esAdmin) {
            $data['email'] = $this->email;
            $data['telefono'] = $this->telefono;
            $data['dni'] = $this->dni;
        }

        return $data;
    }
}
