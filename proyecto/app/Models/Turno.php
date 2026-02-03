<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Turno extends Model
{
    use HasFactory;

    protected $fillable = [
        'cancha_id',
        'cliente_id',
        'user_id',
        'fecha',
        'hora_inicio',
        'hora_fin',
        'precio',
        'estado',
        'observaciones'
    ];

    protected $casts = [
        'fecha' => 'date',
        'hora_inicio' => 'datetime:H:i',
        'hora_fin' => 'datetime:H:i',
        'precio' => 'decimal:2'
    ];

    // Relaciones
    public function cancha()
    {
        return $this->belongsTo(Cancha::class);
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }

    public function pago()
    {
        return $this->hasOne(Pago::class);
    }

    // Scopes
    public function scopeEstado($query, $estado)
    {
        return $query->where('estado', $estado);
    }

    public function scopeFecha($query, $fecha)
    {
        return $query->whereDate('fecha', $fecha);
    }

    public function scopeProximos($query)
    {
        return $query->where('fecha', '>=', now()->toDateString())
                    ->orderBy('fecha')
                    ->orderBy('hora_inicio');
    }
}