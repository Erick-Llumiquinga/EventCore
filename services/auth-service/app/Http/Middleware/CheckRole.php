<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Manejar la petición entrante y verificar si el usuario tiene uno de los roles permitidos.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = auth('api')->user();

        if (!$user) {
            return response()->json([
                'code' => 500,
                'data' => null,
                'message' => 'No autenticado',
            ], 500);
        }

        if (!$user->is_active) {
            return response()->json([
                'code' => 500,
                'data' => null,
                'message' => 'Tu cuenta se encuentra inactiva o suspendida',
            ], 500);
        }

        // El rol 'admin' tiene acceso total por jerarquía (superadmin)
        if ($user->hasRole('admin')) {
            return $next($request);
        }

        if (!$user->hasRole(...$roles)) {
            return response()->json([
                'code' => 500,
                'data' => null,
                'message' => 'Acceso denegado: Permisos insuficientes para esta operación',
            ], 500);
        }

        return $next($request);
    }
}
