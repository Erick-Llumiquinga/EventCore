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
            'session_id' => ['nullable', 'uuid'],
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
            'session_id.uuid' => 'El identificador de sesión no es un UUID válido',
        ];
    }
}
