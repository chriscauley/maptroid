# Generated by Django 3.2.7 on 2021-11-16 12:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('maptroid', '0003_video_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='video',
            name='thumbnail',
            field=models.ImageField(default='arst', upload_to='video_thumbnails'),
            preserve_default=False,
        ),
    ]
