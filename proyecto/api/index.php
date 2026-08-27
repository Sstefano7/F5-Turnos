<?php

// Vercel serverless: bootstrap/cache y storage deben ser escribibles en /tmp
if (!is_dir('/tmp/bootstrap/cache')) {
    @mkdir('/tmp/bootstrap/cache', 0777, true);
}
if (!is_dir('/tmp/storage/framework/views')) {
    @mkdir('/tmp/storage/framework/views', 0777, true);
}
if (!is_dir('/tmp/storage/logs')) {
    @mkdir('/tmp/storage/logs', 0777, true);
}
if (!is_dir('/tmp/storage/framework/cache')) {
    @mkdir('/tmp/storage/framework/cache', 0777, true);
}
if (!is_dir('/tmp/storage/framework/sessions')) {
    @mkdir('/tmp/storage/framework/sessions', 0777, true);
}

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

// Override paths para Vercel read-only FS
if (is_dir('/tmp/bootstrap/cache')) {
    $app->useBootstrapPath('/tmp/bootstrap');
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
if (is_dir('/tmp/storage')) {
    $app->useStoragePath('/tmp/storage');
}

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// Vercel: api/index.php está en /api/index.php, pero queremos preservar /api prefix en la ruta
// Sin esto, Request::capture() stripea "api" de /api/canchas => "canchas" y no matchea api/canchas
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/../public/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

$request = Illuminate\Http\Request::capture();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);