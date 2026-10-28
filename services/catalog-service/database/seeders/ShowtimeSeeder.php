<?php

namespace Database\Seeders;

use App\Models\Auditorium;
use App\Models\Movie;
use App\Models\Showtime;
use Illuminate\Database\Seeder;

class ShowtimeSeeder extends Seeder
{
    /**
     * Showtimes connecting movies with auditoriums across both cinemas.
     */
    public function run(): void
    {
        $movies = Movie::orderBy('title')->get();
        $auditoriums = Auditorium::orderBy('id')->get();

        $schedule = [
            // [movie index, auditorium index, days from now, time, format]
            [0, 0, 1, '19:30', '2D'],
            [0, 0, 2, '19:30', '4D-Sub'],
            [0, 2, 1, '21:00', '2D'],
            [1, 1, 1, '16:00', '2D'],
            [1, 1, 3, '16:00', '2D'],
            [1, 3, 2, '18:00', '4D-Sub'],
            [2, 0, 2, '21:30', '4D-Sub'],
            [2, 2, 3, '21:30', '2D'],
        ];

        foreach ($schedule as [$movieIndex, $auditoriumIndex, $days, $time, $format]) {
            [$hour, $minute] = array_map('intval', explode(':', $time));

            Showtime::create([
                'movie_id' => $movies[$movieIndex]->id,
                'auditorium_id' => $auditoriums[$auditoriumIndex]->id,
                'start_time' => now()->addDays($days)->setTime($hour, $minute),
                'format' => $format,
            ]);
        }
    }
}
