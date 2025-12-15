#!/usr/bin/env python
"""Entrypoint script for Railway deployment."""
import os
import sys
import subprocess

def main():
    print("=== ENTRYPOINT STARTING ===", flush=True)
    
    # Run migrations
    print("Running migrations...", flush=True)
    result = subprocess.run(
        ["python", "manage.py", "migrate"],
        capture_output=False
    )
    if result.returncode != 0:
        print(f"Migration failed with code {result.returncode}", flush=True)
        sys.exit(1)
    
    print("Migrations complete.", flush=True)
    
    # Collect static files
    print("Collecting static files...", flush=True)
    result = subprocess.run(
        ["python", "manage.py", "collectstatic", "--noinput"],
        capture_output=False
    )
    if result.returncode != 0:
        print(f"Collectstatic failed with code {result.returncode}", flush=True)
        # Don't exit - static files may already exist
    else:
        print("Static files collected.", flush=True)
    
    # Test WSGI import
    print("Testing WSGI import...", flush=True)
    try:
        from codex.wsgi import application
        print("WSGI import OK", flush=True)
    except Exception as e:
        print(f"WSGI import failed: {e}", flush=True)
        sys.exit(1)
    
    # Get port
    port = os.environ.get("PORT", "8000")
    print(f"Starting gunicorn on port {port}...", flush=True)
    
    # Start gunicorn
    os.execvp("gunicorn", [
        "gunicorn",
        "codex.wsgi:application",
        "--bind", f"0.0.0.0:{port}",
        "--access-logfile", "-",
        "--error-logfile", "-",
        "--log-level", "info"
    ])

if __name__ == "__main__":
    main()
