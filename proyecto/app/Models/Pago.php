<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pago extends Model implements Auditable
{
    use HasFactory, SoftDeletes;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'turno_id',
        'monto',
        'metodo_pago',
        'estado',
        'fecha_pago',
        'mp_preference_id',
        'mp_payment_id',
        'mp_status',
        'tipo'
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