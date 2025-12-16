"""
Cloudflare R2 storage utilities for image uploads.
"""
import base64
import hashlib
import logging
import uuid
from io import BytesIO

from django.conf import settings

logger = logging.getLogger(__name__)


def get_r2_client():
    """Get a boto3 client configured for Cloudflare R2."""
    import boto3
    
    if not all([
        settings.R2_ACCESS_KEY_ID,
        settings.R2_SECRET_ACCESS_KEY,
        settings.R2_ENDPOINT_URL,
        settings.R2_BUCKET_NAME,
    ]):
        logger.warning("R2 storage not configured - missing environment variables")
        return None
    
    return boto3.client(
        "s3",
        endpoint_url=settings.R2_ENDPOINT_URL,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
    )


def upload_base64_image(base64_data: str, folder: str = "covers", filename_prefix: str = "") -> str | None:
    """
    Upload a base64-encoded image to R2 and return the public URL.
    
    Args:
        base64_data: Base64-encoded image data (with or without data URL prefix)
        folder: Folder path in the bucket (e.g., "covers", "thumbnails")
        filename_prefix: Optional prefix for the filename (e.g., product slug)
    
    Returns:
        Public URL of the uploaded image, or None if upload fails
    """
    client = get_r2_client()
    if not client:
        logger.error("R2 client not available - cannot upload image")
        return None
    
    try:
        # Remove data URL prefix if present
        if base64_data.startswith("data:"):
            # Format: data:image/jpeg;base64,/9j/4AAQ...
            header, base64_data = base64_data.split(",", 1)
            # Extract content type from header
            content_type = header.split(";")[0].replace("data:", "")
        else:
            # Default to JPEG if no header
            content_type = "image/jpeg"
        
        # Decode base64
        image_data = base64.b64decode(base64_data)
        
        # Determine file extension from content type
        ext_map = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/gif": "gif",
            "image/webp": "webp",
        }
        ext = ext_map.get(content_type, "jpg")
        
        # Generate unique filename
        unique_id = uuid.uuid4().hex[:12]
        if filename_prefix:
            # Sanitize prefix
            safe_prefix = "".join(c for c in filename_prefix if c.isalnum() or c in "-_")[:50]
            filename = f"{folder}/{safe_prefix}-{unique_id}.{ext}"
        else:
            filename = f"{folder}/{unique_id}.{ext}"
        
        # Upload to R2
        client.put_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=filename,
            Body=image_data,
            ContentType=content_type,
        )
        
        # Construct public URL
        public_url = f"{settings.R2_PUBLIC_URL.rstrip('/')}/{filename}"
        logger.info(f"Uploaded image to R2: {public_url}")
        
        return public_url
        
    except Exception as e:
        logger.error(f"Failed to upload image to R2: {e}")
        return None


def generate_thumbnail(base64_data: str, max_size: tuple = (300, 400)) -> str | None:
    """
    Generate a thumbnail from base64 image data and upload to R2.
    
    Args:
        base64_data: Base64-encoded image data
        max_size: Maximum (width, height) for thumbnail
    
    Returns:
        Public URL of the thumbnail, or None if generation fails
    """
    try:
        from PIL import Image
        
        # Remove data URL prefix if present
        if base64_data.startswith("data:"):
            base64_data = base64_data.split(",", 1)[1]
        
        # Decode and open image
        image_data = base64.b64decode(base64_data)
        image = Image.open(BytesIO(image_data))
        
        # Convert to RGB if necessary (for PNG with transparency)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        
        # Create thumbnail
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save to bytes
        output = BytesIO()
        image.save(output, format="JPEG", quality=85, optimize=True)
        output.seek(0)
        
        # Re-encode as base64 and upload
        thumb_base64 = base64.b64encode(output.read()).decode("utf-8")
        return upload_base64_image(
            f"data:image/jpeg;base64,{thumb_base64}",
            folder="thumbnails"
        )
        
    except Exception as e:
        logger.error(f"Failed to generate thumbnail: {e}")
        return None
