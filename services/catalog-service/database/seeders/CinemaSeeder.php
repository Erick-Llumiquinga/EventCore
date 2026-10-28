<?php

namespace Database\Seeders;

use App\Models\Cinema;
use Illuminate\Database\Seeder;

class CinemaSeeder extends Seeder
{
    /**
     * Two cinemas in Ecuadorian cities.
     */
    public function run(): void
    {
        Cinema::create([
            'name' => 'Cine Multicentro Quito',
            'address' => 'Av. República de El Salvador N34-190',
            'city' => 'Quito',
        ]);

        Cinema::create([
            'name' => 'Cine Cityplace Guayaquil',
            'address' => 'Av. 9 de Octubre 1205',
            'city' => 'Guayaquil',
        ]);
    }
}
