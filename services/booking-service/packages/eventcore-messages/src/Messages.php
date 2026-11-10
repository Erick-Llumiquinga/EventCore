<?php

namespace EventCore\Messages;

class Messages
{
    /**
     * Resolve a standard message by key.
     *
     * @param  array<string, scalar|null>  $replace  Values for `:placeholder` tokens.
     */
    public static function get(string $key, array $replace = []): string
    {
        $messages = config('messages');

        $message = is_array($messages) && array_key_exists($key, $messages)
            ? (string) $messages[$key]
            : $key;

        if ($replace !== []) {
            $placeholders = [];

            foreach ($replace as $name => $value) {
                $placeholders[':'.$name] = (string) $value;
            }

            $message = strtr($message, $placeholders);
        }

        return $message;
    }
}
