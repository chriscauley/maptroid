# Generated by Django 4.0.5 on 2022-07-09 12:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('maptroid', '0022_smilesprite_template'),
    ]

    operations = [
        migrations.AddField(
            model_name='world',
            name='mc_id',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]