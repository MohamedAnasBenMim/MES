from django.db import models
from django.utils import timezone


class IonAPICredentials(models.Model):
    ti = models.CharField(max_length=100)
    cn = models.CharField(max_length=50)
    dt = models.CharField(max_length=10)
    ci = models.TextField()
    cs = models.TextField()
    iu = models.URLField()
    pu = models.URLField()
    oa = models.CharField(max_length=100)
    ot = models.CharField(max_length=100)
    or_field = models.CharField(
        max_length=100, db_column="or"
    )  # 'or' is a Python keyword
    sc = models.JSONField(default=list)  # Assuming it's always a list
    ev = models.CharField(max_length=50)
    v = models.CharField(max_length=10)
    company = models.CharField(max_length=100, blank=True, null=True)
    filename = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"IonAPI for {self.cn} ({self.ti})"


# ---------------------------------------------------------------


class UserAccount(models.Model):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=100)
    language = models.CharField(max_length=50)
    phone_number = models.CharField(max_length=20)
    password = models.CharField(max_length=128)
    profile_image = models.ImageField(
        upload_to="profile_images/", null=True, blank=True
    )

    # Personal settings
    display_name = models.CharField(max_length=150, blank=True, default="")
    job_title = models.CharField(max_length=50, blank=True, default="")
    timezone = models.CharField(max_length=100, default="Africa/Tunis")
    country = models.CharField(max_length=2, default="TN")
    date_format = models.CharField(max_length=20, default="dd/MM/yyyy")
    time_format = models.CharField(max_length=10, default="24h")
    theme = models.CharField(max_length=10, default="system")

    # Account activation status
    is_active = models.BooleanField(default=True)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    last_failed_login = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username


# ------------------------------------------------------------------
class ActiveOperation(models.Model):
    username = models.CharField(max_length=255, default="", blank=True, null=True)

    # NEW FIELD (company_id safe)
    company_id = models.CharField(max_length=50, default="", blank=True, null=True)

    order = models.CharField(max_length=50, default="", blank=True, null=True)
    operation = models.CharField(max_length=50, default="", blank=True, null=True)

    operated_item = models.CharField(max_length=255, default="", blank=True, null=True)

    reference_operation_machine_type = models.CharField(
        max_length=255, default="", blank=True, null=True
    )
    routing_quantity = models.FloatField(default=0, null=True)

    planned_start_date = models.CharField(
        max_length=255, default="", blank=True, null=True
    )
    planned_finish_date = models.CharField(
        max_length=255, default="", blank=True, null=True
    )

    reference_operation_work_center = models.CharField(
        max_length=255, default="", blank=True, null=True
    )

    operation_status = models.CharField(
        max_length=50, default="", blank=True, null=True
    )

    def __str__(self):
        return f"{self.order} - {self.operation} ({self.username})"

    # ------------------------------------------------------------------


class OperatorAssignment(models.Model):
    STATUS_CHOICES = [
        ("assigned", "Assigned"),
        ("working", "Working"),
        ("completed", "Completed"),
        ("closed", "Closed"),
    ]

    CLOSED_REASON_CHOICES = [
        ("completed", "Completed"),
        ("removed", "Removed"),
        ("reassigned", "Reassigned"),
        ("cancelled", "Cancelled"),
    ]

    operator = models.ForeignKey(
        UserAccount, on_delete=models.PROTECT, related_name="operator_assignments"
    )

    operation = models.ForeignKey(
        ActiveOperation, on_delete=models.PROTECT, related_name="operator_assignments"
    )

    assigned_by = models.ForeignKey(
        UserAccount, on_delete=models.PROTECT, related_name="assignments_created"
    )

    assigned_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    closed_reason = models.CharField(
        max_length=50, choices=CLOSED_REASON_CHOICES, null=True, blank=True
    )

    notes = models.TextField(blank=True, default="")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="assigned")

    def __str__(self):
        return f"{self.operator} -> {self.operation} ({self.status})"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["operator"],
                condition=models.Q(closed_at__isnull=True),
                name="unique_active_assignment_per_operator",
            ),
            models.UniqueConstraint(
                fields=["operation"],
                condition=models.Q(closed_at__isnull=True),
                name="unique_active_assignment_per_operation",
            ),
        ]


# ------------------------------------------------------------------


class OperatorPerformance(models.Model):
    username = models.CharField(
        max_length=150,
        db_index=True,
    )

    company_id = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    order = models.CharField(
        max_length=100,
        db_index=True,
    )

    operation = models.CharField(
        max_length=100,
        db_index=True,
    )

    qty_deliver = models.FloatField(
        default=0,
    )

    qty_reject = models.FloatField(
        default=0,
    )

    quality_score = models.FloatField(
        default=100,
    )

    points = models.IntegerField(
        default=0,
    )

    completed_at = models.DateTimeField(
        default=timezone.now,
        db_index=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "-completed_at",
        ]

        indexes = [
            models.Index(
                fields=[
                    "username",
                    "completed_at",
                ],
                name="operator_perf_user_date",
            ),
        ]

    def __str__(self):
        return (
            f"{self.username} - "
            f"{self.order}/{self.operation} - "
            f"{self.points} points"
        )


# ------------------------------------------------------------------
# User Activity & Time Tracking


