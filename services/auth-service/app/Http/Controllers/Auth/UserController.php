<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Listar usuarios con paginación y filtros (Solo Admin)
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['role', 'person']);

        // Filtro por rol
        if ($request->filled('role')) {
            $query->whereHas('role', function ($q) use ($request) {
                $q->where('slug', $request->role);
            });
        }

        // Filtro por estado activo/inactivo
        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        // Búsqueda por correo, cédula, nombre o apellido
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('email', 'ILIKE', "%{$search}%")
                  ->orWhereHas('person', function ($pq) use ($search) {
                      $pq->where('identification', 'ILIKE', "%{$search}%")
                         ->orWhere('first_name', 'ILIKE', "%{$search}%")
                         ->orWhere('last_name', 'ILIKE', "%{$search}%");
                  });
            });
        }

        $perPage = (int) $request->input('per_page', 15);
        $users = $query->orderBy('id', 'desc')->paginate($perPage);

        $formattedUsers = collect($users->items())->map(function ($u) {
            return $this->formatUserData($u);
        });

        return $this->successResponse([
            'users' => $formattedUsers,
            'pagination' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
            ],
        ], 'Usuarios obtenidos exitosamente');
    }

    /**
     * Obtener el detalle de un usuario específico
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with(['role', 'person'])->find($id);

        if (!$user) {
            return $this->errorResponse('Usuario no encontrado');
        }

        return $this->successResponse($this->formatUserData($user), 'Usuario obtenido exitosamente');
    }

    /**
     * Activar o suspender cuenta de usuario (Solo Admin - Método PUT)
     */
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('Usuario no encontrado');
        }

        // Evitar que el admin se desactive a sí mismo
        if ($user->id === auth('api')->id()) {
            return $this->errorResponse('No puedes desactivar tu propia cuenta de administrador');
        }

        if ($request->has('is_active')) {
            $user->is_active = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);
        } else {
            $user->is_active = !$user->is_active;
        }

        $user->save();

        $estado = $user->is_active ? 'activada' : 'suspendida';

        return $this->successResponse([
            'id' => $user->id,
            'email' => $user->email,
            'is_active' => $user->is_active,
        ], "La cuenta del usuario ha sido {$estado}");
    }

    /**
     * Listar los roles disponibles
     */
    public function roles(): JsonResponse
    {
        $roles = Role::all();

        return $this->successResponse($roles, 'Roles obtenidos exitosamente');
    }
}
