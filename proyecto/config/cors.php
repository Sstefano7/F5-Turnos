<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', env('APP_FRONTEND_URL', 'http://localhost:5173') . ',http://localhost:5173,https://f5-turnos-frontend.vercel.app')),

    'allowed_origins_patterns' => ['https://f5-turnos-frontend-.*\.vercel\.app'],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];