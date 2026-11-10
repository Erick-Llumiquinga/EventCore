<?php

namespace Database\Seeders;

use App\Models\Movie;
use Illuminate\Database\Seeder;

class MovieSeeder extends Seeder
{
    /**
     * Three published movies with posters and descriptions.
     */
    public function run(): void
    {
        $movies = [
            [
                'title' => 'Galaxias Perdidas — Estreno',
                'description' => 'Una tripulación de exploradores cruza un agujero de gusano para salvar a la humanidad. Función de estreno con sonido envolvente.',
                'duration_minutes' => 128,
                'rating' => '+12',
                'poster_url' => 'https://picsum.photos/seed/galaxias/1200/630',
            ],
            [
                'title' => 'El Misterio del Bosque — Familiar',
                'description' => 'Animación familiar sobre dos hermanos que descubren un bosque mágico. Ideal para toda la familia.',
                'duration_minutes' => 95,
                'rating' => '+7',
                'poster_url' => 'https://picsum.photos/seed/bosque/1200/630',
            ],
            [
                'title' => 'Abyssal — Terror submarino',
                'description' => 'Una estación de investigación en el fondo del océano pierde el contacto con la superficie. No apta para menores de 16.',
                'duration_minutes' => 110,
                'rating' => '+16',
                'poster_url' => 'https://picsum.photos/seed/abyssal/1200/630',
            ],
        ];

        foreach ($movies as $movie) {
            Movie::create([
                ...$movie,
                'status' => Movie::STATUS_PUBLISHED,
            ]);
        }
    }
}
