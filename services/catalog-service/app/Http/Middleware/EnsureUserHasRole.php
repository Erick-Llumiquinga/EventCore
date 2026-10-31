<?php

namespace App\Http\Middleware;

use Closure;
use EventCore\Messages\Messages;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Ensure the JWT payload carries one of the required roles (role:admin).
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $payload = $request->attributes->get('jwt_payload');
        $role = is_array($payload) ? ($payload['role'] ?? null) : null;

        if (! $role || ! in_array($role, $roles, true)) {
            return response()->json([
                'code' => 500,
                'message' => Messages::get('common.forbidden'),
                'data' => null,
            ], 403);
        }

        return $next($request);
    }
}
