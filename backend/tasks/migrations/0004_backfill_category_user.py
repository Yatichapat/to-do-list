from django.db import migrations


def backfill_category_user(apps, schema_editor):
    Category = apps.get_model("tasks", "Category")
    Task = apps.get_model("tasks", "Task")

    null_user_categories = Category.objects.filter(user__isnull=True)

    for category in null_user_categories.iterator():
        user_ids = list(
            Task.objects.filter(category_id=category.id)
            .values_list("user_id", flat=True)
            .distinct()
        )

        if not user_ids:
            continue

        if len(user_ids) == 1:
            category.user_id = user_ids[0]
            category.save(update_fields=["user"])
            continue

        # Keep the original category for the first user.
        category.user_id = user_ids[0]
        category.save(update_fields=["user"])

        # Duplicate category for other users and re-point their tasks.
        for user_id in user_ids[1:]:
            new_category = Category.objects.create(name=category.name, user_id=user_id)
            Task.objects.filter(category_id=category.id, user_id=user_id).update(
                category_id=new_category.id
            )


def noop_reverse(apps, schema_editor):
    # Irreversible safely: categories may have been split per user.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0003_category_user"),
    ]

    operations = [
        migrations.RunPython(backfill_category_user, noop_reverse),
    ]
