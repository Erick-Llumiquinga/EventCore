<?php

namespace App\Services\Tools;

use App\Services\Catalog\CatalogClient;
use App\Services\Catalog\CatalogException;

/**
 * Whitelist of tools the LLM may call. Every tool is a read-only GET against
 * catalog-service, executed with the caller's own JWT so authorization is
 * enforced upstream.
 */
class ToolRegistry
{
    public function __construct(private CatalogClient $catalog) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function definitions(): array
    {
        return [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'list_movies',
                    'description' => 'Lista las películas del catálogo. Usa status="published" para la cartelera vigente, "draft" para próximas y "finished" para finalizadas.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'status' => [
                                'type' => 'string',
                                'enum' => ['draft', 'published', 'finished'],
                                'description' => 'Estado de la película',
                            ],
                            'cinema_id' => [
                                'type' => 'integer',
                                'description' => 'Filtra películas con funciones en este cine',
                            ],
                            'page' => [
                                'type' => 'integer',
                                'description' => 'Página (default 1)',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_movie',
                    'description' => 'Obtiene el detalle de una película (uuid) con su cartelera y sus funciones.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'movie_id' => [
                                'type' => 'string',
                                'description' => 'UUID de la película',
                            ],
                        ],
                        'required' => ['movie_id'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'list_showtimes',
                    'description' => 'Lista funciones (horarios) con su película, sala, cine y formato. Requiere al menos uno de: date, cinema_id o movie_id. date usa el formato YYYY-MM-DD.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'date' => [
                                'type' => 'string',
                                'description' => 'Fecha YYYY-MM-DD',
                            ],
                            'cinema_id' => [
                                'type' => 'integer',
                                'description' => 'Id del cine',
                            ],
                            'movie_id' => [
                                'type' => 'string',
                                'description' => 'UUID de la película',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_showtime',
                    'description' => 'Detalle de una función por id: película, sala, cine y precios (ticket-types).',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'showtime_id' => [
                                'type' => 'integer',
                                'description' => 'Id de la función',
                            ],
                        ],
                        'required' => ['showtime_id'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_showtime_seats',
                    'description' => 'Mapa de butacas de la sala de una función. status "active" = disponible, "maintenance" = fuera de servicio.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'showtime_id' => [
                                'type' => 'integer',
                                'description' => 'Id de la función',
                            ],
                        ],
                        'required' => ['showtime_id'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'list_cinemas',
                    'description' => 'Lista los cines disponibles, opcionalmente filtrando por ciudad (ej: Quito, Guayaquil).',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'city' => [
                                'type' => 'string',
                                'description' => 'Ciudad (comparación exacta, sin distinción de mayúsculas)',
                            ],
                            'page' => [
                                'type' => 'integer',
                                'description' => 'Página (default 1)',
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * Execute a whitelisted tool and return the catalog `data` payload.
     *
     * @param  array<string, mixed>  $arguments
     * @return array<mixed>|null
     *
     * @throws ToolException
     * @throws CatalogException
     */
    public function execute(string $name, array $arguments, string $token): ?array
    {
        return match ($name) {
            'list_movies' => $this->catalog->get('/movies', [
                'status' => $this->stringArg($arguments, 'status'),
                'cinema_id' => $this->intArg($arguments, 'cinema_id'),
                'page' => $this->intArg($arguments, 'page'),
            ], $token),

            'get_movie' => $this->catalog->get('/movies/'.$this->requiredString($arguments, 'movie_id'), [], $token),

            'list_showtimes' => $this->listShowtimes($arguments, $token),

            'get_showtime' => $this->catalog->get('/showtimes/'.$this->requiredInt($arguments, 'showtime_id'), [], $token),

            'get_showtime_seats' => $this->catalog->get('/showtimes/'.$this->requiredInt($arguments, 'showtime_id').'/seats', [], $token),

            'list_cinemas' => $this->catalog->get('/cinemas', [
                'city' => $this->stringArg($arguments, 'city'),
                'page' => $this->intArg($arguments, 'page'),
            ], $token),

            default => throw new ToolException('Herramienta desconocida: '.$name),
        };
    }

    /**
     * @param  array<string, mixed>  $arguments
     * @return array<mixed>|null
     *
     * @throws ToolException
     * @throws CatalogException
     */
    private function listShowtimes(array $arguments, string $token): ?array
    {
        $query = [
            'date' => $this->stringArg($arguments, 'date'),
            'cinema_id' => $this->intArg($arguments, 'cinema_id'),
            'movie_id' => $this->stringArg($arguments, 'movie_id'),
        ];

        if (array_filter($query, fn ($value) => $value !== null) === []) {
            throw new ToolException('list_showtimes requiere al menos uno de: date, cinema_id o movie_id');
        }

        return $this->catalog->get('/showtimes', $query, $token);
    }

    /**
     * @param  array<string, mixed>  $arguments
     */
    private function stringArg(array $arguments, string $key): ?string
    {
        $value = $arguments[$key] ?? null;

        if ($value === null || $value === '') {
            return null;
        }

        if (! is_scalar($value)) {
            throw new ToolException("El argumento {$key} debe ser un texto");
        }

        return (string) $value;
    }

    /**
     * @param  array<string, mixed>  $arguments
     */
    private function intArg(array $arguments, string $key): ?int
    {
        $value = $arguments[$key] ?? null;

        if ($value === null || $value === '') {
            return null;
        }

        if (! is_numeric($value)) {
            throw new ToolException("El argumento {$key} debe ser un número");
        }

        return (int) $value;
    }

    /**
     * @param  array<string, mixed>  $arguments
     */
    private function requiredString(array $arguments, string $key): string
    {
        return $this->stringArg($arguments, $key)
            ?? throw new ToolException("Falta el argumento obligatorio {$key}");
    }

    /**
     * @param  array<string, mixed>  $arguments
     */
    private function requiredInt(array $arguments, string $key): int
    {
        return $this->intArg($arguments, $key)
            ?? throw new ToolException("Falta el argumento obligatorio {$key}");
    }
}
