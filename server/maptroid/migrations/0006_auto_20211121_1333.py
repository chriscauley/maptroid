# Generated by Django 3.2.7 on 2021-11-21 13:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('maptroid', '0005_rename_name_video_label'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='video',
            options={'ordering': ('order',)},
        ),
        migrations.AddField(
            model_name='video',
            name='order',
            field=models.IntegerField(default=0),
        ),
    ]
