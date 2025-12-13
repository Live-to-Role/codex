"""
Management command to import seed data from JSON file.

Usage:
    python manage.py import_seed_data path/to/seed_data.json
    python manage.py import_seed_data path/to/seed_data.json --dry-run
"""

import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from apps.catalog.models import FileHash, GameSystem, Product, Publisher


class Command(BaseCommand):
    help = "Import seed data from a JSON file into the Codex database"

    def add_arguments(self, parser):
        parser.add_argument(
            "json_file",
            type=str,
            help="Path to the JSON file containing seed data",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Parse and validate data without saving to database",
        )
        parser.add_argument(
            "--update",
            action="store_true",
            help="Update existing records instead of skipping them",
        )

    def handle(self, *args, **options):
        json_path = Path(options["json_file"])
        dry_run = options["dry_run"]
        update_existing = options["update"]

        if not json_path.exists():
            raise CommandError(f"File not found: {json_path}")

        self.stdout.write(f"Reading seed data from: {json_path}")

        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            raise CommandError(f"Invalid JSON file: {e}")

        version = data.get("version", "unknown")
        source = data.get("source", "unknown")
        products_data = data.get("products", [])

        self.stdout.write(f"Seed data version: {version}")
        self.stdout.write(f"Source: {source}")
        self.stdout.write(f"Products to import: {len(products_data)}")

        if dry_run:
            self.stdout.write(self.style.WARNING("\n=== DRY RUN MODE ===\n"))

        stats = {
            "publishers_created": 0,
            "publishers_existing": 0,
            "systems_created": 0,
            "systems_existing": 0,
            "products_created": 0,
            "products_updated": 0,
            "products_skipped": 0,
            "hashes_created": 0,
            "hashes_existing": 0,
        }

        try:
            with transaction.atomic():
                for product_data in products_data:
                    self._import_product(product_data, stats, dry_run, update_existing)

                if dry_run:
                    raise DryRunException()

        except DryRunException:
            self.stdout.write(self.style.WARNING("\nDry run complete - no changes saved"))

        self._print_stats(stats)

    def _import_product(self, data: dict, stats: dict, dry_run: bool, update_existing: bool):
        """Import a single product and its related entities."""
        title = data.get("title", "").strip()
        if not title:
            self.stdout.write(self.style.WARNING("  Skipping product with no title"))
            return

        self.stdout.write(f"\nProcessing: {title}")

        publisher = self._get_or_create_publisher(
            data.get("publisher"), stats, dry_run
        )

        game_system = self._get_or_create_game_system(
            data.get("game_system"), stats, dry_run
        )

        product_type = self._map_product_type(data.get("product_type"))

        level_range = data.get("level_range") or {}
        external_links = data.get("external_links") or {}

        slug = slugify(title)
        base_slug = slug
        counter = 1
        while not dry_run and Product.objects.filter(slug=slug).exclude(title=title).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        product_defaults = {
            "description": data.get("description") or "",
            "publisher": publisher,
            "game_system": game_system,
            "product_type": product_type,
            "page_count": data.get("page_count"),
            "level_range_min": level_range.get("min"),
            "level_range_max": level_range.get("max"),
            "dtrpg_url": external_links.get("drivethrurpg"),
            "itch_url": external_links.get("itch"),
            "tags": data.get("tags") or [],
            "status": "verified" if data.get("confidence", 0) >= 0.9 else "pending",
        }

        if data.get("publication_year"):
            product_defaults["publication_date"] = f"{data['publication_year']}-01-01"

        if dry_run:
            self.stdout.write(f"  Would create/update product: {title}")
            stats["products_created"] += 1
        else:
            product, created = Product.objects.get_or_create(
                title=title,
                defaults={"slug": slug, **product_defaults},
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f"  Created product: {title}"))
                stats["products_created"] += 1
            elif update_existing:
                for key, value in product_defaults.items():
                    if value is not None:
                        setattr(product, key, value)
                product.save()
                self.stdout.write(self.style.SUCCESS(f"  Updated product: {title}"))
                stats["products_updated"] += 1
            else:
                self.stdout.write(f"  Skipped existing product: {title}")
                stats["products_skipped"] += 1

        file_hashes = data.get("file_hashes") or []
        file_size = data.get("file_size")

        for hash_value in file_hashes:
            self._create_file_hash(
                hash_value,
                file_size,
                product if not dry_run else None,
                stats,
                dry_run,
            )

    def _get_or_create_publisher(self, name: str | None, stats: dict, dry_run: bool):
        """Get or create a publisher by name."""
        if not name:
            return None

        name = name.strip()
        if not name:
            return None

        if dry_run:
            self.stdout.write(f"  Publisher: {name}")
            stats["publishers_created"] += 1
            return None

        slug = slugify(name)
        publisher, created = Publisher.objects.get_or_create(
            name=name,
            defaults={"slug": slug},
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f"  Created publisher: {name}"))
            stats["publishers_created"] += 1
        else:
            stats["publishers_existing"] += 1

        return publisher

    def _get_or_create_game_system(self, name: str | None, stats: dict, dry_run: bool):
        """Get or create a game system by name."""
        if not name:
            return None

        name = name.strip()
        if not name:
            return None

        if dry_run:
            self.stdout.write(f"  Game System: {name}")
            stats["systems_created"] += 1
            return None

        slug = slugify(name)
        system, created = GameSystem.objects.get_or_create(
            name=name,
            defaults={"slug": slug},
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f"  Created game system: {name}"))
            stats["systems_created"] += 1
        else:
            stats["systems_existing"] += 1

        return system

    def _create_file_hash(
        self,
        hash_value: str,
        file_size: int | None,
        product,
        stats: dict,
        dry_run: bool,
    ):
        """Create a file hash record."""
        if not hash_value:
            return

        if dry_run:
            self.stdout.write(f"  Hash: {hash_value[:16]}...")
            stats["hashes_created"] += 1
            return

        hash_obj, created = FileHash.objects.get_or_create(
            hash_value=hash_value,
            defaults={
                "product": product,
                "hash_type": "sha256",
                "file_size": file_size,
            },
        )

        if created:
            stats["hashes_created"] += 1
        else:
            stats["hashes_existing"] += 1
            if hash_obj.product != product:
                self.stdout.write(
                    self.style.WARNING(
                        f"  Hash {hash_value[:16]}... already linked to different product"
                    )
                )

    def _map_product_type(self, product_type: str | None) -> str:
        """Map seed data product type to model choices."""
        if not product_type:
            return "other"

        type_map = {
            "adventure": "adventure",
            "sourcebook": "sourcebook",
            "supplement": "supplement",
            "bestiary": "bestiary",
            "tools": "tools",
            "magazine": "magazine",
            "core_rules": "core_rules",
            "core rules": "core_rules",
            "setting": "sourcebook",
            "module": "adventure",
        }

        return type_map.get(product_type.lower(), "other")

    def _print_stats(self, stats: dict):
        """Print import statistics."""
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write("Import Statistics:")
        self.stdout.write("=" * 50)
        self.stdout.write(f"Publishers created:  {stats['publishers_created']}")
        self.stdout.write(f"Publishers existing: {stats['publishers_existing']}")
        self.stdout.write(f"Systems created:     {stats['systems_created']}")
        self.stdout.write(f"Systems existing:    {stats['systems_existing']}")
        self.stdout.write(f"Products created:    {stats['products_created']}")
        self.stdout.write(f"Products updated:    {stats['products_updated']}")
        self.stdout.write(f"Products skipped:    {stats['products_skipped']}")
        self.stdout.write(f"Hashes created:      {stats['hashes_created']}")
        self.stdout.write(f"Hashes existing:     {stats['hashes_existing']}")
        self.stdout.write("=" * 50)


class DryRunException(Exception):
    """Raised to rollback transaction during dry run."""

    pass
