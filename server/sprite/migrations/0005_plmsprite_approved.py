# Generated by Django 4.0.5 on 2022-06-10 20:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sprite', '0004_remove_plmsprite_match_xy_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='plmsprite',
            name='approved',
            field=models.BooleanField(default=False),
            preserve_default=False,
        ),
    ]
