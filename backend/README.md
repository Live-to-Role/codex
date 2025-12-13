# Codex Backend

Django REST API backend for Codex - the community-curated TTRPG product metadata database.

## Tech Stack

- **Framework**: Django 5.0 + Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT (SimpleJWT) + django-allauth
- **Deployment**: Railway

## Local Development

### Prerequisites

- Python 3.11+
- PostgreSQL 14+

### Setup

1. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements-dev.txt
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your local settings
   ```

4. **Create database**
   ```bash
   createdb codex
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run development server**
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000/api/v1/`

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/identify` | Product identification by hash/title |
| `GET /api/v1/products/` | List products |
| `GET /api/v1/products/{slug}/` | Product detail |
| `GET /api/v1/publishers/` | List publishers |
| `GET /api/v1/systems/` | List game systems |
| `GET /api/v1/authors/` | List authors |
| `GET /api/v1/search` | Search across all entities |
| `POST /api/v1/contributions/` | Submit contribution |
| `POST /api/v1/auth/login/` | Login |
| `POST /api/v1/auth/registration/` | Register |

### Running Tests

```bash
pytest
```

### Code Quality

```bash
# Linting
ruff check .

# Formatting
black .
isort .

# Type checking
mypy .
```

## Deployment (Railway)

The backend is configured for Railway deployment:

1. Connect your GitHub repo to Railway
2. Add PostgreSQL plugin
3. Set environment variables:
   - `SECRET_KEY` (generate a secure key)
   - `ALLOWED_HOSTS` (your domain)
   - `CORS_ALLOWED_ORIGINS` (frontend URL)

Railway will automatically:
- Detect the Python app
- Run migrations on deploy
- Serve via gunicorn

## API Documentation

Once running, visit:
- Browsable API: `http://localhost:8000/api/v1/`
- Admin: `http://localhost:8000/admin/`
