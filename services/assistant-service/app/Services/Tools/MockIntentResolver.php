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

        $intent = $this->conversationalIntent($normalized);

        if ($intent !== null) {
            return [['name' => 'conversational', 'arguments' => ['intent' => $intent]]];
        }

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

        $movieTitle = $this->detailMovieTitle($normalized);

        if ($movieTitle !== null) {
            return [['name' => 'get_movie', 'arguments' => ['title' => $movieTitle]]];
        }

        return [['name' => 'list_movies', 'arguments' => $this->movieArguments($normalized)]];
    }

    /**
     * Detects pure small-talk (greetings, farewells, identity...) so the mock
     * answers conversationally instead of falling through to the catalog.
     * Returns null when the message looks like a catalog query.
     */
    private function conversationalIntent(string $normalized): ?string
    {
        $normalized = trim($normalized, " \t.,;:!?¿¡\"'");

        if ($normalized === '') {
            return null;
        }

        if (preg_match('/^c[óo]mo (?:est[áa]s|estas|vas)$/u', $normalized) === 1) {
            return 'how_are_you';
        }

        if (preg_match('/^(?:hola|hello|hey|saludos|buenos d[ií]as|buenas tardes|buenas noches|buen d[ií]a|qu[ée] tal|que tal)$/u', $normalized) === 1) {
            return 'greeting';
        }

        if (preg_match('/^(?:qui[ée]n eres|qu[ée] eres|c[óo]mo te llamas|cu[áa]l es tu nombre|tu nombre)$/u', $normalized) === 1) {
            return 'identity';
        }

        if (preg_match('/^(?:gracias|muchas gracias|te agradezco|mil gracias|genial|perfecto)$/u', $normalized) === 1) {
            return 'thanks';
        }

        if (preg_match('/^(?:adi[óo]s|chao|chau|hasta luego|hasta pronto|nos vemos|bye|me voy)$/u', $normalized) === 1) {
            return 'bye';
        }

        return null;
    }

    /**
     * Detects "detail" requests (información/detalle de <película>) and
     * extracts the movie name the user is asking about. The returned
     * pseudo-argument `title` is resolved to a movie_id in ToolCallLoop.
     */
    private function detailMovieTitle(string $normalized): ?string
    {
        $trigger = '/informaci[oó]n|informacion|\binfo\b|detalles?|m[áa]s (sobre|de)|qu[ée] es|cu[ée]ntame|describe/u';

        if (preg_match($trigger, $normalized) !== 1) {
            return null;
        }

        if (preg_match('/(?:de|sobre)\s+(.+)$/u', $normalized, $matches) === 1) {
            $title = $matches[1];
        } else {
            $fillers = '/informaci[oó]n|informacion|\binfo\b|detalles?|m[áa]s (sobre|de)|qu[ée] es|cu[ée]ntame|describe|dame|d[íi]me|quiero|necesito|saber|por favor|me ayudas con|mas|m[áa]s/u';
            $title = (string) preg_replace($fillers, ' ', $normalized);
        }

        $title = (string) preg_replace('/\(.*?\)/u', ' ', $title);
        $title = (string) preg_replace('/\s+/u', ' ', $title);
        $title = (string) preg_replace('/^(?:el|la|los|las|un|una|mi|tu)\s+/u', '', $title);
        $title = (string) preg_replace('/^peliculas?\s+/u', '', $title);
        $title = trim($title, " \t.,;:!?¿¡\"'");

        return $title !== '' ? $title : null;
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
