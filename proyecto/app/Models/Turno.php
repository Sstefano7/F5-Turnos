<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable;
use Illuminate\Database\Eloquent\SoftDeletes;

class Turno extends Model implements Auditable
{
    use HasFactory, SoftDeletes;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'cancha_id',
        'cliente_id',
        'user_id',
        'fecha',
        'hora_inicio',
        'hora_fin',
        'precio',
        'estado',
        'senia_vence_en',
        'monto_senia',
        'observaciones'
    ];

    protected $casts = [
        'fecha'          => 'date',
        'hora_inicio'    => 'datetime:H:i',
        'hora_fin'       => 'datetime:H:i',
        'precio'         => 'decimal:2',
        'senia_vence_en' => 'datetime',
        'monto_senia'    => 'decimal:2',
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

    public function scopePendientes($query)
    {
        return $query->where('estado', 'pendiente');
    }
}