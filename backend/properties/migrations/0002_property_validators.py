# Generated manually after model review.

import decimal

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="property",
            name="area",
            field=models.DecimalField(
                decimal_places=2,
                max_digits=7,
                validators=[django.core.validators.MinValueValidator(decimal.Decimal("0.01"))],
            ),
        ),
        migrations.AlterField(
            model_name="property",
            name="floor",
            field=models.PositiveSmallIntegerField(default=1, validators=[django.core.validators.MinValueValidator(1)]),
        ),
        migrations.AlterField(
            model_name="property",
            name="latitude",
            field=models.DecimalField(
                blank=True,
                decimal_places=6,
                max_digits=9,
                null=True,
                validators=[
                    django.core.validators.MinValueValidator(decimal.Decimal("-90")),
                    django.core.validators.MaxValueValidator(decimal.Decimal("90")),
                ],
            ),
        ),
        migrations.AlterField(
            model_name="property",
            name="longitude",
            field=models.DecimalField(
                blank=True,
                decimal_places=6,
                max_digits=9,
                null=True,
                validators=[
                    django.core.validators.MinValueValidator(decimal.Decimal("-180")),
                    django.core.validators.MaxValueValidator(decimal.Decimal("180")),
                ],
            ),
        ),
        migrations.AlterField(
            model_name="property",
            name="price_per_month",
            field=models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1)]),
        ),
        migrations.AlterField(
            model_name="property",
            name="rooms",
            field=models.PositiveSmallIntegerField(default=1, validators=[django.core.validators.MinValueValidator(1)]),
        ),
        migrations.AlterField(
            model_name="property",
            name="total_floors",
            field=models.PositiveSmallIntegerField(default=1, validators=[django.core.validators.MinValueValidator(1)]),
        ),
    ]
