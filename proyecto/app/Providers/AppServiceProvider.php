<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Limiter global usado por $middleware->throttleApi().
        // Detras de Vercel REMOTE_ADDR es el del router, asi que la key se
        // arma con el token cuando existe (sino, con la IP).
        RateLimiter::for('api', function (Request $request) {
            $identity = $request->user()?->getAuthIdentifier()
                ?? $request->ip();

            $limit = Limit::perMinute(120)->by('api:'.$identity);

            // Los export/reportes arman PDFs y son caros: mitad de cupo.
            if ($request->is(
                'api/pagos/export-pdf',
                'api/bug-reports/export-pdf',
                'api/logs/export-pdf',
                'api/audits/export-pdf',
                'api/reports/*',
            )) {
                $limit = Limit::perMinute(30)->by('api-heavy:'.$identity);
            }

            return $limit;
        });
    }
}
