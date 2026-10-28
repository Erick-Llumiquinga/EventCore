<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Person;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Registro de nuevo cliente (crea Persona y Usuario asociado)
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'identification' => 'required|string|max:20|unique:persons,identification',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role_id' => 'nullable|integer|exists:roles,id',
        ], [
            'required' => 'El campo :attribute es obligatorio.',
            'unique' => 'El :attribute ya está registrado en el sistema.',
            'confirmed' => 'Las contraseñas no coinciden.',
            'min' => 'El campo :attribute debe tener al menos :min caracteres.',
            'email' => 'El correo electrónico no tiene un formato válido.',
            'exists' => 'El rol seleccionado no existe en el sistema.',
            'integer' => 'El identificador del rol debe ser un número entero.',
        ], [
            'identification' => 'cédula',
            'first_name' => 'nombres',
            'last_name' => 'apellidos',
            'phone' => 'teléfono',
            'email' => 'correo electrónico',
            'password' => 'contraseña',
            'role_id' => 'rol',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first());
        }

        // Si envían role_id lo buscamos por ID, si no se envía por defecto es 'client'
        if ($request->filled('role_id')) {
            $role = Role::find($request->role_id);
        } elseif ($request->filled('role')) {
            $role = Role::where('slug', $request->role)->first();
        } else {
            $role = Role::where('slug', 'client')->first();
        }

        if (!$role) {
            return $this->errorResponse('El rol seleccionado no existe en el sistema.');
        }

        try {
            $user = DB::transaction(function () use ($request, $role) {
                $person = Person::create([
                    'identification' => $request->identification,
                    'first_name' => $request->first_name,
                    'last_name' => $request->last_name,
                    'phone' => $request->phone,
                ]);

                return User::create([
                    'person_id' => $person->id,
                    'role_id' => $role->id,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'is_active' => true,
                ]);
            });
        } catch (\Throwable $e) {
            return $this->errorResponse('Error al registrar el usuario: ' . $e->getMessage());
        }

        $user->load(['role', 'person']);

        return $this->successResponse(
            $this->formatUserData($user),
            'Usuario registrado exitosamente. Ahora puede iniciar sesión.'
        );
    }

    /**
     * Inicio de sesión
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ], [
            'required' => 'El campo :attribute es obligatorio.',
            'email' => 'El correo electrónico no es válido.',
        ], [
            'email' => 'correo electrónico',
            'password' => 'contraseña',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first());
        }

        $credentials = $request->only('email', 'password');

        if (!$token = auth('api')->attempt($credentials)) {
            return $this->errorResponse('Credenciales inválidas');
        }

        $user = auth('api')->user()->load(['role', 'person']);

        if (!$user->is_active) {
            auth('api')->logout();
            return $this->errorResponse('Tu cuenta se encuentra inactiva o suspendida');
        }

        return $this->successResponse($this->respondWithToken($token, $user), 'Inicio de sesión exitoso');
    }

    /**
     * Obtener el perfil del usuario autenticado
     */
    public function me(): JsonResponse
    {
        $user = auth('api')->user()->load(['role', 'person']);

        return $this->successResponse(
            $this->formatUserData($user),
            'Perfil obtenido exitosamente'
        );
    }

    /**
     * Cerrar sesión (invalidar token JWT)
     */
    public function logout(): JsonResponse
    {
        auth('api')->logout();

        return $this->successResponse(null, 'Sesión cerrada correctamente');
    }

    /**
     * Refrescar token JWT
     */
    public function refresh(): JsonResponse
    {
        $token = auth('api')->refresh();
        $user = auth('api')->user()->load(['role', 'person']);

        return $this->successResponse($this->respondWithToken($token, $user), 'Token refrescado exitosamente');
    }

    /**
     * Formatear respuesta del token con user, person y role
     */
    protected function respondWithToken(string $token, User $user): array
    {
        return array_merge([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
        ], $this->formatUserData($user));
    }
}
