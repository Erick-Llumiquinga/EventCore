<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    /**
     * Actualizar datos personales del usuario autenticado
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
        ], [
            'required' => 'El campo :attribute es obligatorio.',
        ], [
            'first_name' => 'nombres',
            'last_name' => 'apellidos',
            'phone' => 'teléfono',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first());
        }

        $person = $user->person;
        $person->update([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'phone' => $request->phone,
        ]);

        $user->load(['role', 'person']);

        return $this->successResponse(
            $this->formatUserData($user),
            'Perfil actualizado exitosamente'
        );
    }

    /**
     * Cambiar la contraseña del usuario autenticado
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'required' => 'El campo :attribute es obligatorio.',
            'confirmed' => 'Las contraseñas no coinciden.',
            'min' => 'La nueva contraseña debe tener al menos :min caracteres.',
        ], [
            'current_password' => 'contraseña actual',
            'password' => 'nueva contraseña',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first());
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return $this->errorResponse('La contraseña actual no es correcta');
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return $this->successResponse(null, 'Contraseña actualizada exitosamente');
    }
}
