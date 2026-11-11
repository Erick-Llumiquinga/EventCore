<?php

use App\Http\Controllers\AssistantController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ConversationController;
use Illuminate\Support\Facades\Route;

// Public liveness probe (Docker/monitoring cannot send tokens).
Route::get('/health', [AssistantController::class, 'health']);

// Every endpoint below requires a Bearer token issued by auth-service.
Route::middleware('jwt.verify')->group(function () {
    // SSE chat with the AI assistant (throttled to protect the LLM quota).
    Route::post('/chat', [ChatController::class, 'store'])->middleware('throttle:20,1');

    // Conversation history.
    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::get('/conversations/{conversation}', [ConversationController::class, 'show']);
    Route::delete('/conversations/{conversation}', [ConversationController::class, 'destroy']);
});
