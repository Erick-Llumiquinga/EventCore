<?php

namespace App\Http\Controllers;

use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CatalogController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/health — public liveness/readiness probe (no token required).
     */
    public function health(): JsonResponse
    {
        try {
            DB::connection()->getPdo();
        } catch (\Throwable) {
            return $this->respondError(Messages::get('service.database_unavailable'), 503);
        }

        return $this->respondSuccess([
            'service' => 'catalog-service',
            'database' => 'ok',
            'timestamp' => now()->toIso8601String(),
        ], Messages::get('service.healthy'));
    }
}
