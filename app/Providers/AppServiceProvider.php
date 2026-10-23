<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
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
        if (
            str_contains(request()->server('HTTP_X_FORWARDED_PROTO', ''), 'https') ||
            str_contains(request()->header('host', ''), 'trycloudflare.com') ||
            str_contains(request()->header('host', ''), 'loca.lt')
        ) {
            URL::forceScheme('https');
        }
    }
}
