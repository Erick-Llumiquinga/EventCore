<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

abstract class Controller
{
    /**
     * Respuesta exitosa estandarizada
     */
    protected function successResponse(mixed $data = null, string $message = 'Operación exitosa', int $httpStatus = 200): JsonResponse
    {
        return response()->json([
            'code' => 200,
            'data' => $data,
            'message' => $message,
        ], $httpStatus);
    }

    /**
     * Respuesta de error estandarizada
     */
    protected function errorResponse(string $message = 'Error en el servicio', int $httpStatus = 500): JsonResponse
    {
        return response()->json([
            'code' => 500,
            'data' => null,
            'message' => $message,
        ], $httpStatus);
    }

    /**
     * Formatear el usuario en los 3 objetos requeridos: user, person y role
     */
    protected function formatUserData(\App\Models\User $user): array
    {
        return [
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'is_active' => (bool) $user->is_active,
                'created_at' => $user->created_at,
            ],
            'person' => [
                'id' => $user->person?->id,
                'identification' => $user->person?->identification,
                'first_name' => $user->person?->first_name,
                'last_name' => $user->person?->last_name,
                'full_name' => $user->person?->full_name,
                'phone' => $user->person?->phone,
            ],
            'role' => [
                'id' => $user->role?->id,
                'slug' => $user->role?->slug,
                'name' => $user->role?->name,
                'description' => $user->role?->description,
            ],
        ];
    }
}
