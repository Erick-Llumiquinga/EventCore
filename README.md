# 🎟️ EventCore

Plataforma escalable de gestión y reserva de eventos construida bajo una arquitectura de **Microservicios** contenerizados con Docker y orquestados mediante un **API Gateway**.

---

## 🏗️ Arquitectura del Sistema

* **API Gateway**: Nginx Reverse Proxy (`http://localhost:8000`)
  * Puerta de entrada única para todo el tráfico de la API.
* **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (`http://localhost:5173`)
* **Auth Service**: Laravel 13 (PHP 8.4) + JWT Auth (`http://localhost:8001`)
* **Catalog Service**: Laravel 13 (PHP 8.4) + PostgreSQL `catalog_db` (`http://localhost:8002`)
* **Booking Service**: Laravel 13 (PHP 8.4) + PostgreSQL `booking_db` — reservas de asientos con **locks en Redis** (10 min), códigos `EC-XXXXXX`, **QR firmado (HMAC-SHA256)** y tracking de estados
* **Assistant Service**: Laravel 13 (PHP 8.4) + **DeepSeek IA** (asistente virtual en español, responde en JSON único vía `/api/assistant/chat`)
* **Base de Datos**: PostgreSQL 16 (`localhost:5432` / `auth_db`, `catalog_db`, `assistant_db`, `booking_db`)
* **Caché, Locks y Blacklist JWT**: Redis 7 (`localhost:6379`)

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (debe estar abierto y corriendo)
* [Git](https://git-scm.com/)

---

## 🚀 Inicio Rápido (Onboarding para Desarrolladores)

Sigue estos pasos en orden para levantar todo el entorno local:

### 1. Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd EventCore
```

### 2. Configurar variables de entorno
Copia los archivos de ejemplo en cada servicio:

```bash
# Entorno raíz (Docker, Postgres, Redis, IA)
cp .env.example .env

# Entorno de Auth Service
cp services/auth-service/.env.example services/auth-service/.env

# Entorno de Catalog Service
cp services/catalog-service/.env.example services/catalog-service/.env

# Entorno de Booking Service
cp services/booking-service/.env.example services/booking-service/.env

# Entorno del Asistente IA
cp services/assistant-service/.env.example services/assistant-service/.env

# Entorno de Frontend
cp frontend/.env.example frontend/.env
```

### 3. Dar permisos al CLI de EventCore
En la raíz del proyecto, dale permisos de ejecución al script helper:
```bash
chmod +x eventcore.sh
```

### 4. Construir y levantar los contenedores
```bash
docker compose up -d --build
```
> Verifica el estado de los contenedores con:
> ```bash
> docker compose ps
> ```

---

## 🔐 Configuración Inicial de `auth-service`

Una vez levantados los contenedores, ejecuta estos comandos para inicializar la clave de la app, el secreto JWT y la base de datos:

```bash
# 1. Generar la clave de aplicación de Laravel
./eventcore.sh artisan auth key:generate

# 2. Generar el secreto para firmar los tokens JWT
./eventcore.sh artisan auth jwt:secret

# 3. Limpiar caché de configuración
./eventcore.sh artisan auth config:clear

# 4. Ejecutar migraciones y seeders (crea tablas y roles: admin, organizer, client)
./eventcore.sh artisan auth migrate:fresh --seed
```

---

## 🧪 Pruebas de Endpoints (A través del API Gateway)

> ⚠️ **Importante**: Todas las llamadas a las APIs deben dirigirse al **puerto 8000 (API Gateway)**. El Gateway se encarga de enrutar internamente a cada microservicio.

* **Health Check del Gateway**:
  ```bash
  curl http://localhost:8000/health
  ```
  *Respuesta:* `{"status": "Gateway OK"}`

* **Registro de Cliente (`POST /api/auth/register`)**:
  ```bash
  curl -X POST http://localhost:8000/api/auth/register \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d '{
      "identification": "1723456789",
      "first_name": "Carlos",
      "last_name": "Mendoza",
      "phone": "0998765432",
      "email": "carlos@gmail.com",
      "password": "password123",
      "password_confirmation": "password123"
    }'
  ```

* **Login de Usuario (`POST /api/auth/login`)**:
  ```bash
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d '{
      "email": "admin@eventcore.com",
      "password": "password123"
    }'
  ```

* **Perfil Protegido (`GET /api/auth/me`)**:
  ```bash
  curl -X GET http://localhost:8000/api/auth/me \
    -H "Accept: application/json" \
    -H "Authorization: Bearer <TU_ACCESS_TOKEN>"
  ```

---

## ⚙️ Configuración Inicial de `catalog-service`

> **IMPORTANTE**: `catalog-service` verifica los tokens emitidos por `auth-service`, por lo que su `JWT_SECRET` **debe ser idéntico** al de `services/auth-service/.env`. Nunca ejecutes `jwt:secret` en este servicio; copia el valor desde auth-service.

```bash
# 1. Entorno del servicio (si no existe)
cp services/catalog-service/.env.example services/catalog-service/.env

