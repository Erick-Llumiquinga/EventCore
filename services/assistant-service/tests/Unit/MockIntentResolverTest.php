<?php

namespace Tests\Unit;

use App\Services\Tools\MockIntentResolver;
use Tests\TestCase;

class MockIntentResolverTest extends TestCase
{
    private MockIntentResolver $resolver;

    protected function setUp(): void
    {
        parent::setUp();

        $this->resolver = new MockIntentResolver;
    }

    public function test_detail_request_extracts_the_movie_title(): void
    {
        $plan = $this->resolver->resolve('me ayudas con mas informacion de Abyssal');

        $this->assertSame('get_movie', $plan[0]['name']);
        $this->assertSame('abyssal', $plan[0]['arguments']['title']);
    }

    public function test_detail_request_strips_parentheses_and_articles(): void
    {
        $plan = $this->resolver->resolve('me ayudas con mas informacion de Terror submarino (110 min)');

        $this->assertSame('get_movie', $plan[0]['name']);
        $this->assertSame('terror submarino', $plan[0]['arguments']['title']);
    }

    public function test_what_is_question_maps_to_movie_detail(): void
    {
        $plan = $this->resolver->resolve('¿Qué es Abyssal?');

        $this->assertSame('get_movie', $plan[0]['name']);
        $this->assertSame('abyssal', $plan[0]['arguments']['title']);
    }

    public function test_detail_trigger_without_a_title_falls_back_to_movies(): void
    {
        $plan = $this->resolver->resolve('dame informacion');

        $this->assertSame('list_movies', $plan[0]['name']);
    }

    public function test_cartelera_question_still_lists_movies(): void
    {
        $plan = $this->resolver->resolve('¿Qué películas están en cartelera?');

        $this->assertSame('list_movies', $plan[0]['name']);
        $this->assertSame('published', $plan[0]['arguments']['status']);
    }

    public function test_showtime_rule_wins_over_detail_rule(): void
    {
        $plan = $this->resolver->resolve('¿Qué horarios tiene Abyssal?');

        $this->assertSame('list_showtimes', $plan[0]['name']);
    }

    public function test_cinema_information_still_lists_cinemas(): void
    {
        $plan = $this->resolver->resolve('dame informacion de cines de guayaquil');

        $this->assertSame('list_cinemas', $plan[0]['name']);
    }

    public function test_greeting_maps_to_conversational_intent(): void
    {
        $plan = $this->resolver->resolve('hola');

        $this->assertSame('conversational', $plan[0]['name']);
        $this->assertSame('greeting', $plan[0]['arguments']['intent']);
    }

    public function test_small_talk_messages_map_to_conversational_intents(): void
    {
        $cases = [
            'buenos días' => 'greeting',
            '¿qué tal?' => 'greeting',
            'cómo estás' => 'how_are_you',
            '¿quién eres?' => 'identity',
            'gracias' => 'thanks',
            'adiós' => 'bye',
        ];

        foreach ($cases as $message => $intent) {
            $plan = $this->resolver->resolve($message);

            $this->assertSame('conversational', $plan[0]['name'], $message);
            $this->assertSame($intent, $plan[0]['arguments']['intent'], $message);
        }
    }

    public function test_greeting_followed_by_a_question_still_queries_the_catalog(): void
    {
        $plan = $this->resolver->resolve('hola, ¿qué películas hay en cartelera?');

        $this->assertSame('list_movies', $plan[0]['name']);
        $this->assertSame('published', $plan[0]['arguments']['status']);
    }
}
