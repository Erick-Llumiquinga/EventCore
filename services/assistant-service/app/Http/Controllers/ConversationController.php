<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/conversations — create an empty conversation for the caller.
     *
     * Body: { title?: string (max 120) }. Without a title the conversation is
     * created with the placeholder "Nueva conversación", which the first chat
     * message replaces with an excerpt of the text.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => ['nullable', 'string', 'max:120'],
        ], [
            'title.max' => 'El título no puede superar los 120 caracteres',
        ]);

        $userId = (int) $request->attributes->get('auth_user_id');
        $title = trim((string) $request->input('title', ''));

        $record = Conversation::create([
            'user_id' => $userId,
            'title' => $title !== '' ? $title : 'Nueva conversación',
        ]);

        return $this->respondSuccess([
            'conversation' => [
                'id' => $record->id,
                'title' => $record->title,
                'created_at' => $record->created_at?->toIso8601String(),
                'updated_at' => $record->updated_at?->toIso8601String(),
            ],
        ], Messages::get('assistant.conversations.created'), 201);
    }

    /**
     * GET /api/conversations — paginated list of the caller's conversations.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $paginator = Conversation::query()
            ->where('user_id', $userId)
            ->orderByDesc('updated_at')
            ->paginate(min(100, max(1, (int) $request->integer('per_page', 15))));

        return $this->respondSuccess([
            'conversations' => collect($paginator->items())->map(fn (Conversation $conversation) => [
                'id' => $conversation->id,
                'title' => $conversation->title,
                'created_at' => $conversation->created_at?->toIso8601String(),
                'updated_at' => $conversation->updated_at?->toIso8601String(),
            ])->values(),
            'pagination' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
            ],
        ], Messages::get('assistant.conversations.list'));
    }

    /**
     * GET /api/conversations/{conversation} — conversation with its messages.
     */
    public function show(Request $request, string $conversation): JsonResponse
    {
        $record = $this->findConversation($request, $conversation);

        if (! $record) {
            return $this->respondError(Messages::get('assistant.conversation.not_found'), 404);
        }

        $record->load(['messages' => fn ($query) => $query->orderBy('id')]);

        return $this->respondSuccess([
            'conversation' => [
                'id' => $record->id,
                'title' => $record->title,
                'created_at' => $record->created_at?->toIso8601String(),
                'updated_at' => $record->updated_at?->toIso8601String(),
            ],
            'messages' => $record->messages->map(fn (Message $message) => [
                'id' => $message->id,
                'role' => $message->role,
                'content' => $message->content,
                'meta' => $message->meta,
                'created_at' => $message->created_at?->toIso8601String(),
            ])->values(),
        ], Messages::get('assistant.conversation.show'));
    }

    /**
     * DELETE /api/conversations/{conversation} — delete a conversation and
     * its messages (cascade).
     */
    public function destroy(Request $request, string $conversation): JsonResponse
    {
        $record = $this->findConversation($request, $conversation);

        if (! $record) {
            return $this->respondError(Messages::get('assistant.conversation.not_found'), 404);
        }

        $record->delete();

        return $this->respondSuccess(null, Messages::get('assistant.conversation.deleted'));
    }

    private function findConversation(Request $request, string $conversation): ?Conversation
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        return Conversation::query()
            ->where('user_id', $userId)
            ->where('id', $conversation)
            ->first();
    }
}
