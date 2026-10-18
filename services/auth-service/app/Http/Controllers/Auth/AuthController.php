<?php

namespace app\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * New user registration
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'nullable|string|exists:roles,slug',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Errores de validación',
                'errors' => $validator->errors(),
            ], 422);
        }

        $roleSlug = $request->input('role');
        $role = Role::where('slug', $roleSlug)->first();

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $role->id,
        ]);

        // Load the relationship so that the JWT claim includes the role immediately
        $user->load('role');

        // Generate a JWT token directly for the newly created user
        $token = auth('api')->login($user);

        return response()->json([
            'status' => 'success',
            'message' => 'Usuario registrado exitosamente',
            'data' => $this->respondWithToken($token, $user),
        ], 201);
    }

    /**
     * Login
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        // Attempt to authenticate against the 'api' guard (JWT)
        if (!$token = auth('api')->attempt($credentials)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Credenciales inválidas',
            ], 401);
        }

        $user = auth('api')->user()->load('role');

        return response()->json([
            'status' => 'success',
            'message' => 'Inicio de sesión exitoso',
            'data' => $this->respondWithToken($token, $user),
        ]);
    }

    /**
     * Retrieve the authenticated user's profile
     */
    public function me(): JsonResponse
    {
        $user = auth('api')->user()->load('role');

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->slug,
                'role_name' => $user->role->name,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    /**
     * Log out (invalidate JWT token)
     */
    public function logout(): JsonResponse
    {
        auth('api')->logout();

        return response()->json([
            'status' => 'success',
            'message' => 'Sesión cerrada correctamente',
        ]);
    }

    /**
     * Refresh JWT token
     */
    public function refresh(): JsonResponse
    {
        $token = auth('api')->refresh();
        $user = auth('api')->user()->load('role');

        return response()->json([
            'status' => 'success',
            'data' => $this->respondWithToken($token, $user),
        ]);
    }

    /**
     * Format token response
     */
    protected function respondWithToken(string $token, User $user): array
    {
        return [
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60, // in seconds
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->slug,
                'role_name' => $user->role->name,
            ],
        ];
    }
}
