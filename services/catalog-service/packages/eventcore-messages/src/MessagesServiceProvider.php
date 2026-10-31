<?php

namespace EventCore\Messages;

use Illuminate\Support\ServiceProvider;

class MessagesServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../resources/messages.php', 'messages');
    }

    public function boot(): void
    {
        $this->publishes([
            __DIR__.'/../resources/messages.php' => config_path('messages.php'),
        ], 'eventcore-messages-config');
    }
}
