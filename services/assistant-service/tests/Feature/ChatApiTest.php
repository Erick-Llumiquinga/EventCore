<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\Support\MakesJwtTokens;
use Tests\TestCase;

class ChatApiTest extends TestCase
{
    use MakesJwtTokens, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['assistant.mock' => true]);
    }

    public function test_chat_requires_a_bearer_token(): void
    {
        $this->postJson('/api/chat', ['message' => 'hola'])
            ->assertUnauthorized()
            ->assertJsonPath('code', 500);
    }

    public function test_chat_returns_503_when_ai_is_not_configured(): void
    {
        config(['assistant.mock' => false, 'services.deepseek.api_key' => null]);

        $conversation = Conversation::factory()->create(['user_id' => 1]);

        $this->withToken($this->makeToken())
            ->postJson('/api/chat', [
                'message' => 'hola',
                'conversation_id' => $conversation->id,
            ])
            ->assertStatus(503)
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Asistente IA no configurado: define DEEPSEEK_API_KEY o activa ASSISTANT_MOCK=true');
    }

    public function test_chat_validates_the_message_field(): void
    {
        $conversation = Conversation::factory()->create(['user_id' => 1]);

        $this->withToken($this->makeToken())
            ->postJson('/api/chat', ['conversation_id' => $conversation->id])
            ->assertStatus(422)
            ->assertJsonPath('code', 500)
            ->assertJsonStructure(['code', 'message', 'data', 'errors']);
    }

    public function test_chat_requires_a_conversation_id(): void
    {
        $this->withToken($this->makeToken())
            ->postJson('/api/chat', ['message' => 'hola'])
            ->assertStatus(422)
            ->assertJsonPath('code', 500)
            ->assertJsonPath('errors.conversation_id.0', 'Debes indicar el conversation_id');

        $this->assertDatabaseCount('conversations', 0);
    }

    public function test_chat_rejects_a_malformed_conversation_id(): void
    {
        $this->withToken($this->makeToken())
            ->postJson('/api/chat', ['message' => 'hola', 'conversation_id' => 'no-es-uuid'])
            ->assertStatus(422)
            ->assertJsonPath('code', 500)
            ->assertJsonPath('errors.conversation_id.0', 'El identificador de conversación no es un UUID válido');
    }

    public function test_mock_chat_returns_json_and_persists_conversation(): void
    {
        Http::fake([
            '*' => Http::response($this->moviesPayload()),
        ]);

        $conversation = Conversation::factory()->create([
            'user_id' => 1,
            'title' => 'Nueva conversación',
        ]);

        $response = $this->withToken($this->makeToken())
            ->postJson('/api/chat', [
                'message' => '¿Qué películas hay en cartelera?',
                'conversation_id' => $conversation->id,
            ]);

        $response->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.mode', 'mock');

        $data = $response->json('data');
        $this->assertArrayHasKey('content', $data);
        $this->assertStringContainsString('Movie One', $data['content']);
        $this->assertSame('list_movies', $data['tools'][0]['name']);
        $this->assertTrue($data['tools'][0]['ok']);

        $conversation->refresh();
        $this->assertSame($data['conversation_id'], $conversation->id);
        $this->assertSame('¿Qué películas hay en cartelera?', $conversation->title);

        $this->assertDatabaseCount('messages', 2);
        $this->assertDatabaseHas('messages', ['role' => 'user', 'content' => '¿Qué películas hay en cartelera?']);
        $this->assertDatabaseHas('messages', ['role' => 'assistant']);

        $assistant = $conversation->messages()->where('role', 'assistant')->first();
        $this->assertSame('mock', $assistant->meta['mode']);
        $this->assertSame('list_movies', $assistant->meta['tools'][0]['name']);
        $this->assertStringContainsString('Movie One', $assistant->content);
        $this->assertSame($assistant->content, $data['content']);
        $this->assertSame($assistant->id, $data['message_id']);
    }

    public function test_mock_chat_reuses_an_existing_conversation(): void
    {
        Http::fake(['*' => Http::response($this->moviesPayload())]);

        $conversation = Conversation::factory()->create(['user_id' => 1, 'title' => 'Sesión previa']);

        $response = $this->withToken($this->makeToken())
            ->postJson('/api/chat', [
                'message' => 'y los horarios?',
                'conversation_id' => $conversation->id,
            ]);

        $response->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.conversation_id', $conversation->id);

        $this->assertSame(1, Conversation::count());
        $this->assertDatabaseCount('messages', 2);
        $this->assertSame('Sesión previa', Conversation::first()->title);
    }

    public function test_mock_chat_greets_without_calling_the_catalog(): void
    {
        Http::fake();

        $conversation = Conversation::factory()->create([
            'user_id' => 1,
            'title' => 'Nueva conversación',
        ]);

        $response = $this->withToken($this->makeToken())
            ->postJson('/api/chat', [
                'message' => 'hola',
                'conversation_id' => $conversation->id,
            ]);

        $response->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.mode', 'mock')
            ->assertJsonPath('data.tools', []);

        $this->assertStringContainsString('¡Hola!', $response->json('data.content'));
        $this->assertStringContainsString('asistente de EventCore', $response->json('data.content'));

        Http::assertNothingSent();

        $this->assertDatabaseCount('messages', 2);
        $this->assertDatabaseHas('messages', ['role' => 'user', 'content' => 'hola']);
        $this->assertDatabaseHas('messages', ['role' => 'assistant']);
    }

    public function test_mock_chat_greets_returning_users_differently(): void
    {
        Http::fake();

        $conversation = Conversation::factory()->create(['user_id' => 1, 'title' => 'Nueva conversación']);
        $conversation->messages()->create(['role' => 'user', 'content' => 'hola']);
        $conversation->messages()->create(['role' => 'assistant', 'content' => '¡Hola! ¿En qué te ayudo?']);

        $response = $this->withToken($this->makeToken())
            ->postJson('/api/chat', [
                'message' => 'hola',
                'conversation_id' => $conversation->id,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.tools', []);

        $this->assertStringContainsString('de nuevo', $response->json('data.content'));

        Http::assertNothingSent();

        $conversation->refresh();
        $this->assertSame('Nueva conversación', $conversation->title);
    }

    public function test_mock_chat_defaults_showtime_queries_to_today(): void
    {
        Http::fake([
            '*/showtimes*' => Http::response([
                'code' => 200,
                'message' => 'Funciones obtenidas correctamente',
                'data' => ['showtimes' => [], 'pagination' => ['total' => 0, 'per_page' => 15, 'current_page' => 1, 'last_page' => 1]],
            ]),
            '*' => Http::response($this->moviesPayload()),
        ]);

        $conversation = Conversation::factory()->create(['user_id' => 1]);

        $response = $this->withToken($this->makeToken())
            ->postJson('/api/chat', [
                'message' => '¿Qué horarios tienen las películas?',
                'conversation_id' => $conversation->id,
            ]);

        $response->assertOk();

        $tool = $response->json('data.tools')[0];

        $this->assertSame('list_showtimes', $tool['name']);
        $this->assertTrue($tool['ok']);
        $this->assertSame(now()->toDateString(), $tool['arguments']['date']);
    }

    public function test_mock_chat_details_a_movie_by_title(): void
    {
        $movieId = '11111111-1111-4111-8111-111111111111';

        Http::fake([
            '*/movies/'.$movieId => Http::response([
                'code' => 200,
                'message' => 'Película obtenida correctamente',
                'data' => [
                    'id' => $movieId,
                    'title' => 'Abyssal - Terror submarino',
                    'description' => 'Una estación de investigación en el fondo del océano.',
                    'duration_minutes' => 110,
                    'rating' => '+16',
                    'status' => 'published',
                    'showtimes' => [[
                        'id' => 'showtime-1',
                        'start_time' => '2026-11-12 19:00:00',
                        'format' => '2D',
                        'auditorium' => ['name' => 'Sala 1', 'cinema' => ['name' => 'Cine Center']],
                    ]],
                ],
            ]),
            '*' => Http::response([
                'code' => 200,
                'message' => 'Películas obtenidas correctamente',
                'data' => [
                    'movies' => [
                        ['id' => $movieId, 'title' => 'Abyssal - Terror submarino', 'status' => 'published'],
                        ['id' => '22222222-2222-4222-8222-222222222222', 'title' => 'Galaxias Perdidas', 'status' => 'published'],
                    ],
                    'pagination' => ['total' => 2, 'per_page' => 15, 'current_page' => 1, 'last_page' => 1],
                ],
            ]),
        ]);

        $conversation = Conversation::factory()->create(['user_id' => 1]);

        $response = $this->withToken($this->makeToken())
            ->postJson('/api/chat', [
                'message' => 'me ayudas con mas informacion de Abyssal',
                'conversation_id' => $conversation->id,
            ]);

        $response->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.mode', 'mock');

        $data = $response->json('data');

        $this->assertSame(['list_movies', 'get_movie'], array_column($data['tools'], 'name'));
        $this->assertTrue($data['tools'][0]['ok']);
        $this->assertTrue($data['tools'][1]['ok']);
        $this->assertStringContainsString('🎬 Abyssal - Terror submarino', $data['content']);
        $this->assertStringContainsString('Una estación de investigación', $data['content']);
        $this->assertStringContainsString('Funciones:', $data['content']);
        $this->assertStringContainsString('Cine Center', $data['content']);
    }

    public function test_mock_chat_reports_unknown_movie_details(): void
    {
        Http::fake(['*' => Http::response($this->moviesPayload())]);

        $conversation = Conversation::factory()->create(['user_id' => 1]);

        $response = $this->withToken($this->makeToken())
            ->postJson('/api/chat', [
                'message' => 'me ayudas con mas informacion de Godzilla',
                'conversation_id' => $conversation->id,
            ]);

        $response->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.tools.0.name', 'list_movies')
            ->assertJsonPath('data.content', 'No encontré esa película.');
    }

    public function test_chat_rejects_a_conversation_that_belongs_to_another_user(): void
    {
        $foreign = Conversation::factory()->create(['user_id' => 999]);

        $this->withToken($this->makeToken())
            ->postJson('/api/chat', [
                'message' => 'hola',
                'conversation_id' => $foreign->id,
            ])
            ->assertNotFound()
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Conversación no encontrada');
    }

    public function test_live_chat_executes_the_deepseek_tool_loop(): void
    {
        config([
            'assistant.mock' => false,
            'services.deepseek.api_key' => 'test-key',
        ]);

        Http::fake([
            '*chat/completions*' => Http::sequence()
                ->push($this->deepSeekToolCallStream(), 200, ['Content-Type' => 'text/event-stream'])
                ->push($this->deepSeekFinalStream(), 200, ['Content-Type' => 'text/event-stream']),
            '*' => Http::response($this->moviesPayload()),
        ]);

        $conversation = Conversation::factory()->create(['user_id' => 1]);

        $response = $this->withToken($this->makeToken())
            ->postJson('/api/chat', [
                'message' => '¿Qué películas están publicadas?',
                'conversation_id' => $conversation->id,
            ]);

        $response->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.mode', 'live');

        $data = $response->json('data');
        $this->assertSame('list_movies', $data['tools'][0]['name']);
        $this->assertSame('published', $data['tools'][0]['arguments']['status']);
        $this->assertSame('Aquí tienes la cartelera vigente.', $data['content']);

        $assistant = Message::query()->where('role', 'assistant')->first();
        $this->assertNotNull($assistant);
        $this->assertSame('live', $assistant->meta['mode']);
        $this->assertSame(1, count($assistant->meta['tools']));
        $this->assertSame('Aquí tienes la cartelera vigente.', $assistant->content);
        $this->assertSame($assistant->content, $data['content']);
    }

    public function test_live_chat_surfaces_catalog_errors_to_the_model(): void
    {
        config([
            'assistant.mock' => false,
            'services.deepseek.api_key' => 'test-key',
        ]);

        Http::fake([
            '*chat/completions*' => Http::sequence()
                ->push($this->deepSeekToolCallStream(), 200, ['Content-Type' => 'text/event-stream'])
                ->push($this->deepSeekFinalStream(), 200, ['Content-Type' => 'text/event-stream']),
            '*' => Http::response(['code' => 500, 'message' => 'Base de datos no disponible', 'data' => null], 503),
        ]);

        $conversation = Conversation::factory()->create(['user_id' => 1]);

        $response = $this->withToken($this->makeToken())
            ->postJson('/api/chat', [
                'message' => '¿Qué películas están publicadas?',
                'conversation_id' => $conversation->id,
            ]);

        $response->assertOk();

        $tool = $response->json('data.tools')[0];

        $this->assertFalse($tool['ok']);
        $this->assertSame('Base de datos no disponible', $tool['error']);
    }

    /**
     * @return array<string, mixed>
     */
    private function moviesPayload(): array
    {
        return [
            'code' => 200,
            'message' => 'Películas obtenidas correctamente',
            'data' => [
                'movies' => [
                    [
                        'uuid' => '11111111-1111-4111-8111-111111111111',
                        'title' => 'Movie One',
                        'duration_minutes' => 120,
                        'rating' => 'PG-13',
                        'status' => 'published',
                    ],
                    [
                        'uuid' => '22222222-2222-4222-8222-222222222222',
                        'title' => 'Movie Two',
                        'duration_minutes' => 95,
                        'rating' => 'G',
                        'status' => 'published',
                    ],
                ],
                'pagination' => [
                    'total' => 2,
                    'per_page' => 15,
                    'current_page' => 1,
                    'last_page' => 1,
                ],
            ],
        ];
    }

    private function deepSeekToolCallStream(): string
    {
        return implode("\n\n", [
            'data: '.json_encode(['choices' => [['delta' => ['tool_calls' => [[
                'index' => 0,
                'id' => 'call_abc',
                'function' => ['name' => 'list_movies', 'arguments' => ''],
            ]]], 'finish_reason' => null]]]),
            'data: '.json_encode(['choices' => [['delta' => ['tool_calls' => [[
                'index' => 0,
                'function' => ['arguments' => '{"status":"published"}'],
            ]]], 'finish_reason' => null]]]),
            'data: '.json_encode(['choices' => [['delta' => [], 'finish_reason' => 'tool_calls']]]),
            'data: [DONE]',
            '',
        ]);
    }

    private function deepSeekFinalStream(): string
    {
        return implode("\n\n", [
            'data: '.json_encode(['choices' => [['delta' => ['content' => 'Aquí tienes la cartelera vigente.'], 'finish_reason' => null]]]),
            'data: '.json_encode(['choices' => [['delta' => [], 'finish_reason' => 'stop']], 'usage' => ['prompt_tokens' => 12, 'completion_tokens' => 6]]),
            'data: [DONE]',
            '',
        ]);
    }
}