# 2. Copiar APP_KEY y JWT_SECRET desde services/auth-service/.env
#    (el JWT_SECRET debe ser EXACTAMENTE el mismo)

# 3. Generar tablas y datos de prueba (2 cines, 4 películas, 6 auditorios)
./eventcore.sh artisan catalog key:generate
./eventcore.sh artisan catalog config:clear
./eventcore.sh artisan catalog migrate:fresh --seed
```

### 🧪 Probar `catalog-service`:

```bash
# 1. Login en auth-service y obtener el token
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"super_admin@gamil.com","password":"12345678"}' | jq -r '.data.access_token')

# 2. Health check (público, sin token)
curl http://localhost:8002/api/health

# 3. Listar las películas del Cine Center (requiere Bearer token)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8002/api/cinemas/1/movies
```

* **Público**: `GET /api/health`
* **Jerarquía completa (token)**: `GET /api/cinemas[...]`, `.../movies[...]`, `.../auditoriums[...]` (ver tabla completa más abajo)
* **Administración (token + rol `admin`)**: `POST/PUT/DELETE` anidados bajo `/api/cinemas`

Todas las respuestas de `catalog-service` siguen el contrato `{code, message, data}` donde `code` es `200` en éxitos y `500` en errores (errores: `{code, message, data: null[, errors]}`). El estado HTTP conserva el detalle del fallo (`401`, `403`, `404`, `409`, `422`, `500`). Cualquier ruta inexistente (ej. `GET /auto` o `GET /api/auto`) responde `404` con mensaje `"Endpoint no encontrado"`.

### 📣 Mensajes estándar (`catalog-service/packages/eventcore-messages`)

Los mensajes de las respuestas de `catalog-service` viven en un **paquete composer local** (`eventcore/messages`) dentro del propio servicio, consumido vía repositorio `path`:

* Catálogo único: `services/catalog-service/packages/eventcore-messages/resources/messages.php` (clave ⇒ mensaje, con placeholders `:x`).
* Uso en código: `Messages::get('endpoint.not_found')` o `Messages::get('common.success')`.
* Contrato compartido: trait `EventCore\Messages\ApiResponse` (`respondSuccess()` / `respondError()`).
* Para sobreescribir mensajes: `php artisan vendor:publish --tag=eventcore-messages-config` y editar `config/messages.php`.
* Si modificas el paquete, ejecuta `composer update eventcore/messages` en `catalog-service` (el paquete se copia a `vendor`, `symlink: false`).

### 🎬 Dominio de cines

El catálogo modela una cadena de cines con jerarquía estricta: `cinemas` → `movies` (película/función a nivel cine, con precio) → `auditoriums` (salas donde se proyecta simultáneamente; un estreno puede jugar en varias salas a la vez). **Todos** los endpoints viven anidados bajo esa cadena; no existen rutas sueltas. La venta de boletos (stock/reservas) la gestiona `booking-service` (ver más abajo).

### 📄 Paginación

Los GET de listados (`/cinemas`, `/cinemas/{cinema}/movies`, `/cinemas/{cinema}/movies/{movie}/auditoriums`) **siempre** responden paginados. Sin parámetros usan los defaults `page=1` y `per_page=15`; se pueden ajustar con `?page=N&per_page=N` (máx. 100). Parámetros inválidos → `422`.

### 📚 Endpoints de `catalog-service`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/health` | pública | Liveness/readiness |
| GET | `/api/cinemas` | JWT | Cines paginados (`city`, `page`, `per_page`) |
| POST | `/api/cinemas` | JWT+admin | Crear cine |
| GET | `/api/cinemas/{cinema}` | JWT | Detalle con películas |
| PUT | `/api/cinemas/{cinema}` | JWT+admin | Actualizar cine |
| DELETE | `/api/cinemas/{cinema}` | JWT+admin | Soft delete (`409` si tiene películas) |
| GET | `/api/cinemas/{cinema}/movies` | JWT | Películas paginadas |
| POST | `/api/cinemas/{cinema}/movies` | JWT+admin | Crear película (requiere `price`) |
| GET | `/api/cinemas/{cinema}/movies/{movie}` | JWT | Detalle con auditorios y cine |
| PUT | `/api/cinemas/{cinema}/movies/{movie}` | JWT+admin | Actualizar película |
| DELETE | `/api/cinemas/{cinema}/movies/{movie}` | JWT+admin | Soft delete |
| GET | `/api/cinemas/{cinema}/movies/{movie}/auditoriums` | JWT | Auditorios paginados |
| POST | `/api/cinemas/{cinema}/movies/{movie}/auditoriums` | JWT+admin | Crear auditorio (name, capacity) |
| GET | `.../auditoriums/{auditorium}` | JWT | Detalle con película y cine |
| PUT | `.../auditoriums/{auditorium}` | JWT+admin | Actualizar auditorio |
| DELETE | `.../auditoriums/{auditorium}` | JWT+admin | Eliminar auditorio |

