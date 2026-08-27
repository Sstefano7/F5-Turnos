<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Illuminate\Routing\Exceptions\UrlGenerationException;

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
        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $status = 500;
                if ($e instanceof HttpException) {
                    $status = $e->getStatusCode();
                } elseif ($e instanceof UrlGenerationException) {
                    $status = 404;
                }
                $data = [
                    'message' => $e->getMessage() ?: 'Server Error',
                    'exception' => get_class($e),
                    'file' => $e->getFile() . ':' . $e->getLine(),
                ];
                if (config('app.debug')) {
                    $data['trace'] = collect($e->getTrace())->take(15)->map(fn($t) => ($t['file'] ?? '') . ':' . ($t['line'] ?? '') . ' ' . ($t['class'] ?? '') . ($t['type'] ?? '') . ($t['function'] ?? ''))->toArray();
                    if ($e->getPrevious()) {
                        $data['previous'] = get_class($e->getPrevious()) . ': ' . $e->getPrevious()->getMessage();
                    }
                }
                return new JsonResponse($data, $status);
            }
        });
    })->create();