<?php

use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\VerifyJwtToken;
use EventCore\Messages\Messages;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // NOTE: jwt-auth already claims the aliases jwt.auth/jwt.check/jwt.refresh/jwt.renew
        // during its boot(), so this service uses its own alias name.
        $middleware->alias([
            'jwt.verify' => VerifyJwtToken::class,
            'role' => EnsureUserHasRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Keep the {code, message, data} contract on every API error response.
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'code' => 500,
                    'message' => Messages::get('common.validation_errors'),
                    'data' => null,
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        // Unknown routes (e.g. GET /auto) always answer with the contract.
        $exceptions->render(function (HttpExceptionInterface $e, Request $request) {
            if ($e->getStatusCode() === 404) {
                return response()->json([
                    'code' => 500,
                    'message' => Messages::get('endpoint.not_found'),
                    'data' => null,
                ], 404);
            }

            if ($request->is('api/*')) {
                $message = match ($e->getStatusCode()) {
                    405 => Messages::get('endpoint.method_not_allowed'),
                    401 => $e->getMessage() !== '' ? $e->getMessage() : Messages::get('common.unauthorized'),
                    default => $e->getMessage() !== '' ? $e->getMessage() : Messages::get('common.request_error'),
                };

                return response()->json([
                    'code' => 500,
                    'message' => $message,
                    'data' => null,
                ], $e->getStatusCode());
            }
        });

        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'code' => 500,
                    'message' => config('app.debug') ? $e->getMessage() : Messages::get('common.server_error'),
                    'data' => null,
                ], 500);
            }
        });
    })->create();