Cada nivel valida la cadena (la película debe pertenecer al cine, el auditorio a la película) → `404` con mensaje `"Endpoint no encontrado"` si no coincide.

---

## 🎟️ Configuración Inicial de `booking-service`

Servicio de venta de boletos: reserva de asientos con **locks atómicos en Redis** (TTL 10 min), ciclo de vida `pending → confirmed | cancelled | expired`, códigos de reserva `EC-XXXXXX`, **QR firmado con HMAC-SHA256**, tracking de eventos y email de confirmación (mailer `log` por defecto).

> **IMPORTANTE**: igual que `catalog-service` y `assistant-service`, verifica los tokens de `auth-service`, así que su `JWT_SECRET` **debe ser idéntico** al de `services/auth-service/.env` (nunca ejecutes `jwt:secret`; copia el valor).

```bash
# 1. Entorno del servicio (si no existe)
cp services/booking-service/.env.example services/booking-service/.env

# 2. Copiar APP_KEY y JWT_SECRET desde services/auth-service/.env

# 3. Generar tablas (la base booking_db la crea el init de Postgres en el primer arranque)
./eventcore.sh artisan booking key:generate
./eventcore.sh artisan booking config:clear
./eventcore.sh artisan booking migrate

# 4. (Opcional) Datos de ejemplo: reserva confirmada EC-784523 (con QR)
#    y reserva pendiente EC-AB12CD con asientos A1/A2 bloqueados en Redis
./eventcore.sh artisan booking migrate --seed
```

### 🔄 Flujo de una reserva

```
POST /api/booking/reservations (JWT)
  → valida showtime y asientos contra catalog-service
  → crea reserva `pending` + bloquea asientos en Redis (10 min)
POST /api/booking/reservations/{code}/confirm  (dentro de la ventana del lock)
  → "pago" simulado, fija asientos en Postgres, genera QR firmado y libera los locks
GET  /api/booking/reservations/{code}/qr
  → payload + SVG del QR (verificable con POST /api/booking/qr/verify)
```

Si el lock expira, la reserva pasa a `expired` (expiración perezosa al leer). `cancel` libera los locks inmediatamente. El mapa de asientos (`GET .../showtimes/{id}/seats`) fusiona en tiempo real: asientos físicos del catálogo + confirmados en Postgres + bloqueados en Redis.

### 📚 Endpoints de `booking-service`

