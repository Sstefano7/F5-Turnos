<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Horario extends Model
{
    use HasFactory;

    protected $fillable = [
        'cancha_id',
        'hora_inicio',
        'hora_fin',
        'dia_semana',
        'disponible'
    ];

    protected $casts = [
        'disponible' => 'boolean',
        'hora_inicio' => 'datetime:H:i',
        'hora_fin' => 'datetime:H:i'
    ];

    // Relaciones
    public function cancha()
    {
        return $this->belongsTo(Cancha::class);
    }

    // Scopes
    public function scopeDisponibles($query)
    {
        return $query->where('disponible', true);
    }

    public function scopeDia($query, $dia)
    {
        return $query->where('dia_semana', $dia);
    }
}