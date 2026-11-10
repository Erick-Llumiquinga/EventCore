<?php

namespace Database\Seeders;

use App\Models\Cinema;
use App\Models\Seat;
use Illuminate\Database\Seeder;

class AuditoriumSeeder extends Seeder
{
    /**
     * Two auditoriums per cinema, with seats generated automatically:
     * rows A to C, numbered 1 to 5 (15 seats each).
     */
    public function run(): void
    {
        $auditoriums = [
            ['name' => 'Sala 1 — 2D', 'capacity' => 15],
            ['name' => 'Sala 2 — 4D', 'capacity' => 15],
        ];

        Cinema::query()->each(function (Cinema $cinema) use ($auditoriums): void {
            foreach ($auditoriums as $auditoriumData) {
                $auditorium = $cinema->auditoriums()->create($auditoriumData);

                foreach (['A', 'B', 'C'] as $row) {
                    foreach (range(1, 5) as $number) {
                        $auditorium->seats()->create([
                            'row_label' => $row,
                            'seat_number' => $number,
                            'status' => Seat::STATUS_ACTIVE,
                        ]);
                    }
                }
            }
        });
    }
}
