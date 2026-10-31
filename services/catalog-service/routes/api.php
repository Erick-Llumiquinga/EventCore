<?php

use App\Http\Controllers\Admin\AuditoriumController as AdminAuditoriumController;
use App\Http\Controllers\Admin\CinemaController as AdminCinemaController;
use App\Http\Controllers\Admin\MovieController as AdminMovieController;
use App\Http\Controllers\Admin\SeatController as AdminSeatController;
use App\Http\Controllers\Admin\ShowtimeController as AdminShowtimeController;
use App\Http\Controllers\Admin\TicketTypeController as AdminTicketTypeController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CinemaController;
use App\Http\Controllers\MovieController;
use App\Http\Controllers\ShowtimeController;
use Illuminate\Support\Facades\Route;

// Public liveness probe (Docker/monitoring cannot send tokens).
Route::get('/health', [CatalogController::class, 'health']);

// Flat catalog URLs with query-parameter filters.
// Every endpoint requires a Bearer token issued by auth-service.
Route::middleware('jwt.verify')->group(function () {
    // Read: cinemas, movies and showtimes.
    Route::get('/cinemas', [CinemaController::class, 'index']);
    Route::get('/cinemas/{cinema}', [CinemaController::class, 'show']);

    Route::get('/movies', [MovieController::class, 'index']);
    Route::get('/movies/{movie}', [MovieController::class, 'show']);

    Route::get('/showtimes', [ShowtimeController::class, 'index']);
    Route::get('/showtimes/{showtime}', [ShowtimeController::class, 'show']);
    Route::get('/showtimes/{showtime}/ticket-types', [ShowtimeController::class, 'ticketTypes']);
    Route::get('/showtimes/{showtime}/seats', [ShowtimeController::class, 'seats']);

    // Administration: token + role=admin claim.
    Route::middleware('role:admin')->group(function () {
        Route::post('/cinemas', [AdminCinemaController::class, 'store']);
        Route::put('/cinemas/{cinema}', [AdminCinemaController::class, 'update']);
        Route::delete('/cinemas/{cinema}', [AdminCinemaController::class, 'destroy']);

        Route::post('/movies', [AdminMovieController::class, 'store']);
        Route::put('/movies/{movie}', [AdminMovieController::class, 'update']);
        Route::delete('/movies/{movie}', [AdminMovieController::class, 'destroy']);

        Route::post('/auditoriums', [AdminAuditoriumController::class, 'store']);
        Route::put('/auditoriums/{auditorium}', [AdminAuditoriumController::class, 'update']);
        Route::delete('/auditoriums/{auditorium}', [AdminAuditoriumController::class, 'destroy']);

        Route::post('/showtimes', [AdminShowtimeController::class, 'store']);
        Route::put('/showtimes/{showtime}', [AdminShowtimeController::class, 'update']);
        Route::delete('/showtimes/{showtime}', [AdminShowtimeController::class, 'destroy']);

        Route::post('/ticket-types', [AdminTicketTypeController::class, 'store']);
        Route::put('/ticket-types/{ticketType}', [AdminTicketTypeController::class, 'update']);
        Route::delete('/ticket-types/{ticketType}', [AdminTicketTypeController::class, 'destroy']);

        Route::post('/seats', [AdminSeatController::class, 'store']);
        Route::put('/seats/{seat}', [AdminSeatController::class, 'update']);
        Route::delete('/seats/{seat}', [AdminSeatController::class, 'destroy']);
    });
});
