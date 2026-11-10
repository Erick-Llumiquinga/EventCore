<?php

namespace Database\Seeders;

use App\Models\Cinema;
use App\Models\Movie;
use Illuminate\Database\Seeder;

class MovieCinemaSeeder extends Seeder
{
    /**
     * Cinema <-> movie billboard (many-to-many).
     * Galaxias plays in both cinemas to demonstrate the M:N relationship.
     */
    public function run(): void
    {
        $quito = Cinema::where('city', 'Quito')->firstOrFail();
        $guayaquil = Cinema::where('city', 'Guayaquil')->firstOrFail();

        $galaxias = Movie::where('title', 'like', 'Galaxias%')->firstOrFail();
        $misterio = Movie::where('title', 'like', 'El Misterio%')->firstOrFail();
        $abyssal = Movie::where('title', 'like', 'Abyssal%')->firstOrFail();

        $quito->movies()->attach([$galaxias->id, $misterio->id, $abyssal->id]);
        $guayaquil->movies()->attach([$galaxias->id]);
    }
}
