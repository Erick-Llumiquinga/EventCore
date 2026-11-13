<?php

namespace App\Services\Tools;

use Carbon\Carbon;

/**
 * Renders the final Spanish answer in mock mode from real catalog payloads.
 */
class MockResponder
{
    private const STATUS_LABELS = [
        'draft' => 'próximamente (borrador)',
        'published' => 'en cartelera',
        'finished' => 'finalizada',
    ];

    /**
     * Cheerful small-talk answers (greetings, farewells...) with no catalog
     * data behind them. $returning is true when the conversation already has
     * prior messages, so the greeting acknowledges the ongoing chat.
     */
    public function conversational(string $intent, bool $returning): string
    {
        return match ($intent) {
            'how_are_you' => '¡Estoy de maravilla, listo para cine! 🍿 ¿Y tú, qué te apetece ver hoy?',
            'identity' => '¡Soy tu asistente de EventCore! 🎬 Con gusto te ayudo con la cartelera, funciones, cines y precios. ¿Por dónde empezamos?',
            'thanks' => '¡A ti por preguntar! 😄 ¿Te ayudo con algo más?',
            'bye' => '¡Hasta luego! 👋 Que disfrutes tu película. Aquí estaré cuando quieras volver.',
            default => $returning
                ? '¡Hola de nuevo! 😊 ¿Seguimos viendo opciones? Puedo contarte funciones, precios o cines.'
                : '¡Hola! 👋 Soy el asistente de EventCore 🎬 Con gusto te ayudo con la cartelera, horarios, cines y precios. ¿Qué te gustaría ver?',
        };
    }

    /**
     * @param  list<array{name: string, arguments: array<string, mixed>}>  $plan
     * @param  list<array{name: string, data: array<mixed>|null, error: string|null}>  $results
     */
    public function render(array $plan, array $results): string
    {
        $first = $results[0] ?? null;

        if ($first === null) {
            return 'No pude generar una respuesta. Vuelve a intentarlo.';
        }

        if ($first['error'] !== null) {
            return 'No pude consultar el catálogo en este momento: '.$first['error'].'. Intenta de nuevo en unos segundos.';
        }

        $data = $first['data'] ?? [];

        return match ($first['name']) {
            'list_movies' => $this->movies($data),
            'list_showtimes' => $this->showtimes($data),
            'list_cinemas' => $this->cinemas($data),
            'get_showtime_seats' => $this->seats($data),
            'get_movie' => $this->movie($data),
            'get_showtime' => $this->showtimes(['showtimes' => [$data]]),
            default => 'Aquí están los datos que encontré: '.json_encode($data, JSON_UNESCAPED_UNICODE),
        };
    }

    /**
     * @param  array<mixed>  $data
     */
    private function movies(array $data): string
    {
        $movies = $data['movies'] ?? [];

        if ($movies === []) {
            return 'No encontré películas con esos filtros. Puedo buscar otra vez con distinto estado o cine.';
        }

        $lines = [];

        foreach ($movies as $movie) {
            $status = self::STATUS_LABELS[$movie['status'] ?? ''] ?? ($movie['status'] ?? '');
            $line = '• '.($movie['title'] ?? 'Sin título');

            if (! empty($movie['duration_minutes'])) {
                $line .= ' ('.$movie['duration_minutes'].' min)';
            }

            if (! empty($movie['rating'])) {
                $line .= ' — calificación '.$movie['rating'];
            }

            if ($status !== '') {
                $line .= ' ['.$status.']';
            }

            $lines[] = $line;
        }

        $total = $data['pagination']['total'] ?? count($movies);
        $header = $total > count($movies)
            ? 'Encontré '.$total.' películas en total, aquí van las primeras '.count($movies).':'
            : 'Encontré '.$total.' película(s):';

        return $header."\n\n".implode("\n", $lines)."\n\n¿Quieres los horarios de alguna de ellas?";
    }

