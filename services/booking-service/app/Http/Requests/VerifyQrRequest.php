<?php

namespace App\Http\Requests;

class VerifyQrRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'qr_payload' => ['required'],
        ];
    }
}
