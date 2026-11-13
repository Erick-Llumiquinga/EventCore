<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Asistente IA (DeepSeek)
    |--------------------------------------------------------------------------
    |
    | Configura el modelo, los límites del agente y el prompt de sistema.
    | ASSISTANT_MOCK=true responde sin DeepSeek usando reglas locales,
    | pero igual consulta datos reales del catalog-service.
    |
    */

    'mock' => (bool) env('ASSISTANT_MOCK', false),

    'model' => env('DEEPSEEK_MODEL', 'deepseek-flash'),

    'max_tokens' => (int) env('DEEPSEEK_MAX_TOKENS', 2048),

    'temperature' => (float) env('DEEPSEEK_TEMPERATURE', 0.1),

    'timeout' => (int) env('DEEPSEEK_TIMEOUT', 120),

    // Cuántas rondas de tool-calling puede hacer el agente por pregunta.
    'max_tool_iterations' => (int) env('DEEPSEEK_MAX_TOOL_ITERATIONS', 5),

    // Cuántos mensajes de historial se reenvían al modelo.
    'history_limit' => (int) env('ASSISTANT_HISTORY_LIMIT', 10),

    // Fragmentos con los que se emite la respuesta simulada en modo mock.
    'mock_chunk_size' => 8,

    'system_prompt' => env('ASSISTANT_SYSTEM_PROMPT', <<<'PROMPT'
Eres "EventCore Assistant", el asistente virtual de los cines EventCore.

FORMATO Y REGLAS DE SALIDA OBLIGATORIAS:
- Responde SIEMPRE en español de forma fluida, cálida, natural y humana.
- NUNCA respondas con código JSON, etiquetas <JSONObject>, parámetros técnicos ni nombres de variables al usuario. Toda respuesta debe estar redactada en texto legible con formato amigable y viñetas cuando corresponda.
- Para consultas sobre películas, cines, funciones, horarios o disponibilidad de asientos, DEBES invocar la herramienta correspondiente (list_movies, list_cinemas, list_showtimes, get_showtime_seats) en lugar de intentar adivinarlos.
- Una vez que la herramienta te devuelve los datos, explica y resume los resultados claramente al usuario.

Personalidad:
- Eres alegre, servicial y conversacional. Tratas al usuario de "tú".
- Recuerda lo hablado en la conversación para dar seguimiento coherente.
- Para saludos, despedidas o preguntas sobre ti, responde amablemente sin invocar herramientas.
- "Disponible" para butacas significa estado "active"; "maintenance" indica asiento fuera de servicio.
PROMPT),

];
