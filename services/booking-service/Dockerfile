
# 1. Base image with PHP CLI and extensions for development
FROM php:8.4-cli-alpine

# 2. Install system dependencies and extensions required by Laravel and Postgres/Redis
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    postgresql-dev \
    linux-headers \
    $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && docker-php-ext-install pdo pdo_pgsql bcmath

# 3. Install Composer globally from its official image
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 4. Working directory
WORKDIR /var/www/html

# 5. Copy manifests and the local package (path repository packages/eventcore-messages)
COPY composer.* ./
COPY packages/ ./packages/

# 6. Install Composer dependencies
RUN composer install --no-interaction --no-scripts --no-autoloader --prefer-dist --ignore-platform-reqs

# 7. Copy the project code
COPY . .

# 8. Generate the optimized Composer autoloader
RUN composer dump-autoload --optimize

# 9. Adjust permissions for `storage` and `bootstrap/cache` so that Laravel can write logs and sessions.
RUN chown -R www-data:www-data storage bootstrap/cache

# 10. Expose the service port (by convention: 8000 inside the container)
EXPOSE 8000

# 11. Fix runtime permissions (the bind mount shadows the build-time chown), then start
CMD ["sh", "-c", "mkdir -p storage/logs bootstrap/cache && chown -R www-data:www-data storage bootstrap/cache && exec php artisan serve --host=0.0.0.0 --port=8000"]
