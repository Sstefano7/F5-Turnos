<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Contracts\Auditable;

class Pago extends Model implements Auditable
{
    use HasFactory, SoftDeletes;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'turno_id',
        'monto',
        'metodo_pago',
        'estado',
        'referencia',
        'fecha_pago',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha_pago' => 'datetime',
    ];

    // Relaciones
    public function turno()
    {
        return $this->belongsTo(Turno::class)->withTrashed();
    }

    // Scopes
    public function scopeEstado($query, $estado)
    {
        return $query->where('estado', $estado);
    }

    public function scopeMetodo($query, $metodo)
    {
        return $query->where('metodo_pago', $metodo);
    }

    public function scopeRangoFecha($query, $desde, $hasta)
    {
        if ($desde) {
            $query->whereDate('created_at', '>=', $desde);
        }
        if ($hasta) {
            $query->whereDate('created_at', '<=', $hasta);
        }
        return $query;
    }
}
