# Generated by Django 3.2.7 on 2021-11-27 20:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('maptroid', '0012_auto_20211126_2203'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='smilesprite',
            name='name',
        ),
        migrations.AddField(
            model_name='smilesprite',
            name='category',
            field=models.CharField(blank=True, choices=[('item', 'item'), ('enemy', 'enemy'), ('obstacle', 'obstacle'), ('door', 'door'), ('station', 'station'), ('animation', 'animation'), ('trash', 'trash')], max_length=16, null=True),
        ),
        migrations.AddField(
            model_name='smilesprite',
            name='color',
            field=models.CharField(blank=True, choices=[('black', 'black'), ('gold', 'gold'), ('gray', 'gray'), ('green', 'green'), ('orange', 'orange'), ('blue', 'blue'), ('pink', 'pink'), ('purple', 'purple'), ('red', 'red'), ('white', 'white')], max_length=16, null=True),
        ),
        migrations.AddField(
            model_name='smilesprite',
            name='modifier',
            field=models.CharField(blank=True, choices=[('composite', 'composite'), ('inblock', 'inblock'), ('inegg', 'inegg')], max_length=16, null=True),
        ),
    ]
