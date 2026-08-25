from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("Backend", "0011_remove_activeoperation_operation_status_and_more"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                    ALTER TABLE "Backend_activeoperation"
                    ADD COLUMN IF NOT EXISTS "routing_quantity" double precision DEFAULT 0 NULL,
                    ADD COLUMN IF NOT EXISTS "planned_start_date" varchar(255) DEFAULT '' NULL,
                    ADD COLUMN IF NOT EXISTS "planned_finish_date" varchar(255) DEFAULT '' NULL,
                    ADD COLUMN IF NOT EXISTS "reference_operation_work_center" varchar(255) DEFAULT '' NULL,
                    ADD COLUMN IF NOT EXISTS "operation_status" varchar(50) DEFAULT '' NULL;
                    """,
                    reverse_sql="""
                    ALTER TABLE "Backend_activeoperation"
                    DROP COLUMN IF EXISTS "routing_quantity",
                    DROP COLUMN IF EXISTS "planned_start_date",
                    DROP COLUMN IF EXISTS "planned_finish_date",
                    DROP COLUMN IF EXISTS "reference_operation_work_center",
                    DROP COLUMN IF EXISTS "operation_status";
                    """,
                ),
                migrations.RunSQL(
                    sql="""
                    ALTER TABLE "Backend_operatorassignment"
                    DROP COLUMN IF EXISTS "routing_quantity",
                    DROP COLUMN IF EXISTS "planned_start_date",
                    DROP COLUMN IF EXISTS "planned_finish_date",
                    DROP COLUMN IF EXISTS "reference_operation_work_center",
                    DROP COLUMN IF EXISTS "operation_status";
                    """,
                    reverse_sql="""
                    ALTER TABLE "Backend_operatorassignment"
                    ADD COLUMN IF NOT EXISTS "routing_quantity" double precision DEFAULT 0 NULL,
                    ADD COLUMN IF NOT EXISTS "planned_start_date" varchar(255) DEFAULT '' NULL,
                    ADD COLUMN IF NOT EXISTS "planned_finish_date" varchar(255) DEFAULT '' NULL,
                    ADD COLUMN IF NOT EXISTS "reference_operation_work_center" varchar(255) DEFAULT '' NULL,
                    ADD COLUMN IF NOT EXISTS "operation_status" varchar(50) DEFAULT '' NULL;
                    """,
                ),
            ],
            state_operations=[],
        ),
    ]
