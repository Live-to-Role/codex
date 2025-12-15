"""Management command to manually verify a user's email address."""
from django.core.management.base import BaseCommand, CommandError
from allauth.account.models import EmailAddress


class Command(BaseCommand):
    help = "Manually verify a user's email address"

    def add_arguments(self, parser):
        parser.add_argument("email", type=str, help="Email address to verify")

    def handle(self, *args, **options):
        email = options["email"]
        
        try:
            email_address = EmailAddress.objects.get(email=email)
        except EmailAddress.DoesNotExist:
            raise CommandError(f"Email address '{email}' not found")
        
        if email_address.verified:
            self.stdout.write(self.style.WARNING(f"Email '{email}' is already verified"))
            return
        
        email_address.verified = True
        email_address.save()
        
        self.stdout.write(self.style.SUCCESS(f"Successfully verified email '{email}'"))
