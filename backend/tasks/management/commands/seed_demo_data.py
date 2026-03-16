from datetime import timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from tasks.models import Category, Task


class Command(BaseCommand):
    help = "Seed demo data (users, categories, tasks)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--if-empty",
            action="store_true",
            help="Skip seeding when demo data appears to already exist.",
        )

    def handle(self, *args, **options):
        if options.get("if_empty") and (
            User.objects.filter(username="demo").exists() or Task.objects.exists()
        ):
            self.stdout.write(self.style.WARNING("Skip seeding: existing data found."))
            return

        demo_user, created = User.objects.get_or_create(
            username="demo",
            defaults={"email": "demo@example.com"},
        )
        if created:
            demo_user.set_password("Demo1234!")
            demo_user.save()

        reviewer_user, reviewer_created = User.objects.get_or_create(
            username="reviewer",
            defaults={"email": "reviewer@example.com"},
        )
        if reviewer_created:
            reviewer_user.set_password("Reviewer1234!")
            reviewer_user.save()

        categories = {}
        for name in ["Work", "Personal", "Study"]:
            category, _ = Category.objects.get_or_create(name=name, user=demo_user)
            categories[name] = category

        now = timezone.now()
        task_specs = [
            {
                "title": "Prepare project demo",
                "description": "Record short walkthrough for evaluator",
                "status": "progress",
                "due_date": now + timedelta(days=2),
                "category": categories["Work"],
                "tag_users": [reviewer_user],
            },
            {
                "title": "Write README instructions",
                "description": "Document setup and seed steps",
                "status": "pending",
                "due_date": now + timedelta(days=5),
                "category": categories["Work"],
                "tag_users": [reviewer_user],
            },
            {
                "title": "Buy groceries",
                "description": "Milk, eggs, rice",
                "status": "pending",
                "due_date": now + timedelta(days=1),
                "category": categories["Personal"],
                "tag_users": [],
            },
            {
                "title": "Review DRF auth docs",
                "description": "Read JWT refresh flow and summarize",
                "status": "done",
                "due_date": now - timedelta(days=1),
                "category": categories["Study"],
                "tag_users": [reviewer_user],
            },
        ]

        created_count = 0
        for spec in task_specs:
            task, task_created = Task.objects.get_or_create(
                user=demo_user,
                title=spec["title"],
                defaults={
                    "description": spec["description"],
                    "status": spec["status"],
                    "due_date": spec["due_date"],
                    "category": spec["category"],
                },
            )
            task.tag_users.set(spec["tag_users"])
            if task_created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS("Demo data ready."))
        self.stdout.write(f"- demo user created: {created}")
        self.stdout.write(f"- reviewer user created: {reviewer_created}")
        self.stdout.write(f"- tasks created this run: {created_count}")
        self.stdout.write("Login demo: demo / Demo1234!")
