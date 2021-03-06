# Generated by Django 3.2.7 on 2021-11-25 03:10

from django.db import migrations, models
import maptroid.models


class Migration(migrations.Migration):

    dependencies = [
        ('maptroid', '0006_auto_20211121_1333'),
    ]

    operations = [
        migrations.CreateModel(
            name='SmileSprite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, max_length=32, null=True)),
                ('dhash', models.CharField(max_length=24)),
                ('color_sum', models.IntegerField()),
                ('image', models.ImageField(upload_to='smile_sprites')),
                ('layer', models.CharField(choices=[('bts', 'bts'), ('plm', 'plm'), ('tile', 'tile'), ('unknown', 'unknown')], default='unknown', max_length=16)),
                ('type', models.CharField(blank=True, default='', max_length=32)),
            ],
        ),
        migrations.AlterField(
            model_name='item',
            name='data',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name='room',
            name='sprite_ids',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.DeleteModel(
            name='Sprite',
        ),
    ]
