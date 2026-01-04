"""
Add UserFollow model for user-to-user follow relationships.
"""

import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0003_user_approved_contribution_count_and_more"),
    ]

    operations = [
        # Add follower and following count fields to User
        migrations.AddField(
            model_name="user",
            name="follower_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="user",
            name="following_count",
            field=models.PositiveIntegerField(default=0),
        ),
        
        # Create UserFollow model
        migrations.CreateModel(
            name="UserFollow",
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
                    "follower",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="following",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "followed",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="followers",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "user follow",
                "verbose_name_plural": "user follows",
            },
        ),
        migrations.AddConstraint(
            model_name="userfollow",
            constraint=models.UniqueConstraint(
                fields=["follower", "followed"],
                name="unique_user_follow",
            ),
        ),
        migrations.AddIndex(
            model_name="userfollow",
            index=models.Index(fields=["follower", "created_at"], name="users_userfollow_follower_idx"),
        ),
        migrations.AddIndex(
            model_name="userfollow",
            index=models.Index(fields=["followed", "created_at"], name="users_userfollow_followed_idx"),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["follower_count"], name="users_user_follower_cnt_idx"),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["following_count"], name="users_user_following_cnt_idx"),
        ),
    ]
