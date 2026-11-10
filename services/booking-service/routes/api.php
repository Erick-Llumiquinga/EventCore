<?php

use App\Http\Controllers\Admin\ReservationController as AdminReservationController;
use App\Http\Controllers\BookingHealthController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\ShowtimeAvailabilityController;
use Illuminate\Support\Facades\Route;

// Public liveness probe (Docker/monitoring cannot send tokens).
Route::get('/health', [BookingHealthController::class, 'health']);

// Every booking endpoint requires a Bearer token issued by auth-service.
Route::middleware('jwt.verify')->group(function () {
    // Real-time seat availability for a showtime (PostgreSQL confirmed + Redis 10-min temporary locks).
    Route::get('/showtimes/{showtime}/seats', [ShowtimeAvailabilityController::class, 'seats']);

    // Customer reservations, Redis seat lock (10 min), confirmation, QR generation & tracking.
    Route::get('/reservations', [ReservationController::class, 'index']);
    Route::post('/reservations', [ReservationController::class, 'store']);
    Route::get('/reservations/{code}', [ReservationController::class, 'show']);
    Route::post('/reservations/{code}/confirm', [ReservationController::class, 'confirm']);
    Route::post('/reservations/{code}/cancel', [ReservationController::class, 'cancel']);
    Route::get('/reservations/{code}/qr', [ReservationController::class, 'qr']);
    Route::get('/reservations/{code}/tracking', [ReservationController::class, 'tracking']);

    // Verify a digital QR payload signature and reservation state.
    Route::post('/qr/verify', [ReservationController::class, 'verifyQr']);

    // Organizer / Admin dashboard panel.
    Route::middleware('role:admin,organizer')->group(function () {
        Route::get('/admin/reservations', [AdminReservationController::class, 'index']);
    });
});
