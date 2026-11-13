<?php

namespace App\Http\Requests;

use EventCore\Messages\Messages;
use Illuminate\Foundation\Http\FormRequest;

class ChatRequest extends FormRequest
{
    /**
     * Authorization runs in the jwt.verify middleware.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'message' => ['required', 'string', 'min:1', 'max:4000'],
            'conversation_id' => ['required', 'uuid'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'message.required' => Messages::get('assistant.message.invalid'),
            'message.max' => 'El mensaje no puede superar los 4000 caracteres',
            'conversation_id.required' => Messages::get('assistant.conversation.id_required'),
            'conversation_id.uuid' => 'El identificador de conversación no es un UUID válido',
        ];
    }
}
