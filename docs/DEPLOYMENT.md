# Codex Deployment Guide

This guide covers deploying Codex with:
- **Backend**: Railway (Django + PostgreSQL)
- **Frontend**: Netlify (React/Vite)

---

## Backend Deployment (Railway)

### Prerequisites
- [Railway account](https://railway.app/)
- GitHub repository connected to Railway

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app/) and click **New Project**
2. Select **Deploy from GitHub repo**
3. Choose your `codex` repository
4. Railway will detect the Django app in `/backend`

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **+ New**
2. Select **Database** → **PostgreSQL**
3. Railway automatically sets `DATABASE_URL` for your app

### Step 3: Configure Environment Variables

In Railway dashboard → your service → **Variables**, add:

```
SECRET_KEY=<generate-a-secure-random-key>
DEBUG=False
ALLOWED_HOSTS=your-app.up.railway.app,codex-api.livetorole.com
CORS_ALLOWED_ORIGINS=https://codex.livetorole.com,https://your-netlify-app.netlify.app
DJANGO_LOG_LEVEL=INFO
```

**Generate a secret key:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Step 4: Configure Build & Start Commands

In Railway dashboard → your service → **Settings**:

**Root Directory:**
```
backend
```

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
python manage.py migrate && gunicorn codex.wsgi:application --bind 0.0.0.0:$PORT
```

### Step 5: Add Procfile (Alternative)

Create `backend/Procfile`:
```
web: python manage.py migrate && gunicorn codex.wsgi:application --bind 0.0.0.0:$PORT
release: python manage.py migrate
```

### Step 6: Add railway.json (Optional)

Create `backend/railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python manage.py migrate && gunicorn codex.wsgi:application --bind 0.0.0.0:$PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 7: Update Django Settings for Production

Ensure `backend/codex/settings/production.py` includes:

```python
import dj_database_url

# Parse DATABASE_URL from Railway
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600,
        ssl_require=True,
    )
}

# Security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
```

### Step 8: Deploy

1. Push to your main branch
2. Railway auto-deploys on push
3. Check logs in Railway dashboard for any errors

### Step 9: Custom Domain (Optional)

1. In Railway → your service → **Settings** → **Domains**
2. Add custom domain: `codex-api.livetorole.com`
3. Configure DNS with your registrar (CNAME to Railway)

---

## Frontend Deployment (Netlify)

### Step 1: Configure Environment

Create/update `frontend/.env.production`:
```
VITE_API_BASE_URL=https://codex-api.livetorole.com/api/v1
VITE_DTRPG_AFFILIATE_ID=your-affiliate-id
VITE_ENV=production
```

### Step 2: Netlify Configuration

Your `netlify.toml` should include:
```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Step 3: Deploy to Netlify

1. Connect your GitHub repo to Netlify
2. Set build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
3. Add environment variables in Netlify dashboard

### Step 4: Custom Domain

1. In Netlify → Domain settings
2. Add custom domain: `codex.livetorole.com`
3. Configure DNS

---

## Post-Deployment Checklist

- [ ] Backend health check: `https://codex-api.livetorole.com/api/v1/health`
- [ ] Frontend loads correctly
- [ ] API calls work (check browser console)
- [ ] User registration/login works
- [ ] CORS configured correctly (no cross-origin errors)
- [ ] SSL certificates active on both domains

---

## Troubleshooting

### "No module named 'django'"
- Ensure `requirements.txt` is in the `backend/` directory
- Check Railway build logs

### CORS Errors
- Verify `CORS_ALLOWED_ORIGINS` includes your Netlify URL
- Check for trailing slashes (don't include them)

### Database Connection Errors
- Ensure PostgreSQL addon is attached
- Check `DATABASE_URL` is set in Railway variables

### Static Files Not Loading
- Run `python manage.py collectstatic` in build command
- Configure whitenoise for static file serving

---

## Environment Variables Reference

### Backend (Railway)
| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | `abc123...` |
| `DEBUG` | Debug mode | `False` |
| `ALLOWED_HOSTS` | Comma-separated hosts | `codex-api.livetorole.com` |
| `CORS_ALLOWED_ORIGINS` | Frontend URLs | `https://codex.livetorole.com` |
| `DATABASE_URL` | PostgreSQL URL (auto-set by Railway) | `postgresql://...` |

### Frontend (Netlify)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://codex-api.livetorole.com/api/v1` |
| `VITE_DTRPG_AFFILIATE_ID` | DriveThruRPG affiliate ID | `12345` |
| `VITE_ENV` | Environment name | `production` |
