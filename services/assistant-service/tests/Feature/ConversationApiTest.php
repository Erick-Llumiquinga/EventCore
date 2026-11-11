<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\MakesJwtTokens;
use Tests\TestCase;

class ConversationApiTest extends TestCase
{
    use MakesJwtTokens, RefreshDatabase;

    public function test_conversations_require_a_bearer_token(): void
    {
        $this->getJson('/api/conversations')
            ->assertUnauthorized()
            ->assertJsonPath('code', 500);
    }

    public function test_conversations_index_returns_only_the_caller_conversations(): void
    {
        Conversation::factory()->count(2)->create(['user_id' => 1]);
        Conversation::factory()->create(['user_id' => 999, 'title' => 'Ajena']);

        $this->withToken($this->makeToken())
            ->getJson('/api/conversations')
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.pagination.total', 2)
            ->assertJsonStructure(['code', 'message', 'data' => [
                'conversations',
                'pagination' => ['total', 'per_page', 'current_page', 'last_page'],
            ]]);
    }

    public function test_conversation_show_returns_messages_in_order(): void
    {
        $conversation = Conversation::factory()->create(['user_id' => 1, 'title' => 'Consulta']);
        $conversation->messages()->create(['role' => 'user', 'content' => 'Hola']);
        $conversation->messages()->create([
            'role' => 'assistant',
            'content' => '¡Hola! ¿En qué te ayudo?',
            'meta' => ['mode' => 'mock'],
        ]);

        $this->withToken($this->makeToken())
            ->getJson('/api/conversations/'.$conversation->id)
            ->assertOk()
            ->assertJsonPath('data.conversation.title', 'Consulta')
            ->assertJsonPath('data.messages.0.role', 'user')
            ->assertJsonPath('data.messages.1.role', 'assistant')
            ->assertJsonPath('data.messages.1.meta.mode', 'mock');
    }

    public function test_conversation_show_hides_conversations_of_other_users(): void
    {
        $foreign = Conversation::factory()->create(['user_id' => 999]);

        $this->withToken($this->makeToken())
            ->getJson('/api/conversations/'.$foreign->id)
            ->assertNotFound()
            ->assertJsonPath('message', 'Conversación no encontrada');
    }

    public function test_conversation_delete_removes_its_messages(): void
    {
        $conversation = Conversation::factory()->create(['user_id' => 1]);
        $conversation->messages()->create(['role' => 'user', 'content' => 'Hola']);

        $this->withToken($this->makeToken())
            ->deleteJson('/api/conversations/'.$conversation->id)
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('message', 'Conversación eliminada correctamente');

        $this->assertDatabaseCount('conversations', 0);
        $this->assertDatabaseCount('messages', 0);
    }

    public function test_conversation_delete_rejects_a_foreign_conversation(): void
    {
        $foreign = Conversation::factory()->create(['user_id' => 999]);
        Message::factory()->create(['conversation_id' => $foreign->id]);

        $this->withToken($this->makeToken())
            ->deleteJson('/api/conversations/'.$foreign->id)
            ->assertNotFound();

        $this->assertDatabaseCount('conversations', 1);
    }
}
