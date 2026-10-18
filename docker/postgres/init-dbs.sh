#!/bin/bash
set -e

function create_database() {
    local database=$1
    echo "  Creando base de datos '$database'..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -c "CREATE DATABASE $database;"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -c "GRANT ALL PRIVILEGES ON DATABASE $database TO $POSTGRES_USER;"
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
    echo "Inicializando bases de datos múltiples: $POSTGRES_MULTIPLE_DATABASES"
    for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
        create_database $db
    done
    echo "¡Bases de datos creadas exitosamente!"
fi