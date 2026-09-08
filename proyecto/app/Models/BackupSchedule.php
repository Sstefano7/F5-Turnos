<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BackupSchedule extends Model
{
    protected $fillable = [
        'dia_semana',
        'hora',
        'activo',
        'ultimo_backup_at',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'ultimo_backup_at' => 'datetime',
    ];

    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }
}
