# Generated by Django 3.2.7 on 2021-12-09 13:49

from django.db import migrations, models
import unrest_image


class Migration(migrations.Migration):

    dependencies = [
        ('maptroid', '0017_alter_video_data'),
    ]

    operations = [
        migrations.AddField(
            model_name='room',
            name='smile_data',
            field=models.JSONField(blank=True, default=dict, encoder=unrest_image.NpEncoder),
        ),
    ]
