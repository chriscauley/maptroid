# Generated by Django 3.2.7 on 2021-11-07 14:09

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('maptroid', '0010_auto_20211107_1405'),
    ]

    operations = [
        migrations.AddField(
            model_name='item',
            name='zone',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='maptroid.zone'),
        ),
    ]
