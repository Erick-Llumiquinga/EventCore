<?php

namespace App\Http\Controllers;

use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AssistantController extends Controller
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
            'service' => 'assistant-service',
            'database' => 'ok',
            'ai' => config('assistant.mock') ? 'mock' : (config('services.deepseek.api_key') ? 'deepseek' : 'not_configured'),
            'timestamp' => now()->toIso8601String(),
        ], Messages::get('service.healthy'));
    }
}
