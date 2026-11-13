<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChatRequest;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\Agent\ToolCallLoop;
use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Throwable;

class ChatController extends Controller
{
    use ApiResponse;

    public function __construct(private ToolCallLoop $loop) {}

    /**
     * POST /api/chat — chat with the AI assistant.
     *
     * Returns a single JSON payload with conversation/message ids,
     * mode, usage, full content and the catalog tools that ran.
     */
    public function store(ChatRequest $request): JsonResponse
    {
        $mock = (bool) config('assistant.mock');
        $apiKey = (string) config('services.deepseek.api_key');

        if (! $mock && $apiKey === '') {
            return $this->respondError(Messages::get('assistant.chat.not_configured'), 503);
        }

        $userId = (int) $request->attributes->get('auth_user_id');
        $token = (string) $request->bearerToken();
        $text = trim((string) $request->input('message'));

        $conversation = $this->resolveConversation($userId, $request->input('conversation_id'));

        if ($conversation instanceof JsonResponse) {
            return $conversation;
        }

        if ($conversation->messages()->count() === 0 && $conversation->title === 'Nueva conversación') {
            $conversation->update(['title' => Str::limit($text, 60)]);
        }

        $history = $this->history($conversation);

        $conversation->messages()->create([
            'role' => Message::ROLE_USER,
            'content' => $text,
        ]);
        $conversation->touch();

        $messages = array_merge(
            [['role' => 'system', 'content' => config('assistant.system_prompt')]],
            $history,
            [['role' => 'user', 'content' => $text]],
        );

        try {
            $result = $this->loop->run(
                $messages,
                $token,
                onTool: fn (): null => null,
                onDelta: fn (): null => null,
            );
        } catch (Throwable $e) {
            report($e);

            return $this->respondError(
                config('app.debug') ? $e->getMessage() : Messages::get('assistant.chat.failed'),
                500,
            );
        }

        $message = $conversation->messages()->create([
            'role' => Message::ROLE_ASSISTANT,
            'content' => $result->content,
            'meta' => [
                'mode' => $result->mode,
                'iterations' => $result->iterations,
                'truncated' => $result->truncated,
                'usage' => $result->usage,
                'tools' => $this->toolSummary($result->toolCalls),
            ],
        ]);
        $conversation->touch();

        return $this->respondSuccess([
            'conversation_id' => $conversation->id,
            'message_id' => $message->id,
            'mode' => $result->mode,
            'usage' => $result->usage,
            'content' => $result->content,
            'tools' => $this->toolSummary($result->toolCalls),
        ], Messages::get('assistant.chat.success'));
    }

    /**
     * @param  array<int, array{name: string, arguments: array<string, mixed>, ok: bool, error: string|null, data?: array<mixed>|null}>  $toolCalls
     * @return array<int, array{name: string, arguments: array<string, mixed>, ok: bool, error: string|null}>
     */
    private function toolSummary(array $toolCalls): array
    {
        return array_map(
            fn (array $entry) => [
                'name' => $entry['name'],
                'arguments' => $entry['arguments'],
                'ok' => $entry['ok'],
                'error' => $entry['error'],
            ],
            $toolCalls,
        );
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function history(Conversation $conversation): array
    {
        $limit = max(1, (int) config('assistant.history_limit'));

        return $conversation->messages()
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->reverse()
            ->map(fn (Message $message) => ['role' => $message->role, 'content' => $message->content])
            ->values()
            ->all();
    }

    /**
     * Look up the conversation the message belongs to. It must already exist
     * (POST /api/conversations) and belong to the caller.
     *
     * @param  mixed  $conversationId
     */
    private function resolveConversation(int $userId, $conversationId): Conversation|JsonResponse
    {
        $conversation = Conversation::query()
            ->where('user_id', $userId)
            ->where('id', (string) $conversationId)
            ->first();

        if (! $conversation) {
            return $this->respondError(Messages::get('assistant.conversation.not_found'), 404);
        }

        return $conversation;
    }
}
