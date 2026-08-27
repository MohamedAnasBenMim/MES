from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin  # type: ignore
from django.urls import include, path

from .views.complete_order import complete_order
from .views.create_ionapi_credentials import create_ionapi_credentials
from .views.create_user import create_user
from .views.dashboard_stats import dashboard_stats
from .views.delete_user import delete_user

# Modular view imports
from .views.forgetPasswordView import ForgetPasswordView
from .views.get_dispatch_data import get_dispatch_data
from .views.get_inventory import get_inventory
from .views.get_ionapi_credential import get_ionapi_credential
from .views.get_items import get_items
from .views.get_materials import get_materials
from .views.get_nc_data import get_nc_data
from .views.get_operation_active_list import get_operation_active_list
from .views.get_operation_data import get_operation_data
from .views.get_operations import get_operations
from .views.get_ping_dispatch import get_ping_dispatch
from .views.get_related_nc_data import get_related_nc_data
from .views.get_token import get_token
from .views.get_user_data import get_user_data
from .views.get_users import get_users
from .views.get_warehouse_filter_options import get_warehouse_filter_options
from .views.get_warehouses import get_warehouses
from .views.idm_configuration import idm_configuration_detail, idm_configurations
from .views.login_user import login_user
from .views.mes_devices import (
    disable_mes_device,
    enable_mes_device,
    mes_device_detail,
    mes_devices,
    update_mes_device_last_seen,
)
from .views.operator_assignments import (
    active_operations,
    operator_assignment_detail,
    operator_assignment_history,
    operator_assignments,
    operators,
)
from .views.operator_dashboard import operator_dashboard
from .views.post_initiate_materials import post_initiate_materials
from .views.post_nc import post_nc
from .views.post_nc_attachment import post_nc_attachment
from .views.post_operation_active_list import post_operation_active_list
from .views.profile_change_password import profile_change_password
from .views.profile_password_verification import (
    request_profile_password_change_code,
    verify_profile_password_change_code,
)
from .views.report_operation import report_operation
from .views.toggle_user_status import toggle_user_status
from .views.update_user import update_user
from .views.user_email_verification import (
    send_user_verification_code,
    verify_user_and_create,
)
from .views.user_session_tracking import (
    user_session_activity,
    user_session_heartbeat,
    user_session_logout,
)
from .views.user_settings import user_settings

urlpatterns = [
    path("admin/", admin.site.urls),
    # Core APIs
    path("api/operations/", get_operations),
    path("api/get-token/", get_token),
    path("api/dispatch-data/", get_dispatch_data),
    path("api/nc-data/", get_nc_data),
    path("api/post_nc/", post_nc),
    path("api/completeorder/", complete_order),
    path("api/get_inventory/", get_inventory),
    path("api/get_items/", get_items),
    path("api/get_warehouses/", get_warehouses),
    path("api/get_warehouse_filter_options/", get_warehouse_filter_options),
    # Operations
    path("api/report_operation/", report_operation),
    path("api/get_operation_data/", get_operation_data),
    path("api/post_initiate_materials/", post_initiate_materials),
    path("api/get_materials/", get_materials),
    path("api/get_related_nc_data/", get_related_nc_data),
    path("api/post_nc_attachment/", post_nc_attachment),
    path("api/post_operation_active_list/", post_operation_active_list),
    path("api/get_operation_active_list/", get_operation_active_list),
    path("api/dashboard-stats/", dashboard_stats),
    path(
        "api/operator-dashboard/",
        operator_dashboard,
    ),
    # ION API
    path("api/create_ionapi_credentials/", create_ionapi_credentials),
    path("api/get_ionapi_credential/", get_ionapi_credential),
    path("api/get_ping_dispatch/", get_ping_dispatch),
    # idm configuration
    path("api/idm-configurations/", idm_configurations),
    path("api/idm-configurations/<int:config_id>/", idm_configuration_detail),
    # mes devices
    path("api/mes-devices/", mes_devices),
    path("api/mes-devices/<int:device_id>/", mes_device_detail),
    path("api/mes-devices/<int:device_id>/disable/", disable_mes_device),
    path("api/mes-devices/<int:device_id>/enable/", enable_mes_device),
    path("api/mes-devices/last-seen/", update_mes_device_last_seen),
    # Users
    path("api/create_user/", create_user),
    path("api/get_users/", get_users),
    path("api/delete_user/<int:user_id>/", delete_user),
    path("api/toggle_user_status/<int:user_id>/", toggle_user_status),
    path("api/update_user/<int:user_id>/", update_user),
    path("api/get_user_data/<int:user_id>/", get_user_data),
    path("api/login/", login_user, name="login_user"),
    path("api/profile-change-password/", profile_change_password),
    path("api/send-user-verification-code/", send_user_verification_code),
    path("api/verify-user-and-create/", verify_user_and_create),
    path(
        "api/profile-password/request-code/",
        request_profile_password_change_code,
    ),
    path(
        "api/profile-password/verify-code/",
        verify_profile_password_change_code,
    ),
    # User Settings
    path("api/user/settings/", user_settings),
    # User Activity & Time Tracking
    path("api/user-session/heartbeat/", user_session_heartbeat),
    path("api/user-session/logout/", user_session_logout),
    path("api/user-session/activity/", user_session_activity),
    # Auth app
    path("api/", include("auth_app.urls")),
    path("api/forget-password/", ForgetPasswordView.as_view(), name="forget-password"),
    path("api/operators/", operators),
    path("api/operations/active/", active_operations),
    path("api/operator-assignments/", operator_assignments),
    path("api/operator-assignments/<int:assignment_id>/", operator_assignment_detail),
    path("api/operator-assignments/history/", operator_assignment_history),
]

# Only for development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
