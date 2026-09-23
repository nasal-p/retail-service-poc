"""
Management command to seed initial database records.
Creates default accounts, categories, products, inventory records, and service catalogue.
"""
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import CustomUser, Role
from apps.inventory.models import Inventory
from apps.products.models import Category, Product
from apps.services.models import Service


class Command(BaseCommand):
    help = "Seeds initial demo data for Retail Mobile Shop & Service Management System"

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding initial data..."))

        # 1. Accounts
        admin, created = CustomUser.objects.get_or_create(
            email="admin@mobilecenter.com",
            defaults={
                "full_name": "System Administrator",
                "phone": "+971501112233",
                "role": Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin.set_password("Admin123!")
            admin.save()
            self.stdout.write(self.style.SUCCESS("  Created Admin: admin@mobilecenter.com / Admin123!"))

        staff, created = CustomUser.objects.get_or_create(
            email="staff@mobilecenter.com",
            defaults={
                "full_name": "Sarah Staff",
                "phone": "+971502223344",
                "role": Role.STAFF,
                "is_staff": True,
            },
        )
        if created:
            staff.set_password("Staff123!")
            staff.save()
            self.stdout.write(self.style.SUCCESS("  Created Staff: staff@mobilecenter.com / Staff123!"))

        customer, created = CustomUser.objects.get_or_create(
            email="customer@mobilecenter.com",
            defaults={
                "full_name": "John Customer",
                "phone": "+971503334455",
                "role": Role.CUSTOMER,
            },
        )
        if created:
            customer.set_password("Customer123!")
            customer.save()
            self.stdout.write(self.style.SUCCESS("  Created Customer: customer@mobilecenter.com / Customer123!"))

        # 2. Categories
        categories_data = [
            ("Smartphones", "Flagship and mid-range mobile devices"),
            ("Tablets", "iOS and Android tablets"),
            ("Accessories", "Cases, chargers, screen protectors, and cables"),
            ("Audio", "Wireless earbuds, headphones, and speakers"),
            ("Spare Parts", "OEM screens, batteries, and internal components"),
        ]

        categories = {}
        for name, desc in categories_data:
            cat, _ = Category.objects.get_or_create(
                name=name,
                defaults={"description": desc},
            )
            categories[name] = cat
        self.stdout.write(self.style.SUCCESS(f"  Created/verified {len(categories)} categories."))

        # 3. Products & Inventory
        products_data = [
            {
                "name": "iPhone 15 Pro",
                "brand": "Apple",
                "model": "15 Pro 256GB",
                "sku": "APL-IPH15P-256",
                "category": categories["Smartphones"],
                "description": "Titanium design, A17 Pro chip, 48MP camera system",
                "price": Decimal("1199.99"),
                "cost_price": Decimal("950.00"),
                "stock_quantity": 12,
                "low_stock_threshold": 3,
            },
            {
                "name": "Samsung Galaxy S24 Ultra",
                "brand": "Samsung",
                "model": "S24 Ultra 512GB",
                "sku": "SAM-S24U-512",
                "category": categories["Smartphones"],
                "description": "Galaxy AI, 200MP camera, built-in S Pen",
                "price": Decimal("1299.99"),
                "cost_price": Decimal("1000.00"),
                "stock_quantity": 8,
                "low_stock_threshold": 2,
            },
            {
                "name": "iPad Air M2",
                "brand": "Apple",
                "model": "11-inch 128GB",
                "sku": "APL-IPADAIR-M2",
                "category": categories["Tablets"],
                "description": "M2 chip, Liquid Retina display, Apple Pencil Pro support",
                "price": Decimal("599.99"),
                "cost_price": Decimal("480.00"),
                "stock_quantity": 5,
                "low_stock_threshold": 2,
            },
            {
                "name": "Anker 65W Fast Charger",
                "brand": "Anker",
                "model": "GaNPrime 65W",
                "sku": "ANK-GAN65W",
                "category": categories["Accessories"],
                "description": "3-port fast wall charger with PowerIQ 4.0",
                "price": Decimal("49.99"),
                "cost_price": Decimal("25.00"),
                "stock_quantity": 30,
                "low_stock_threshold": 5,
            },
            {
                "name": "MagSafe Screen Protector",
                "brand": "Belkin",
                "model": "iPhone 15 Pro Glass",
                "sku": "BLK-SCRPRO-IP15P",
                "category": categories["Accessories"],
                "description": "Tempered glass screen protection kit",
                "price": Decimal("29.99"),
                "cost_price": Decimal("10.00"),
                "stock_quantity": 4,  # Low stock test case
                "low_stock_threshold": 5,
            },
            {
                "name": "Sony WF-1000XM5 Earbuds",
                "brand": "Sony",
                "model": "WF-1000XM5",
                "sku": "SNY-WF1000XM5",
                "category": categories["Audio"],
                "description": "Best-in-class noise cancelling wireless earbuds",
                "price": Decimal("299.99"),
                "cost_price": Decimal("210.00"),
                "stock_quantity": 15,
                "low_stock_threshold": 3,
            },
            {
                "name": "iPhone 15 Pro OEM Display Assembly",
                "brand": "Apple OEM",
                "model": "IP15P Screen Part",
                "sku": "PRT-IPH15P-DISP",
                "category": categories["Spare Parts"],
                "description": "Original Super Retina XDR OLED replacement screen",
                "price": Decimal("250.00"),
                "cost_price": Decimal("180.00"),
                "stock_quantity": 6,
                "low_stock_threshold": 2,
            },
        ]

        for p_data in products_data:
            threshold = p_data.pop("low_stock_threshold")
            product, p_created = Product.objects.get_or_create(
                sku=p_data["sku"],
                defaults=p_data,
            )
            Inventory.objects.get_or_create(
                product=product,
                defaults={"low_stock_threshold": threshold},
            )

        self.stdout.write(self.style.SUCCESS(f"  Created/verified {len(products_data)} products and inventory records."))

        # 4. Service Catalogue
        services_data = [
            {
                "name": "Screen Replacement",
                "description": "OEM display replacement for smartphones and tablets",
                "estimated_price": Decimal("120.00"),
                "estimated_duration": "1 - 2 hours",
            },
            {
                "name": "Battery Replacement",
                "description": "Genuine battery installation with health calibration",
                "estimated_price": Decimal("65.00"),
                "estimated_duration": "45 - 60 minutes",
            },
            {
                "name": "Water Damage Diagnostic & Cleaning",
                "description": "Ultrasonic bath cleaning and board-level inspection",
                "estimated_price": Decimal("90.00"),
                "estimated_duration": "24 - 48 hours",
            },
            {
                "name": "Charging Port Repair",
                "description": "Flex cable replacement or port pin re-soldering",
                "estimated_price": Decimal("55.00"),
                "estimated_duration": "1 hour",
            },
        ]

        for s_data in services_data:
            Service.objects.get_or_create(
                name=s_data["name"],
                defaults=s_data,
            )

        self.stdout.write(self.style.SUCCESS(f"  Created/verified {len(services_data)} repair services."))
        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully."))
