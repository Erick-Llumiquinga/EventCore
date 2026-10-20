# 🎟️ EventCore

Plataforma escalable de gestión y reserva de eventos construida bajo una arquitectura de **Microservicios** contenerizados con Docker y orquestados mediante un **API Gateway**.

---

## 🏗️ Arquitectura del Sistema

* **API Gateway**: Nginx Reverse Proxy (`http://localhost:8000`)
  * Puerta de entrada única para todo el tráfico de la API.
* **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (`http://localhost:5173`)
* **Auth Service**: Laravel 13 (PHP 8.4) + JWT Auth (Servicio interno en red Docker)
* **Base de Datos**: PostgreSQL 16 (`localhost:5432` / `auth_db`)
* **Caché y Locks**: Redis 7 (`localhost:6379`)

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
# Entorno raíz (Docker, Postgres, Redis)
cp .env.example .env

# Entorno de Auth Service
cp services/auth-service/.env.example services/auth-service/.env

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

# 4. Ejecutar migraciones y seeders (crea tablas y roles: admin, organizer, attendee)
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

* **Registro de Usuario (`POST /api/auth/register`)**:
  ```bash
  curl -X POST http://localhost:8000/api/auth/register \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d '{
      "name": "Admin User",
      "email": "admin@eventcore.com",
      "password": "password123",
      "password_confirmation": "password123",
      "role": "admin"
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

## 🛠️ Uso del Helper CLI (`eventcore.sh`)

Para evitar tener que escribir comandos largos de `docker compose exec ...`, utiliza `./eventcore.sh` desde la raíz:

### Comandos de Artisan (Laravel):
```bash
./eventcore.sh artisan auth migrate
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

Cuando el equipo esté listo para crear el siguiente microservicio (ej. `catalog-service` o `booking-service`), sigan estos pasos:

### 1. Crear el nuevo proyecto Laravel
Crea la carpeta dentro de `services/`:
```bash
# Ejemplo: services/catalog-service
```

### 2. Copiar el `Dockerfile` y `.dockerignore`
Copia el archivo `services/auth-service/Dockerfile` y `.dockerignore` a la nueva carpeta `services/catalog-service/`.

### 3. Registrar la nueva Base de Datos
En `.env` raíz, añade el nombre de la nueva base de datos a `POSTGRES_MULTIPLE_DATABASES`:
```env
POSTGRES_MULTIPLE_DATABASES=auth_db,catalog_db
```

### 4. Registrar el servicio en `docker-compose.yml`
Agrega el bloque correspondiente en la sección de microservicios:

```yaml
  catalog-service:
    build:
      context: ./services/catalog-service
      dockerfile: Dockerfile
    container_name: catalog-service
    restart: unless-stopped
    volumes:
      - ./services/catalog-service:/var/www/html
      - /var/www/html/vendor
    environment:
      DB_CONNECTION: pgsql
      DB_HOST: postgres
      DB_PORT: 5432
      DB_DATABASE: catalog_db
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
    location /api/events {
        proxy_pass http://catalog-service:8000;
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
  catalog)
    CONTAINER="catalog-service"
    ;;
```

### 7. Levantar el nuevo servicio
```bash
docker compose up -d --build catalog-service
```
