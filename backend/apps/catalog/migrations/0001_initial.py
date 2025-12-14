import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Publisher",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=255, unique=True)),
                ("slug", models.SlugField(blank=True, max_length=255, unique=True)),
                ("website", models.URLField(blank=True)),
                ("description", models.TextField(blank=True)),
                ("founded_year", models.PositiveIntegerField(blank=True, null=True)),
                ("logo_url", models.URLField(blank=True)),
                ("is_verified", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_publishers", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "publisher",
                "verbose_name_plural": "publishers",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="Author",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=255)),
                ("slug", models.SlugField(blank=True, max_length=255, unique=True)),
                ("bio", models.TextField(blank=True)),
                ("website", models.URLField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_authors", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "author",
                "verbose_name_plural": "authors",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="GameSystem",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=255)),
                ("slug", models.SlugField(max_length=50, unique=True)),
                ("description", models.TextField(blank=True)),
                ("edition", models.CharField(blank=True, max_length=50)),
                ("year_released", models.PositiveIntegerField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("parent_system", models.ForeignKey(blank=True, help_text="Parent system for variants/hacks", null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="variants", to="catalog.gamesystem")),
                ("publisher", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="game_systems", to="catalog.publisher")),
            ],
            options={
                "verbose_name": "game system",
                "verbose_name_plural": "game systems",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="ProductSeries",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=255)),
                ("slug", models.SlugField(blank=True, max_length=255, unique=True)),
                ("description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_series", to=settings.AUTH_USER_MODEL)),
                ("publisher", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="series", to="catalog.publisher")),
            ],
            options={
                "verbose_name": "product series",
                "verbose_name_plural": "product series",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=500)),
                ("slug", models.SlugField(blank=True, max_length=500, unique=True)),
                ("description", models.TextField(blank=True)),
                ("product_type", models.CharField(choices=[("adventure", "Adventure"), ("sourcebook", "Sourcebook"), ("supplement", "Supplement"), ("bestiary", "Bestiary"), ("tools", "Tools"), ("magazine", "Magazine"), ("core_rules", "Core Rules"), ("screen", "GM Screen"), ("other", "Other")], default="other", max_length=20)),
                ("publication_date", models.DateField(blank=True, null=True)),
                ("page_count", models.PositiveIntegerField(blank=True, null=True)),
                ("format", models.CharField(choices=[("pdf", "PDF"), ("print", "Print"), ("both", "PDF + Print")], default="pdf", max_length=10)),
                ("isbn", models.CharField(blank=True, max_length=20)),
                ("msrp", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ("dtrpg_id", models.CharField(blank=True, db_index=True, max_length=50)),
                ("dtrpg_url", models.URLField(blank=True)),
                ("itch_id", models.CharField(blank=True, max_length=100)),
                ("itch_url", models.URLField(blank=True)),
                ("other_urls", models.JSONField(blank=True, default=list)),
                ("level_range_min", models.PositiveIntegerField(blank=True, null=True)),
                ("level_range_max", models.PositiveIntegerField(blank=True, null=True)),
                ("party_size_min", models.PositiveIntegerField(blank=True, null=True)),
                ("party_size_max", models.PositiveIntegerField(blank=True, null=True)),
                ("estimated_runtime", models.CharField(blank=True, help_text="e.g., 'one-shot', '2-3 sessions', 'campaign'", max_length=50)),
                ("setting", models.CharField(blank=True, max_length=255)),
                ("tags", models.JSONField(blank=True, default=list)),
                ("themes", models.JSONField(blank=True, default=list)),
                ("content_warnings", models.JSONField(blank=True, default=list)),
                ("cover_url", models.URLField(blank=True)),
                ("thumbnail_url", models.URLField(blank=True)),
                ("series_order", models.PositiveIntegerField(blank=True, help_text="Order within the series (1, 2, 3...)", null=True)),
                ("status", models.CharField(choices=[("draft", "Draft"), ("published", "Published"), ("verified", "Verified")], default="draft", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_products", to=settings.AUTH_USER_MODEL)),
                ("game_system", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="products", to="catalog.gamesystem")),
                ("publisher", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="products", to="catalog.publisher")),
                ("series", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="products", to="catalog.productseries")),
            ],
            options={
                "verbose_name": "product",
                "verbose_name_plural": "products",
                "ordering": ["title"],
            },
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["title"], name="catalog_pro_title_a3e498_idx"),
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["status"], name="catalog_pro_status_b6e3a5_idx"),
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["product_type"], name="catalog_pro_product_6e6e4e_idx"),
        ),
        migrations.CreateModel(
            name="ProductCredit",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("role", models.CharField(choices=[("author", "Author"), ("co_author", "Co-Author"), ("artist", "Artist"), ("cartographer", "Cartographer"), ("editor", "Editor"), ("layout", "Layout"), ("other", "Other")], default="author", max_length=20)),
                ("notes", models.CharField(blank=True, max_length=255)),
                ("author", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="credits", to="catalog.author")),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="credits", to="catalog.product")),
            ],
            options={
                "verbose_name": "product credit",
                "verbose_name_plural": "product credits",
                "ordering": ["role", "author__name"],
                "unique_together": {("product", "author", "role")},
            },
        ),
        migrations.CreateModel(
            name="FileHash",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("hash_sha256", models.CharField(db_index=True, max_length=64, unique=True)),
                ("hash_md5", models.CharField(blank=True, db_index=True, max_length=32)),
                ("file_size_bytes", models.BigIntegerField(blank=True, null=True)),
                ("file_name", models.CharField(blank=True, max_length=500)),
                ("source", models.CharField(choices=[("user_contributed", "User Contributed"), ("publisher_verified", "Publisher Verified"), ("ai_identified", "AI Identified")], default="user_contributed", max_length=30)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("contributed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="contributed_hashes", to=settings.AUTH_USER_MODEL)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="file_hashes", to="catalog.product")),
            ],
            options={
                "verbose_name": "file hash",
                "verbose_name_plural": "file hashes",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="ProductRelation",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("relation_type", models.CharField(choices=[("sequel", "Sequel"), ("prequel", "Prequel"), ("conversion", "System Conversion"), ("compilation", "Compilation"), ("expansion", "Expansion"), ("related", "Related")], default="related", max_length=20)),
                ("notes", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("from_product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="relations_from", to="catalog.product")),
                ("to_product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="relations_to", to="catalog.product")),
            ],
            options={
                "verbose_name": "product relation",
                "verbose_name_plural": "product relations",
                "unique_together": {("from_product", "to_product", "relation_type")},
            },
        ),
        migrations.CreateModel(
            name="Revision",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("changes", models.JSONField(default=dict)),
                ("comment", models.CharField(blank=True, max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="revisions", to="catalog.product")),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="revisions", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "revision",
                "verbose_name_plural": "revisions",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="Contribution",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("data", models.JSONField(default=dict)),
                ("file_hash", models.CharField(blank=True, max_length=64)),
                ("source", models.CharField(choices=[("web", "Web UI"), ("grimoire", "Grimoire"), ("api", "API")], default="web", max_length=20)),
                ("status", models.CharField(choices=[("pending", "Pending Review"), ("approved", "Approved"), ("rejected", "Rejected")], default="pending", max_length=20)),
                ("review_notes", models.TextField(blank=True)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("product", models.ForeignKey(blank=True, help_text="Null if this is a new product contribution", null=True, on_delete=django.db.models.deletion.CASCADE, related_name="contributions", to="catalog.product")),
                ("reviewed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reviewed_contributions", to=settings.AUTH_USER_MODEL)),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="contributions", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "contribution",
                "verbose_name_plural": "contributions",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="ProductImage",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("image_type", models.CharField(choices=[("cover", "Cover"), ("thumbnail", "Thumbnail"), ("preview", "Preview Page"), ("other", "Other")], default="cover", max_length=20)),
                ("url", models.URLField(help_text="URL to the hosted image")),
                ("width", models.PositiveIntegerField(blank=True, null=True)),
                ("height", models.PositiveIntegerField(blank=True, null=True)),
                ("file_size", models.PositiveIntegerField(blank=True, help_text="Size in bytes", null=True)),
                ("alt_text", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="images", to="catalog.product")),
                ("uploaded_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="uploaded_images", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "product image",
                "verbose_name_plural": "product images",
                "ordering": ["image_type", "created_at"],
            },
        ),
        migrations.CreateModel(
            name="Comment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("content", models.TextField()),
                ("is_edited", models.BooleanField(default=False)),
                ("is_deleted", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("parent", models.ForeignKey(blank=True, help_text="Parent comment for threaded replies", null=True, on_delete=django.db.models.deletion.CASCADE, related_name="replies", to="catalog.comment")),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="comments", to="catalog.product")),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="comments", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "comment",
                "verbose_name_plural": "comments",
                "ordering": ["created_at"],
            },
        ),
    ]