Externos (vía gateway `http://localhost:8000`):

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/booking/health` | pública | Liveness + `seat_lock_ttl_seconds` |
| GET | `/api/booking/showtimes/{id}/seats` | JWT | Mapa unificado de asientos (catálogo + PG + locks Redis) |
| GET | `/api/booking/reservations` | JWT | Reservas propias paginadas (filtros `status`, `showtime_id`) |
| POST | `/api/booking/reservations` | JWT | Crea reserva `pending` y bloquea asientos 10 min en Redis |
| GET | `/api/booking/reservations/{code}` | JWT | Detalle por `EC-XXXXXX` o id (owner / admin / organizer) |
| POST | `/api/booking/reservations/{code}/confirm` | JWT | Confirma el pago, fija asientos y genera QR firmado |
| POST | `/api/booking/reservations/{code}/cancel` | JWT | Cancela y libera los locks Redis |
| GET | `/api/booking/reservations/{code}/qr` | JWT | QR (payload + SVG + data-URI) |
| GET | `/api/booking/reservations/{code}/tracking` | JWT | Eventos de tracking + cuenta regresiva del lock |
| POST | `/api/booking/qr/verify` | JWT | Verifica firma HMAC y estado del QR |
| GET | `/api/booking/admin/reservations` | JWT + admin/organizer | Todas las reservas + métricas (conteos y revenue) |

Respuestas JSON estándar `{code, message, data}`. Conflictos de asiento/estado → `409`; reservas ajenas → `403`.

---

## 🤖 Configuración Inicial de `assistant-service`

Asistente virtual IA que responde preguntas en lenguaje natural (películas en cartelera, horarios, disponibilidad, estado de asientos) consultando `catalog-service` mediante **function calling** y devolviendo la respuesta completa en **un solo JSON**.

> **IMPORTANTE**: igual que `catalog-service`, verifica los tokens de `auth-service`, así que su `JWT_SECRET` **debe ser idéntico** al de `services/auth-service/.env` (nunca ejecutes `jwt:secret`; copia el valor).

```bash
# 1. Entorno del servicio (si no existe)
cp services/assistant-service/.env.example services/assistant-service/.env

# 2. Copiar APP_KEY y JWT_SECRET desde services/auth-service/.env

# 3. La base assistant_db la crea el init de Postgres en el primer arranque
#    (solo ejecuta esto si el volumen de Postgres ya existía antes de agregar assistant_db):
#    docker compose exec postgres psql -U postgres -c "CREATE DATABASE assistant_db;"

