<?php

namespace App\Services\Agent;

use App\Services\Catalog\CatalogException;
use App\Services\DeepSeek\ChatResult;
use App\Services\DeepSeek\DeepSeekClient;
use App\Services\DeepSeek\DeepSeekException;
use App\Services\Tools\MockIntentResolver;
use App\Services\Tools\MockResponder;
use App\Services\Tools\ToolException;
use App\Services\Tools\ToolRegistry;

/**
 * The agent loop: asks DeepSeek for a completion with the catalog tools,
 * executes each requested tool against catalog-service and feeds the results
 * back until the model produces a final answer.
 *
 * When ASSISTANT_MOCK=true the loop skips DeepSeek entirely, resolves the
 * intent with local rules and renders the answer from real tool data.
 */
class ToolCallLoop
{
    public function __construct(
        private DeepSeekClient $deepseek,
        private ToolRegistry $tools,
        private MockIntentResolver $mockIntent,
        private MockResponder $mockResponder,
    ) {}

    /**
     * @param  array<int, array<string, mixed>>  $messages
     * @param  callable(array{name: string, arguments: array<string, mixed>, ok: bool, error: string|null}): void  $onTool
     * @param  callable(string): void  $onDelta
     *
     * @throws DeepSeekException
     */
    public function run(array $messages, string $token, callable $onTool, callable $onDelta): AgentResult
    {
        if (config('assistant.mock')) {
            return $this->runMock($messages, $token, $onTool, $onDelta);
        }

        return $this->runLive($messages, $token, $onTool, $onDelta);
    }

    /**
     * @param  array<int, array<string, mixed>>  $messages
     * @param  callable(array{name: string, arguments: array<string, mixed>, ok: bool, error: string|null}): void  $onTool
     * @param  callable(string): void  $onDelta
     *
     * @throws DeepSeekException
     */
    private function runLive(array $messages, string $token, callable $onTool, callable $onDelta): AgentResult
    {
        $maxIterations = max(1, (int) config('assistant.max_tool_iterations'));
        $toolLog = [];
        $usage = [];
        $iterations = 0;
        $content = '';
        $truncated = false;

        while ($iterations < $maxIterations) {
            $iterations++;

            $result = $this->deepseek->streamChat($messages, $this->tools->definitions(), $onDelta);
            $content = $result->content;

            foreach ($result->usage as $key => $value) {
                if (is_numeric($value)) {
                    $usage[$key] = ($usage[$key] ?? 0) + (int) $value;
                }
            }

            if (! $result->hasToolCalls()) {
                return new AgentResult($content, $toolLog, $usage, $iterations, 'live');
            }

            $messages[] = $this->assistantToolCallMessage($result);

            foreach ($result->toolCalls as $toolCall) {
                $entry = $this->executeTool($toolCall['name'], $toolCall['arguments'], $token);
                $toolLog[] = $entry;
                $onTool($entry);

                $messages[] = [
                    'role' => 'tool',
                    'tool_call_id' => $toolCall['id'],
                    'name' => $toolCall['name'],
                    'content' => json_encode(
                        $entry['ok'] ? $entry['data'] : ['error' => $entry['error']],
                        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
                    ),
                ];
            }
        }

        $truncated = true;

        if (trim($content) === '') {
            $content = 'No pude completar la consulta porque se alcanzÃ³ el lÃ­mite de consultas al catÃ¡logo. '
                .'Puedes simplificar la pregunta o intentarlo de nuevo.';
            $onDelta($content);
        }

        return new AgentResult($content, $toolLog, $usage, $iterations, 'live', $truncated);
    }

    /**
     * @param  array<int, array<string, mixed>>  $messages
     * @param  callable(array{name: string, arguments: array<string, mixed>, ok: bool, error: string|null}): void  $onTool
     * @param  callable(string): void  $onDelta
     */
    private function runMock(array $messages, string $token, callable $onTool, callable $onDelta): AgentResult
    {
        $question = $this->lastUserMessage($messages);
        $plan = $this->mockIntent->resolve($question);

        if (($plan[0]['name'] ?? '') === 'conversational') {
            $answer = $this->mockResponder->conversational(
                (string) ($plan[0]['arguments']['intent'] ?? 'greeting'),
                $this->hasPriorUserMessages($messages),
            );
            $this->emitAnswer($answer, $onDelta);

            return new AgentResult($answer, [], [], 1, 'mock');
        }

        $preResults = [];
        $toolLog = [];

        if (($plan[0]['name'] ?? '') === 'get_movie' && ! isset($plan[0]['arguments']['movie_id'])) {
            [$plan, $preResults, $toolLog] = $this->resolveMovieDetail($plan, $token, $onTool);
        }

        $results = [];

        foreach ($plan as $index => $call) {
            if (isset($preResults[$index])) {
                $results[] = $preResults[$index];

                continue;
            }

            $entry = $this->executeTool($call['name'], $call['arguments'], $token);
            $toolLog[] = $entry;
            $onTool($entry);

            $results[] = [
                'name' => $entry['name'],
                'data' => $entry['data'],
                'error' => $entry['error'],
            ];
        }

        $answer = $this->mockResponder->render($plan, $results);
        $this->emitAnswer($answer, $onDelta);

        return new AgentResult($answer, $toolLog, [], 1, 'mock');
    }

