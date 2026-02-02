<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    use HasFactory;

    protected $fillable = [
        'turno_id',
        'monto',
        'metodo_pago',
        'estado',
        'fecha_pago'
    ];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha_pago' => 'datetime'
    ];

    // Relaciones
    public function turno()
    {
        return $this->belongsTo(Turno::class);
    }

    // Scopes
    public function scopeCompletados($query)
    {
        return $query->where('estado', 'completado');
    }

    public function scopePendientes($query)
    {
        return $query->where('estado', 'pendiente');
    }
}