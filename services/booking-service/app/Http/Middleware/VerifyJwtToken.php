<?php

namespace App\Http\Middleware;

use Closure;
use EventCore\Messages\Messages;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenBlacklistedException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Symfony\Component\HttpFoundation\Response;

class VerifyJwtToken
{
    /**
     * Validate the Bearer token issued by auth-service (shared JWT_SECRET).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json([
                'code' => 500,
                'message' => Messages::get('auth.token_missing'),
                'data' => null,
            ], 401);
        }

        try {
            $payload = JWTAuth::setToken($token)->getPayload();
        } catch (TokenExpiredException) {
            return response()->json([
                'code' => 500,
                'message' => Messages::get('auth.token_expired'),
                'data' => null,
            ], 401);
        } catch (TokenBlacklistedException) {
            // Logout on auth-service: the jti lives in the shared Redis blacklist.
            // NOTE: this exception extends TokenInvalidException, so this catch
            // must come first.
            return response()->json([
                'code' => 500,
                'message' => Messages::get('auth.token_revoked'),
                'data' => null,
            ], 401);
        } catch (TokenInvalidException) {
            return response()->json([
                'code' => 500,
                'message' => Messages::get('auth.token_invalid'),
                'data' => null,
            ], 401);
        } catch (JWTException) {
            return response()->json([
                'code' => 500,
                'message' => Messages::get('auth.token_error'),
                'data' => null,
            ], 401);
        }

        // Expose the token claims to controllers (sub = user id in auth-service).
        // The JWT provider returns scalar claims as strings: normalize sub to int.
        $sub = $payload->get('sub');
        $userId = is_numeric($sub) ? (int) $sub : $sub;

        $request->attributes->set('jwt_payload', [
            'id' => $userId,
            'name' => $payload->get('name'),
            'email' => $payload->get('email'),
            'role' => $payload->get('role'),
        ]);
        $request->attributes->set('auth_user_id', $userId);

        return $next($request);
    }
}
