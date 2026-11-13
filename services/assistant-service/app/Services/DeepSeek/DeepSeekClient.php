<?php

namespace App\Services\DeepSeek;

use GuzzleHttp\Psr7\Utils;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Streaming client for the DeepSeek chat completions API (OpenAI-compatible).
 * Parses server-sent events, forwards content deltas as they arrive and
 * assembles fragmented tool_call deltas.
 */
class DeepSeekClient
{
    /**
     * @param  array<int, array<string, mixed>>  $messages
     * @param  array<int, array<string, mixed>>  $tools
     * @param  callable(string): void  $onDelta
     *
     * @throws DeepSeekException
     */
    public function streamChat(array $messages, array $tools, callable $onDelta): ChatResult
    {
        $payload = [
            'model' => config('assistant.model'),
            'messages' => $messages,
            'stream' => true,
            'max_tokens' => (int) config('assistant.max_tokens'),
            'temperature' => (float) config('assistant.temperature'),
        ];

        if ($tools !== []) {
            $payload['tools'] = $tools;
            $payload['tool_choice'] = 'auto';
        }

        try {
            $response = Http::withOptions(['stream' => true])
                ->withHeaders([
                    'Authorization' => 'Bearer '.config('services.deepseek.api_key'),
                    'Accept' => 'text/event-stream',
                ])
                ->timeout((int) config('assistant.timeout', 120))
                ->post(config('services.deepseek.base_url').'/chat/completions', $payload);
        } catch (ConnectionException $e) {
            throw new DeepSeekException('No se pudo conectar con DeepSeek: '.$e->getMessage(), 0, $e);
        }

        if (! $response->successful()) {
            throw new DeepSeekException(
                'DeepSeek respondió '.$response->status().': '.mb_substr($response->body(), 0, 300),
                $response->status(),
            );
        }

        return $this->readEventStream($response, $onDelta);
    }

    /**
     * @param  callable(string): void  $onDelta
     */
    private function readEventStream(Response $response, callable $onDelta): ChatResult
    {
        $stream = $response->toPsrResponse()->getBody();

        $content = '';
        $finishReason = null;
        $usage = [];
        /** @var array<int, array{id: string, name: string, arguments: string}> $toolAccumulator */
        $toolAccumulator = [];

        try {
            while (! $stream->eof()) {
                $line = Utils::readLine($stream);

                if ($line === '') {
                    break;
                }

                $line = rtrim($line, "\r\n");

                // Ignore SSE metadata (event:, id:, retry:) and comment lines.
                if ($line === '' || ! str_starts_with($line, 'data:')) {
                    continue;
                }

                $data = trim(substr($line, 5));

                if ($data === '[DONE]') {
                    break;
                }

                $event = json_decode($data, true);

                if (! is_array($event)) {
                    continue;
                }

                if (! empty($event['usage']) && is_array($event['usage'])) {
                    $usage = array_merge($usage, $event['usage']);
                }

                $choice = $event['choices'][0] ?? null;

                if (! is_array($choice)) {
                    continue;
                }

                if (array_key_exists('finish_reason', $choice) && $choice['finish_reason'] !== null) {
                    $finishReason = (string) $choice['finish_reason'];
                }

                $delta = $choice['delta'] ?? [];

                if (is_string($delta['content'] ?? null) && $delta['content'] !== '') {
                    $content .= $delta['content'];
                    $onDelta($delta['content']);
                }

                foreach ($delta['tool_calls'] ?? [] as $fragment) {
                    if (! is_array($fragment)) {
                        continue;
                    }

                    $index = (int) ($fragment['index'] ?? 0);

                    $toolAccumulator[$index] ??= ['id' => '', 'name' => '', 'arguments' => ''];
                    $toolAccumulator[$index]['id'] .= (string) ($fragment['id'] ?? '');
                    $toolAccumulator[$index]['name'] .= (string) ($fragment['function']['name'] ?? '');
                    $toolAccumulator[$index]['arguments'] .= (string) ($fragment['function']['arguments'] ?? '');
                }
            }
        } catch (Throwable $e) {
            throw new DeepSeekException('Error leyendo la respuesta de DeepSeek: '.$e->getMessage(), 0, $e);
        } finally {
            $stream->close();
        }

        ksort($toolAccumulator);
        $toolCalls = [];

        foreach ($toolAccumulator as $toolCall) {
            if ($toolCall['name'] === '') {
                continue;
            }

            $arguments = json_decode($toolCall['arguments'] !== '' ? $toolCall['arguments'] : '{}', true);

            $toolCalls[] = [
                'id' => $toolCall['id'] !== '' ? $toolCall['id'] : 'call_'.uniqid(),
                'name' => $toolCall['name'],
                'arguments' => is_array($arguments) ? $arguments : [],
            ];
        }

        return new ChatResult($content, $toolCalls, $finishReason, $usage);
    }
}