    /**
     * @param  array<mixed>  $data
     */
    private function movie(array $data): string
    {
        if ($data === []) {
            return 'No encontré esa película.';
        }

        $title = $data['title'] ?? 'Película';
        $status = self::STATUS_LABELS[$data['status'] ?? ''] ?? ($data['status'] ?? '');
        $text = '🎬 '.$title;

        if (! empty($data['duration_minutes'])) {
            $text .= ' — '.$data['duration_minutes'].' min';
        }

        if (! empty($data['rating'])) {
            $text .= ', calificación '.$data['rating'];
        }

        if ($status !== '') {
            $text .= ' ['.$status.']';
        }

        $showtimes = $data['showtimes'] ?? [];
        $lines = [$text];

        if (! empty($data['description'])) {
            $lines[] = '';
            $lines[] = $data['description'];
        }

        if ($showtimes === []) {
            $lines[] = '';
            $lines[] = 'Por el momento no tiene funciones programadas.';

            return implode("\n", $lines);
        }

        $lines[] = '';
        $lines[] = 'Funciones:';

        foreach ($showtimes as $showtime) {
            $lines[] = '• '.$this->formatShowtime($showtime, (string) $title);
        }

        return implode("\n", $lines);
    }

    /**
     * @param  array<mixed>  $data
     */
    private function showtimes(array $data): string
    {
        $showtimes = $data['showtimes'] ?? [];

        if ($showtimes === []) {
            return 'No hay funciones registradas con esos criterios (fecha/cine/película). Puedo buscar en otra fecha.';
        }

        $lines = [];

        foreach ($showtimes as $showtime) {
            $lines[] = '• '.$this->formatShowtime($showtime);
        }

        $total = $data['pagination']['total'] ?? count($showtimes);
        $header = $total > count($showtimes)
            ? 'Encontré '.$total.' funciones, aquí van las primeras '.count($showtimes).':'
            : 'Encontré '.$total.' función(es):';

        return $header."\n\n".implode("\n", $lines)."\n\n¿Te ayudo con los precios o la disponibilidad de butacas?";
    }

    /**
     * @param  array<mixed>  $showtime
     */
    private function formatShowtime(array $showtime, ?string $movieTitle = null): string
    {
        $start = isset($showtime['start_time'])
            ? Carbon::parse($showtime['start_time'])->format('d/m/Y H:i')
            : 'Fecha no definida';

        $movie = $showtime['movie']['title'] ?? $movieTitle ?? 'Película';
        $format = $showtime['format'] ?? '';
        $auditorium = $showtime['auditorium']['name'] ?? '';
        $cinema = $showtime['auditorium']['cinema']['name'] ?? '';

        $text = $start.' — '.$movie;

        if ($format !== '') {
            $text .= ' ['.$format.']';
        }

        if ($cinema !== '') {
            $text .= ' en '.$cinema;
        }

        if ($auditorium !== '') {
            $text .= ' (sala '.$auditorium.')';
        }

        if (! empty($showtime['id'])) {
            $text .= ' — id '.$showtime['id'];
        }

        return $text;
    }

    /**
     * @param  array<mixed>  $data
     */
    private function cinemas(array $data): string
    {
        $cinemas = $data['cinemas'] ?? [];

        if ($cinemas === []) {
            return 'No encontré cines con ese filtro de ciudad.';
        }

        $lines = [];

        foreach ($cinemas as $cinema) {
            $line = '• '.($cinema['name'] ?? 'Cine');

            if (! empty($cinema['city'])) {
                $line .= ' — '.$cinema['city'];
            }

            if (isset($cinema['auditoriums_count'])) {
                $line .= ' ('.$cinema['auditoriums_count'].' sala(s))';
            }

            $lines[] = $line;
        }

        return 'Encontré '.count($cinemas).' cine(s):'."\n\n".implode("\n", $lines)."\n\n¿Quieres ver las funciones de alguno?";
    }

    /**
     * @param  array<mixed>  $data
     */
    private function seats(array $data): string
    {
        if ($data === []) {
            return 'Esta función no tiene butacas registradas en su sala.';
        }

        $active = 0;
        $maintenance = 0;

        foreach ($data as $seat) {
            if (($seat['status'] ?? 'active') === 'maintenance') {
                $maintenance++;
            } else {
                $active++;
            }
        }

        $text = 'La sala tiene '.count($data).' butacas: '.$active.' activas';
        $text .= $maintenance > 0 ? ' y '.$maintenance.' en mantenimiento.' : '.';

        return $text."\n\nNota: las butacas en mantenimiento no están disponibles para venta. Las reservas de boletos aún no están habilitadas.";
    }
}
