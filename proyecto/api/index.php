<?php

// Vercel serverless: bootstrap/cache debe ser escribible en /tmp
if (!is_dir('/tmp/bootstrap/cache')) {
    @mkdir('/tmp/bootstrap/cache', 0777, true);
}
// Asegurar que view compiled también use /tmp (ya configurado via VIEW_COMPILED_PATH)
if (!is_dir('/tmp/storage/framework/views')) {
    @mkdir('/tmp/storage/framework/views', 0777, true);
}

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

// Override bootstrap cache path a /tmp para Vercel read-only FS
if (is_dir('/tmp/bootstrap/cache')) {
    $app->instance('path.bootstrap', '/tmp/bootstrap');
    // También asegurar que bootstrap/cache exista en /tmp con packages.php/services.php si existen
    $srcCache = __DIR__ . '/../bootstrap/cache';
    $tmpCache = '/tmp/bootstrap/cache';
    if (is_dir($srcCache)) {
        foreach (['packages.php', 'services.php'] as $file) {
            $src = $srcCache . '/' . $file;
            $dst = $tmpCache . '/' . $file;
            if (file_exists($src) && !file_exists($dst)) {
                @copy($src, $dst);
            }
        }
    }
}

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$request = Illuminate\Http\Request::capture();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);