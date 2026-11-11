<?php

namespace App\Http\Controllers;

use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class BookingHealthController extends Controller
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
            'service' => 'booking-service',
            'database' => 'ok',
            'seat_lock_ttl_seconds' => (int) config('booking.seat_lock_ttl_seconds', 600),
            'timestamp' => now()->toIso8601String(),
        ], Messages::get('service.healthy'));
    }
}

