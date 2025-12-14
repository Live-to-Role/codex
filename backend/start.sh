#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate

echo "Starting gunicorn on port $PORT..."
exec gunicorn codex.wsgi:application --bind 0.0.0.0:$PORT --access-logfile - --error-logfile - --log-level info
