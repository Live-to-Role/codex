"""
Add recommendation system models.

- Add follower_count to Publisher and Author models
- Add PublisherFollow model for publisher follows
- Add AuthorFollow model for author follows
"""

import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0006_gamesystem_logo_url_gamesystem_website_url_and_more"),
        ("users", "0004_userfollow"),
    ]

    operations = [
        # Add follower_count fields
        migrations.AddField(
            model_name="publisher",
            name="follower_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="author",
            name="follower_count",
            field=models.PositiveIntegerField(default=0),
        ),
        
        # Create PublisherFollow model
        migrations.CreateModel(
            name="PublisherFollow",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "publisher",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="followers",
                        to="catalog.publisher",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="publisher_follows",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "publisher follow",
                "verbose_name_plural": "publisher follows",
            },
        ),
        
        # Create AuthorFollow model
        migrations.CreateModel(
            name="AuthorFollow",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "author",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="followers",
                        to="catalog.author",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="author_follows",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "author follow",
                "verbose_name_plural": "author follows",
            },
        ),
        
        # Add unique constraints
        migrations.AddConstraint(
            model_name="publisherfollow",
            constraint=models.UniqueConstraint(
                fields=["user", "publisher"],
                name="unique_publisher_follow",
            ),
        ),
        migrations.AddConstraint(
            model_name="authorfollow",
            constraint=models.UniqueConstraint(
                fields=["user", "author"],
                name="unique_author_follow",
            ),
        ),
        
        # Add indexes
        migrations.AddIndex(
            model_name="publisherfollow",
            index=models.Index(fields=["user"], name="catalog_pubfollow_user_idx"),
        ),
        migrations.AddIndex(
            model_name="publisherfollow",
            index=models.Index(fields=["publisher"], name="catalog_pubfollow_pub_idx"),
        ),
        migrations.AddIndex(
            model_name="authorfollow",
            index=models.Index(fields=["user"], name="catalog_authfollow_user_idx"),
        ),
        migrations.AddIndex(
            model_name="authorfollow",
            index=models.Index(fields=["author"], name="catalog_authfollow_auth_idx"),
        ),
    ]
