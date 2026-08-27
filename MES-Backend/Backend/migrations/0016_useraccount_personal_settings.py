from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("Backend", "0015_operatorperformance")]

    operations = [
        migrations.AddField(
            model_name="useraccount",
            name="display_name",
            field=models.CharField(blank=True, default="", max_length=150),
        ),
        migrations.AddField(
            model_name="useraccount",
            name="job_title",
            field=models.CharField(blank=True, default="", max_length=50),
        ),
        migrations.AddField(
            model_name="useraccount",
            name="timezone",
            field=models.CharField(default="Africa/Tunis", max_length=100),
        ),
        migrations.AddField(
            model_name="useraccount",
            name="country",
            field=models.CharField(default="TN", max_length=2),
        ),
        migrations.AddField(
            model_name="useraccount",
            name="date_format",
            field=models.CharField(default="dd/MM/yyyy", max_length=20),
        ),
        migrations.AddField(
            model_name="useraccount",
            name="time_format",
            field=models.CharField(default="24h", max_length=10),
        ),
        migrations.AddField(
            model_name="useraccount",
            name="theme",
            field=models.CharField(default="system", max_length=10),
        ),
    ]
