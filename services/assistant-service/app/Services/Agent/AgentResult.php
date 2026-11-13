<?php

namespace App\Services\Agent;

/**
 * Outcome of one agent run: the final answer plus the tool calls that
 * produced it.
 *
 * @phpstan-type ToolLogEntry array{name: string, arguments: array<string, mixed>, ok: bool, error: string|null, data?: array<mixed>|null}
 */
final class AgentResult
{
    /**
     * @param  list<ToolLogEntry>  $toolCalls
     * @param  array<string, int>  $usage
     */
    public function __construct(
        public readonly string $content,
        public readonly array $toolCalls,
        public readonly array $usage,
        public readonly int $iterations,
        public readonly string $mode,
        public readonly bool $truncated = false,
    ) {}
}
