<?php

namespace Database\Seeders;

use App\Models\Showtime;
use Illuminate\Database\Seeder;

class TicketTypeSeeder extends Seeder
{
    /**
     * Ticket types with prices for every showtime.
     */
    public function run(): void
    {
        Showtime::query()->each(function (Showtime $showtime): void {
            $showtime->ticketTypes()->createMany([
                ['name' => 'General', 'price' => 15.20],
                ['name' => '3ra Edad', 'price' => 7.60],
            ]);
        });
    }
}
