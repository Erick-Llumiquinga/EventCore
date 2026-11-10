<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $message = $e->getMessage() ?: 'Error interno del servidor';

                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    $message = $e->validator->errors()->first();
                } elseif ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    $message = 'No autenticado o token inválido';
                } elseif ($e instanceof \PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException) {
                    $message = 'El token ha expirado';
                } elseif ($e instanceof \PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException) {
                    $message = 'El token es inválido';
                } elseif ($e instanceof \PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException) {
                    $message = 'Error en el token de autenticación: ' . $e->getMessage();
                } elseif ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                    $message = 'Ruta o recurso no encontrado';
                } elseif ($e instanceof \Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException) {
                    $message = 'Método HTTP no permitido para esta ruta';
                } elseif ($e instanceof \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException) {
                    $message = 'Acceso denegado: Permisos insuficientes';
                }

                return response()->json([
                    'code' => 500,
                    'data' => null,
                    'message' => $message,
                ], 500);
            }
        });
    })->create();
