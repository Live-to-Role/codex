# Codex API Debug Instructions

**STATUS: IMPLEMENTED** - See changes in `backend/apps/api/views.py`

## Issue
Grimoire is receiving `400 Bad Request` with an empty response body when submitting contributions to the Codex API. This makes debugging impossible.

## Current Behavior
- Endpoint: `POST /api/v1/contributions/`
- Response: `400 Bad Request` with empty body
- No error details returned to client

## Test Results
```
# This WORKS (fake hash):
POST /api/v1/contributions/
{
  "data": {"title": "Test Product"},
  "file_hash": "abc123",
  "source": "grimoire",
  "contribution_type": "new_product"
}
Response: 200 OK - {"status": "pending", "contribution_id": "..."}

# This FAILS (real SHA-256 hash):
POST /api/v1/contributions/
{
  "data": {"title": "Test Product 2", "publisher": "Bloat Games"},
  "file_hash": "214c170e9b680eb893c1a7b44c7a2eb34dd4b215b9e67fd4a8e20d7101a5b6a2",
  "source": "grimoire",
  "contribution_type": "new_product"
}
Response: 400 Bad Request - (empty body)
```

## Requested Changes

### 1. Return detailed error responses
Instead of returning empty 400 responses, return JSON with error details:

```python
# Example for Django REST Framework
from rest_framework.response import Response
from rest_framework import status

# In your contribution view/serializer:
if error_condition:
    return Response({
        "error": "validation_error",
        "field": "file_hash",
        "message": "A product with this file hash already exists",
        "existing_product_id": existing.id  # if applicable
    }, status=status.HTTP_400_BAD_REQUEST)
```

### 2. Possible validation issues to check
The 400 error might be caused by:
1. **Duplicate file_hash** - Hash already exists in database
2. **Hash format validation** - Maybe expecting specific format?
3. **Rate limiting** - Too many contributions from same user/source
4. **Missing required field** - Some field validation failing silently

### 3. Add logging
Log incoming contribution requests and validation failures:

```python
import logging
logger = logging.getLogger(__name__)

def create_contribution(request):
    logger.info(f"Contribution request from {request.user}: {request.data}")
    
    # ... validation ...
    
    if validation_error:
        logger.warning(f"Contribution rejected: {validation_error}")
        return Response({"error": validation_error, ...}, status=400)
```

## Expected Response Format
For errors, please return:
```json
{
  "error": "error_code",
  "message": "Human readable message",
  "field": "field_name_if_applicable",
  "details": {}  // optional additional context
}
```

## Grimoire Client Code Reference
The Grimoire client sends requests like this (from `backend/grimoire/services/codex.py`):

```python
payload = {
    "data": product_data,      # dict with title, publisher, etc.
    "file_hash": file_hash,    # SHA-256 hash of PDF file
    "source": "grimoire",
    "contribution_type": "new_product"  # or "edit_product"
}

response = await client.post(
    f"{base_url}/contributions/",
    json=payload,
    headers={"Authorization": f"Token {api_key}"}
)
```
