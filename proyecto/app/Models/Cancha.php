<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable;
use Illuminate\Database\Eloquent\SoftDeletes;


class Cancha extends Model implements Auditable
{
    use HasFactory, SoftDeletes;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'nombre',
        'tipo',
        'descripcion',
        'precio_hora',
        'activa',
        'imagen'
    ];

    protected $casts = [
        'activa' => 'boolean',
        'precio_hora' => 'decimal:2'
    ];

    // Relaciones
    public function horarios()
    {
        return $this->hasMany(Horario::class);
    }

    public function turnos()
    {
        return $this->hasMany(Turno::class);
    }

    // Scopes
    public function scopeActivas($query)
    {
        return $query->where('activa', true);
    }

    public function scopeTipo($query, $tipo)
    {
        return $query->where('tipo', $tipo);
    }
}