# 4. Generar tablas de conversaciones y mensajes
./eventcore.sh artisan assistant key:generate
./eventcore.sh artisan assistant config:clear
./eventcore.sh artisan assistant migrate
```

### 🧠 Modos de IA

La IA se configura en la **raíz** (`.env` raíz) y se inyecta al contenedor:

* `ASSISTANT_MOCK=true` (**default**): sin API key. Un `MockIntentResolver` local interpreta la intención, ejecuta la misma herramienta de catálogo y redacta una respuesta en español. Ideal para desarrollo y demos.
* `ASSISTANT_MOCK=false` + `DEEPSEEK_API_KEY=<clave>`: modo real con DeepSeek (`deepseek-flash` = V4.1-Flash) y hasta 5 iteraciones de tool calling por turno.

El health reporta el modo activo: `{"service":"assistant-service","database":"ok","ai":"mock"|"deepseek"}`.

> ⚠️ `php artisan serve` solo reenvía un whitelist de variables al proceso HTTP; por eso el `CMD` del `Dockerfile` usa `artisan serve --host=0.0.0.0 --port=8000 --no-reload` (si no, `DEEPSEEK_API_KEY`/`CATALOG_SERVICE_URL` no llegan).

### 📚 Endpoints de `assistant-service`

Externos (vía gateway `http://localhost:8000`):

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/assistant/health` | pública | Liveness + estado de DB e IA |
| POST | `/api/assistant/conversations` | JWT | Crear conversación (devuelve su `id`) |
| POST | `/api/assistant/chat` | JWT | Chat IA en JSON único (20 req/min). Body: `{message, conversation_id}` |
| GET | `/api/assistant/conversations` | JWT | Conversaciones propias paginadas |
| GET | `/api/assistant/conversations/{id}` | JWT | Conversación con historial de mensajes |
| DELETE | `/api/assistant/conversations/{id}` | JWT | Eliminar conversación (own-only) |

El chat **no crea** conversaciones: primero llama a `POST /api/assistant/conversations` (body opcional `{title}`) y luego envía su `conversation_id` en cada mensaje. Si falta el `conversation_id` → `422`; si no existe o es ajena → `404`. Si la conversación está vacía y conserva el título por defecto, el primer mensaje la renombra con un extracto del texto.

### 💬 Respuesta de `POST /api/assistant/chat`

Request: `{ "message": "¿Qué hay en cartelera?", "conversation_id": "uuid" }`

```json
{
  "code": 200,
  "message": "...",
  "data": {
    "conversation_id": "…",
    "message_id": 2,
    "mode": "mock",
    "usage": [],
    "content": "Encontré 3 película(s)…",
    "tools": [{"name": "list_movies", "arguments": {}, "ok": true, "error": null}]
  }
}
```

Herramientas disponibles (solo lectura contra `catalog-service`): `list_movies`, `get_movie`, `list_showtimes` (requiere al menos `date`, `cinema_id` o `movie_id`), `get_showtime`, `get_showtime_seats`, `list_cinemas`.

Todas las respuestas (incluido el chat) siguen el contrato estándar `{code, message, data}`.

---

## 🛠️ Uso del Helper CLI (`eventcore.sh`)

Para evitar tener que escribir comandos largos de `docker compose exec ...`, utiliza `./eventcore.sh` desde la raíz. Alias disponibles: `auth`, `catalog`, `assistant`, `booking`, `front`.

### Comandos de Artisan (Laravel):
```bash
./eventcore.sh artisan auth migrate
./eventcore.sh artisan booking migrate
./eventcore.sh artisan auth make:controller MiControlador
./eventcore.sh artisan auth route:list
```

### Comandos de Composer:
```bash
./eventcore.sh composer auth install
./eventcore.sh composer auth require <paquete>
```

### Comandos de NPM (Frontend):
```bash
./eventcore.sh npm front install
./eventcore.sh npm front run build
```

### Acceso a la Terminal del Contenedor:
```bash
./eventcore.sh bash auth
./eventcore.sh bash front
```

---

## 📦 Guía: Cómo agregar un Nuevo Microservicio

Cuando el equipo esté listo para crear el siguiente microservicio, sigan estos pasos:

### 1. Crear el nuevo proyecto Laravel
Crea la carpeta dentro de `services/`:
```bash
# Ejemplo: services/pagos-service
```

### 2. Copiar el `Dockerfile` y `.dockerignore`
Copia el archivo `services/auth-service/Dockerfile` y `.dockerignore` a la nueva carpeta `services/<servicio>/`. El build usa el contexto de la carpeta del servicio (`context: ./services/<servicio>`), igual que los demás servicios.

### 3. Registrar la nueva Base de Datos
En `.env` raíz, añade el nombre de la nueva base de datos a `POSTGRES_MULTIPLE_DATABASES`:
```env
POSTGRES_MULTIPLE_DATABASES=auth_db,catalog_db,assistant_db,booking_db,pagos_db
```

### 4. Registrar el servicio en `docker-compose.yml`
Agrega el bloque correspondiente en la sección de microservicios:

```yaml
  pagos-service:
    build:
      context: ./services/pagos-service
      dockerfile: Dockerfile
    container_name: pagos-service
    restart: unless-stopped
    volumes:
      - ./services/pagos-service:/var/www/html
      - /var/www/html/vendor
    environment:
      DB_CONNECTION: pgsql
      DB_HOST: postgres
      DB_PORT: 5432
      DB_DATABASE: pagos_db
      DB_USERNAME: ${DB_USER:-postgres}
      DB_PASSWORD: ${DB_PASSWORD:-secret}
      REDIS_HOST: redis
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - eventcore-net
```

### 5. Configurar la ruta en el API Gateway
Abre `docker/gateway/default.conf` y agrega la regla de enrutamiento:

```nginx
    # /api/pagos/xxx -> http://pagos-service:8000/api/xxx  (se descarta el prefijo)
    location /api/pagos/ {
        proxy_pass http://pagos-service:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```

Luego recarga el gateway:
```bash
docker compose restart api-gateway
```

### 6. Registrar el atajo en `eventcore.sh`
Abre `eventcore.sh` y añade el mapeo dentro del bloque `case "$SERVICE" in`:

```bash
  pagos)
    CONTAINER="pagos-service"
    ;;
```

### 7. Levantar el nuevo servicio
```bash
docker compose up -d --build pagos-service
```
