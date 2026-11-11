<?php

namespace App\Services\Tools;

/**
 * Rule-based intent resolver used when ASSISTANT_MOCK=true (no DeepSeek key).
 * Maps a Spanish question to a single whitelisted tool call with filters.
 */
class MockIntentResolver
{
    /**
     * @return list<array{name: string, arguments: array<string, mixed>}>
     */
    public function resolve(string $message): array
    {
        $normalized = mb_strtolower($message);

        if (preg_match('/asiento|butaca|butacas/', $normalized) === 1) {
            if (preg_match('/(\d+)/', $message, $matches) === 1) {
                return [[
                    'name' => 'get_showtime_seats',
                    'arguments' => ['showtime_id' => (int) $matches[1]],
                ]];
            }

            return [['name' => 'list_showtimes', 'arguments' => $this->showtimeArguments($normalized)]];
        }

        if (preg_match('/funci[oó]n|funcion|horario|programaci[oó]n|showtime|hora/', $normalized) === 1) {
            return [['name' => 'list_showtimes', 'arguments' => $this->showtimeArguments($normalized)]];
        }

        if (preg_match('/precio|costo|boleto|boletos|entrada|entradas/', $normalized) === 1) {
            $showtimeArguments = $this->showtimeArguments($normalized);

            if ($showtimeArguments !== []) {
                return [['name' => 'list_showtimes', 'arguments' => $showtimeArguments]];
            }

            return [['name' => 'list_movies', 'arguments' => $this->movieArguments($normalized)]];
        }

        if (preg_match('/cine|cines|sede|ciudad/', $normalized) === 1
            && preg_match('/pel[ií]cula|pelicula|cartelera|movie/', $normalized) !== 1) {
            return [['name' => 'list_cinemas', 'arguments' => $this->cinemaArguments($normalized)]];
        }

        return [['name' => 'list_movies', 'arguments' => $this->movieArguments($normalized)]];
    }

    /**
     * @return array<string, mixed>
     */
    private function showtimeArguments(string $normalized): array
    {
        $arguments = [];

        if (preg_match('/ma[ñn]ana/', $normalized) === 1) {
            $arguments['date'] = now()->addDay()->toDateString();
        } elseif (preg_match('/hoy|actualmente|ya/', $normalized) === 1) {
            $arguments['date'] = now()->toDateString();
        } elseif (preg_match('/(\d{4})-(\d{2})-(\d{2})/', $normalized, $matches) === 1) {
            $arguments['date'] = $matches[0];
        } elseif (preg_match('#(\d{1,2})/(\d{1,2})/(\d{4})#', $normalized, $matches) === 1) {
            $arguments['date'] = sprintf('%04d-%02d-%02d', $matches[3], $matches[2], $matches[1]);
        }

        if (preg_match('/cine\s*#?\s*(\d+)/', $normalized, $matches) === 1) {
            $arguments['cinema_id'] = (int) $matches[1];
        }

        // list_showtimes exige al menos un filtro: sin fecha explícita se asume hoy.
        if ($arguments === []) {
            $arguments['date'] = now()->toDateString();
        }

        return $arguments;
    }

    /**
     * @return array<string, mixed>
     */
    private function movieArguments(string $normalized): array
    {
        $arguments = [];

        if (preg_match('/finaliz|terminad|pasad/', $normalized) === 1) {
            $arguments['status'] = 'finished';
        } elseif (preg_match('/pr[oó]xim|pronto|borrador|preparaci/', $normalized) === 1) {
            $arguments['status'] = 'draft';
        } elseif (preg_match('/cartelera|estreno|disponible|vigente/', $normalized) === 1) {
            $arguments['status'] = 'published';
        }

        if (preg_match('/cine\s*#?\s*(\d+)/', $normalized, $matches) === 1) {
            $arguments['cinema_id'] = (int) $matches[1];
        }

        return $arguments;
    }

    /**
     * @return array<string, mixed>
     */
    private function cinemaArguments(string $normalized): array
    {
        if (preg_match('/(?:en|de|del|para)\s+([a-záéíóúñ]+)/u', $normalized, $matches) === 1) {
            $city = $matches[1];

            if (! in_array($city, ['el', 'la', 'los', 'las', 'un', 'una', 'mis', 'sus', 'cual'], true)) {
                return ['city' => mb_convert_case($city, MB_CASE_TITLE, 'UTF-8')];
            }
        }

        return [];
    }
}
