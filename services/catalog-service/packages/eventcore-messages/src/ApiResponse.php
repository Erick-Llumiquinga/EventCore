<?php

namespace EventCore\Messages;

use Illuminate\Http\JsonResponse;

/**
 * Shared response contract for every EventCore service:
 * success -> {code: 200, message, data} / error -> {code: 500, message, data: null[, errors]}.
 * The HTTP status carries the specific outcome (200, 201, 401, 403, 404...).
 */
trait ApiResponse
{
    protected function respondSuccess(mixed $data = null, ?string $message = null, int $httpStatus = 200): JsonResponse
    {
        return response()->json([
            'code' => 200,
            'message' => $message ?? Messages::get('common.success'),
            'data' => $data,
        ], $httpStatus);
    }

    protected function respondError(?string $message = null, int $httpStatus = 400, ?array $errors = null): JsonResponse
    {
        $payload = [
            'code' => 500,
            'message' => $message ?? Messages::get('common.request_error'),
            'data' => null,
        ];

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $httpStatus);
    }
}
