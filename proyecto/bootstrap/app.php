<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

$isServerless = (bool) env('VERCEL') || (bool) env('AWS_LAMBDA') || (bool) env('SERVERLESS');

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        $middleware->alias(([
            'admin' => \App\Http\Middleware\IsAdmin::class,
            'superadmin' => \App\Http\Middleware\IsSuperAdmin::class,
        ]));
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->withProviders(function ($providers) {
        // En serverless (Vercel), no registrar ScheduleServiceProvider
        // porque no hay proceso persistente para ejecutar el scheduler
        if ($isServerless) {
            $providers = $providers->except([
                \Illuminate\Console\Scheduling\ScheduleServiceProvider::class,
            ]);
        }
        return $providers;
    })
    ->create();