# 🤖 EventCore · Assistant Service

Asistente virtual IA en español que responde preguntas en lenguaje natural sobre el catálogo de cines (películas en cartelera, horarios, disponibilidad, estado de asientos) usando **function calling** contra `catalog-service` y devolviendo la respuesta completa en **un solo JSON**.

* **Stack**: Laravel 13 · PHP 8.4 · PostgreSQL `assistant_db` · Redis (cache/throttle)
* **IA**: DeepSeek (`deepseek-chat`) con modo *mock* local para desarrollo sin API key
* **API-only**: no incluye frontend; el chat responde JSON con la respuesta completa

---

## 🔄 Flujo de un mensaje

```
POST /api/assistant/chat (JWT)
  → valida entrada, crea/recupera Conversation
  → ToolCallLoop (hasta 5 iteraciones):
      mock  → MockIntentResolver + MockResponder (sin red externa al LLM)
      live  → DeepSeekClient (stream) → tool_call → CatalogClient → repite
  → persiste mensaje user + assistant en assistant_db
  → responde un JSON único con content + tools (o error 500)
```

Solo se permite **lectura** al catálogo: la whitelist de herramientas hace `GET` contra `catalog-service`.

---

## 📚 Endpoints

Internos (contenedor `assistant-service:8000`). Externos se consumen **vía API Gateway** con el prefijo `/api/assistant`:

| Método | Externo (gateway) | Interno | Auth | Descripción |
|---|---|---|---|---|
| GET | `/api/assistant/health` | `/api/health` | pública | Liveness + estado DB e IA |
| POST | `/api/assistant/chat` | `/api/chat` | JWT | Chat IA — JSON único (throttle 20/min) |
| GET | `/api/assistant/conversations` | `/api/conversations` | JWT | Historial propio (paginado) |
| GET | `/api/assistant/conversations/{id}` | `/api/conversations/{id}` | JWT | Conversación + mensajes |
| DELETE | `/api/assistant/conversations/{id}` | `/api/conversations/{id}` | JWT | Eliminar conversación |

El servicio **no publica puerto en el host**: todo el tráfico entra por `http://localhost:8000`.

### Respuesta JSON (`POST /api/assistant/chat`)

Request: `{ "message": "¿Qué hay en cartelera?", "session_id": "uuid?" }`

```json
{
  "code": 200,
  "message": "Respuesta del asistente generada",
  "data": {
    "conversation_id": "…",
    "message_id": 2,
    "mode": "mock",
    "usage": [],
    "content": "Encontré 3 película(s): …",
    "tools": [
      {"name": "list_movies", "arguments": {"status": "published"}, "ok": true, "error": null}
    ]
  }
}
```

* `content` — respuesta completa del asistente en un solo campo (sin streaming ni fragmentos).
* `tools` — cada llamada a herramienta ejecutada durante la respuesta (`name`, `arguments`, `ok`, `error`).
* `mode` — `mock` o `live`; `usage` — tokens consumidos del LLM (vacío en mock).
* Errores (validación, auth, 503 o fallo del loop) responden el JSON estándar `{code: 500, message, data: null}`.

### Herramientas (function calling)

| Tool | Argumentos | Consulta |
|---|---|---|
| `list_movies` | `status`, `title`, `cinema_id` | `GET /movies` |
| `get_movie` | `movie_id` (requerido) | `GET /movies/{id}` |
| `list_showtimes` | `date`, `cinema_id`, `movie_id` (**≥1 requerido**) | `GET /showtimes` |
| `get_showtime` | `showtime_id` (requerido) | `GET /showtimes/{id}` |
| `get_showtime_seats` | `showtime_id` (requerido) | `GET /showtimes/{id}/seats` |
| `list_cinemas` | `city` | `GET /cinemas` |

> El modo *mock* asume `date = hoy` en `list_showtimes` si el usuario no indica fecha/filtro.

---

## ⚙️ Configuración

```bash
cp .env.example .env
# Copiar APP_KEY y JWT_SECRET desde services/auth-service/.env (JWT_SECRET idéntico)

docker compose exec postgres psql -U postgres -c "CREATE DATABASE assistant_db;"
./eventcore.sh artisan assistant key:generate
./eventcore.sh artisan assistant migrate
```

Variables clave (la mayoría se inyectan desde el `.env` **raíz** vía `docker-compose.yml`):

| Variable | Default | Descripción |
|---|---|---|
| `ASSISTANT_MOCK` | `true` (en `.env` raíz) | `true` = sin DeepSeek, reglas locales |
| `DEEPSEEK_API_KEY` | vacío | Clave de https://platform.deepseek.com |
| `DEEPSEEK_MODEL` | `deepseek-chat` | Modelo a usar |
| `DEEPSEEK_MAX_TOOL_ITERATIONS` | `5` | Máximo de rondas tool calling por turno |
| `CATALOG_SERVICE_URL` | `http://catalog-service:8000/api` | Inyectado por compose (red interna) |
| `ASSISTANT_HISTORY_LIMIT` | `20` | Mensajes de historial enviados al modelo |

⚠️ El `CMD` del `Dockerfile` usa `artisan serve --no-reload`: sin esa bandera `php artisan serve` solo reenvía un *whitelist* de variables de entorno al proceso HTTP y `DEEPSEEK_API_KEY`/`CATALOG_SERVICE_URL`/`ASSISTANT_MOCK` no llegarían.

Modo real: `ASSISTANT_MOCK=false` + `DEEPSEEK_API_KEY` en el `.env` raíz y `docker compose up -d assistant-service`. El health refleja el modo: `data.ai = "mock" | "deepseek" | "not_configured"`.

---

## 🧪 Pruebas

```bash
# En el host (PHP 8.4 + Composer)
php artisan test --compact      # 21 tests: chat, tools, auth, conversaciones
vendor/bin/pint --dirty --format agent
```

Usan SQLite `:memory:` (ver `phpunit.xml`), `Http::fake` para el catálogo y el modo mock para el bucle del agente.

## 📦 Contrato de respuestas

Paquete local `packages/eventcore-messages` (`eventcore/messages`): todas las respuestas JSON siguen `{code, message, data}` con claves `assistant.*`. Tras editar `resources/messages.php` ejecuta `composer update eventcore/messages` (se copia a `vendor`, `symlink: false`).
