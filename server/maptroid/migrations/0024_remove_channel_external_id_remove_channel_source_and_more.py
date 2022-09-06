# Generated by Django 4.0.5 on 2022-09-05 14:06

from django.db import migrations, models
import maptroid.models


class Migration(migrations.Migration):

    dependencies = [
        ('maptroid', '0023_world_mc_id'),
    ]

    operations = [
        migrations.RenameField(
            model_name='channel',
            old_name='external_id',
            new_name='youtube_id',
        ),
        migrations.AlterField(
            model_name='channel',
            name='youtube_id',
            field=models.CharField(blank=True, max_length=24, null=True),
        ),
        migrations.RemoveField(
            model_name='channel',
            name='source',
        ),
        migrations.AddField(
            model_name='channel',
            name='twitch_id',
            field=models.CharField(blank=True, max_length=24, null=True),
        ),
        migrations.AlterField(
            model_name='world',
            name='data',
            field=models.JSONField(blank=True, default=maptroid.models.default_world_data),
        ),
        migrations.AlterField(
            model_name='video',
            name='source',
            field=models.CharField(choices=[('youtube', 'youtube'), ('twitch', 'twitch')], default='youtube', max_length=16),
        ),
    ]
