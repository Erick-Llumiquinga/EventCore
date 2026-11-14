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
                'poster_url' => 'https://s1.abcstatics.com/abc/www/multimedia/ciencia/2024/05/24/_20240521_nid_too_many_galaxies-Rqsf9jnUzX4GIkvHBKf5A5L-1200x840@diario_abc.jpg',
            ],
            [
                'title' => 'El Misterio del Bosque — Familiar',
                'description' => 'Animación familiar sobre dos hermanos que descubren un bosque mágico. Ideal para toda la familia.',
                'duration_minutes' => 95,
                'rating' => '+7',
                'poster_url' => 'https://festivalcinesevilla.eu/sites/default/files/styles/horizontal/public/2024-10/1_INTO%20THE%20WONDERWOODS%20%40JSBC_11zon.png?itok=ZrG0X3kH',
            ],
            [
                'title' => 'Abyssal — Terror submarino',
                'description' => 'Una estación de investigación en el fondo del océano pierde el contacto con la superficie. No apta para menores de 16.',
                'duration_minutes' => 110,
                'rating' => '+16',
                'poster_url' => 'https://cineycine.com/wp-content/uploads/2020/01/the-abyss-movie-1989.jpg',
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