class UserSessionLog(models.Model):
    username = models.CharField(max_length=150)
    email = models.EmailField(blank=True, null=True)
    role = models.CharField(max_length=100, blank=True, null=True)

    login_time = models.DateTimeField(default=timezone.now)
    logout_time = models.DateTimeField(blank=True, null=True)
    last_activity = models.DateTimeField(default=timezone.now)

    is_active = models.BooleanField(default=True)
    duration_seconds = models.PositiveIntegerField(default=0)

    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-login_time"]

    def __str__(self):
        return f"{self.username} - {self.login_time}"

    def calculate_duration_seconds(self):
        end_time = self.logout_time or timezone.now()
        duration = end_time - self.login_time
        return max(int(duration.total_seconds()), 0)

    def close_session(self):
        self.logout_time = timezone.now()
        self.last_activity = timezone.now()
        self.is_active = False
        self.duration_seconds = self.calculate_duration_seconds()
        self.save()


class PendingUserVerification(models.Model):
    username = models.CharField(max_length=150)
    email = models.EmailField()
    role = models.CharField(max_length=100)
    language = models.CharField(max_length=50)
    phone_number = models.CharField(max_length=30)

    verification_code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    attempts = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"{self.email} - verification pending"


class PendingPasswordChange(models.Model):
    username = models.CharField(max_length=150)
    email = models.EmailField()

    new_password_hash = models.CharField(max_length=128)
    verification_code_hash = models.CharField(max_length=128)

    expires_at = models.DateTimeField()
    attempts = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"{self.username} - password change pending"


class DispatchOperation(models.Model):
    company_id = models.CharField(max_length=100, db_index=True)
    order = models.CharField(max_length=100, db_index=True)
    operation = models.CharField(max_length=100, db_index=True)

    operated_item = models.CharField(max_length=255, blank=True, default="")

    reference_operation_machine_type = models.CharField(
        max_length=255, blank=True, default=""
    )

    routing_quantity = models.FloatField(default=0)

    planned_start_date = models.CharField(max_length=255, blank=True, default="")

    reference_operation_work_center = models.CharField(
        max_length=255, blank=True, default=""
    )

    operation_status = models.CharField(max_length=100, blank=True, default="")

    # Keeps the complete LN object in case you need more fields later.
    raw_data = models.JSONField(default=dict)

    synchronized_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "operation"]

        constraints = [
            models.UniqueConstraint(
                fields=["company_id", "order", "operation"],
                name="unique_dispatch_operation",
            )
        ]

        indexes = [
            models.Index(
                fields=["company_id", "order", "operation"],
                name="dispatch_company_order_idx",
            ),
            models.Index(
                fields=["company_id", "operation_status"],
                name="dispatch_company_status_idx",
            ),
        ]

    def __str__(self):
        return f"{self.company_id} - " f"{self.order} - " f"{self.operation}"


class DispatchSynchronization(models.Model):
    STATUS_CHOICES = [
        ("never", "Never synchronized"),
        ("running", "Synchronization running"),
        ("success", "Synchronization successful"),
        ("error", "Synchronization failed"),
    ]

    name = models.CharField(max_length=100, unique=True, default="dispatch")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="never")

    last_started_at = models.DateTimeField(blank=True, null=True)

    last_success_at = models.DateTimeField(blank=True, null=True)

    last_error_at = models.DateTimeField(blank=True, null=True)

    last_error = models.TextField(blank=True, default="")

    records_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.status}"


class IDMConfiguration(models.Model):
    document = models.CharField(max_length=100)
    document_type = models.CharField(max_length=100, unique=True)
    entity_type = models.CharField(max_length=100)
    entity_type_value = models.CharField(max_length=100)
    accounting_entity = models.CharField(max_length=100)
    accounting_entity_value = models.CharField(max_length=100)
    location = models.CharField(max_length=100, blank=True, default="")
    location_value = models.CharField(max_length=100, blank=True, default="")
    invoice_number = models.CharField(max_length=100)
    transaction_type = models.CharField(max_length=100, blank=True, default="")
    financial_company = models.CharField(max_length=100)

    created_by = models.CharField(max_length=50, blank=True, default="")
    created_date = models.DateTimeField(auto_now_add=True)
    modified_by = models.CharField(max_length=50, blank=True, default="")
    modified_date = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "IDM_CONFIGURATION"

    def __str__(self):
        return self.document_type


class MESDevice(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("disabled", "Disabled"),
    ]

    device_id = models.CharField(max_length=100, unique=True)
    device_name = models.CharField(max_length=100)
    device_type = models.CharField(max_length=50)
    mac_address = models.CharField(max_length=100, unique=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
    )

    last_login = models.DateTimeField(blank=True, null=True)
    last_seen = models.DateTimeField(blank=True, null=True)

    disabled_date = models.DateTimeField(blank=True, null=True)
    disabled_by = models.CharField(max_length=50, blank=True, default="")
    disable_reason = models.TextField(blank=True, default="")

    created_date = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=50, blank=True, default="")
    last_updated_date = models.DateTimeField(auto_now=True)
    last_updated_by = models.CharField(max_length=50, blank=True, default="")

    class Meta:
        db_table = "MES_DEVICE"
        ordering = ["device_name"]

    def __str__(self):
        return f"{self.device_name} ({self.device_id})"
