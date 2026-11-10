<?php

namespace App\Http\Requests;

use EventCore\Messages\Messages;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

abstract class BaseFormRequest extends FormRequest
{
    /**
     * Authorization is handled by the jwt.verify / role middlewares.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Always answer validation failures with the API contract: {code, message, data, errors}.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'code' => 500,
            'message' => Messages::get('common.validation_errors'),
            'data' => null,
            'errors' => $validator->errors(),
        ], 422));
    }
}