    /**
     * Streams the mock answer in small chunks through the delta callback.
     */
    private function emitAnswer(string $answer, callable $onDelta): void
    {
        $chunkSize = max(1, (int) config('assistant.mock_chunk_size', 8));

        foreach (mb_str_split($answer, $chunkSize) as $chunk) {
            $onDelta($chunk);
        }
    }

    /**
     * True when the conversation already exchanged messages before this turn,
     * so greetings can acknowledge the ongoing chat.
     *
     * @param  array<int, array<string, mixed>>  $messages
     */
    private function hasPriorUserMessages(array $messages): bool
    {
        $userMessages = 0;

        foreach ($messages as $message) {
            if (($message['role'] ?? '') === 'user') {
                $userMessages++;

                if ($userMessages >= 2) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Resolves the mock `get_movie {title}` pseudo-plan to a concrete call:
     * lists the published catalog, matches the title locally and returns the
     * get_movie call with the real movie_id. When nothing matches, the plan
     * renders the "not found" answer from an empty get_movie result.
     *
     * @param  list<array{name: string, arguments: array<string, mixed>}>  $plan
     * @param  callable(array{name: string, arguments: array<string, mixed>, ok: bool, error: string|null}): void  $onTool
     * @return array{0: list<array{name: string, arguments: array<string, mixed>}>, 1: list<array{name: string, data: array<mixed>|null, error: string|null}>, 2: list<array{name: string, arguments: array<string, mixed>, ok: bool, error: string|null, data: array<mixed>|null}>}
     */
    private function resolveMovieDetail(array $plan, string $token, callable $onTool): array
    {
        $title = (string) ($plan[0]['arguments']['title'] ?? '');
        $toolLog = [];
        $maxPages = 10;

        for ($page = 1; $page <= $maxPages; $page++) {
            $entry = $this->executeTool('list_movies', ['status' => 'published', 'page' => $page], $token);
            $toolLog[] = $entry;
            $onTool($entry);

            if (! $entry['ok']) {
                return [
                    [['name' => 'list_movies', 'arguments' => ['status' => 'published', 'page' => $page]]],
                    [['name' => 'list_movies', 'data' => null, 'error' => $entry['error']]],
                    $toolLog,
                ];
            }

            $movies = $entry['data']['movies'] ?? [];

            foreach ($movies as $movie) {
                if ($title === '' || mb_stripos((string) ($movie['title'] ?? ''), $title) === false) {
                    continue;
                }

                $movieId = (string) ($movie['id'] ?? $movie['uuid'] ?? '');

                if ($movieId !== '') {
                    return [
                        [['name' => 'get_movie', 'arguments' => ['movie_id' => $movieId]]],
                        [],
                        $toolLog,
                    ];
                }
            }

            if ($page >= (int) ($entry['data']['pagination']['last_page'] ?? 1)) {
                break;
            }
        }

        return [
            [['name' => 'get_movie', 'arguments' => ['title' => $title]]],
            [['name' => 'get_movie', 'data' => [], 'error' => null]],
            $toolLog,
        ];
    }

    /**
     * @param  array<string, mixed>  $arguments
     * @return array{name: string, arguments: array<string, mixed>, ok: bool, error: string|null, data: array<mixed>|null}
     */
    private function executeTool(string $name, array $arguments, string $token): array
    {
        try {
            $data = $this->tools->execute($name, $arguments, $token);

            return ['name' => $name, 'arguments' => $arguments, 'ok' => true, 'error' => null, 'data' => $data];
        } catch (CatalogException|ToolException $e) {
            return ['name' => $name, 'arguments' => $arguments, 'ok' => false, 'error' => $e->getMessage(), 'data' => null];
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function assistantToolCallMessage(ChatResult $result): array
    {
        $toolCalls = [];

        foreach ($result->toolCalls as $toolCall) {
            $toolCalls[] = [
                'id' => $toolCall['id'],
                'type' => 'function',
                'function' => [
                    'name' => $toolCall['name'],
                    'arguments' => json_encode($toolCall['arguments'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                ],
            ];
        }

        return [
            'role' => 'assistant',
            'content' => $result->content !== '' ? $result->content : null,
            'tool_calls' => $toolCalls,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $messages
     */
    private function lastUserMessage(array $messages): string
    {
        for ($index = count($messages) - 1; $index >= 0; $index--) {
            if (($messages[$index]['role'] ?? '') === 'user') {
                return (string) ($messages[$index]['content'] ?? '');
            }
        }

        return '';
    }
}
