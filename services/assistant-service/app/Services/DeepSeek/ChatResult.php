<?php

namespace App\Services\DeepSeek;

/**
 * Normalized result of one streamed DeepSeek completion.
 *
 * @phpstan-type ToolCall array{id: string, name: string, arguments: array<string, mixed>}
 */
final class ChatResult
{
    /**
     * @param  list<ToolCall>  $toolCalls
     * @param  array<string, int>  $usage
     */
    public function __construct(
        public readonly string $content,
        public readonly array $toolCalls,
        public readonly ?string $finishReason,
        public readonly array $usage,
    ) {}

    public function hasToolCalls(): bool
    {
        return $this->toolCalls !== [];
    }
}
