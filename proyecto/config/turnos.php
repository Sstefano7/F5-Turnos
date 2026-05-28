<?php

return [
    'senia' => [
        'porcentaje' => (int) env('SENIA_PORCENTAJE', 30),
        'minutos_expiracion' => (int) env('SENIA_MINUTOS_EXPIRACION', 15),
    ],
    'admin_email' => env('ADMIN_EMAIL', 'admin@canchas.com'),
];
