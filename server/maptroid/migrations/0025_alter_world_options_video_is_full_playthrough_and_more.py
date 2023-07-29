# Generated by Django 4.0.5 on 2022-11-01 13:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('maptroid', '0024_remove_channel_external_id_remove_channel_source_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='world',
            options={'ordering': ('slug',)},
        ),
        migrations.AddField(
            model_name='video',
            name='is_full_playthrough',
            field=models.BooleanField(
                default=True,
                help_text="temporary field to separate playthrough videos and skill videos",
            ),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='video',
            name='label',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AlterField(
            model_name='video',
            name='thumbnail',
            field=models.ImageField(blank=True, null=True, upload_to='video_thumbnails'),
        ),
    ]