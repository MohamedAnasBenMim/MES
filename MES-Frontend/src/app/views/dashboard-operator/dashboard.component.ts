import {
  CommonModule,
} from '@angular/common';

import {
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  Router,
} from '@angular/router';

import {
  ChartjsComponent,
} from '@coreui/angular-chartjs';

import {
  ProgressComponent,
} from '@coreui/angular';
import {
  getAuthItem,
  getAuthRole,
  getAuthUser,
  getAuthUsername,
} from '../../utils/auth-storage';

import {
  Subscription,
} from 'rxjs';

import {
  ChampionOperator,
  OperatorDashboardOperation,
  OperatorDashboardResponse,
  OperatorDashboardService,
} from '../../services/operator-dashboard/operator-dashboard.service';

import {
  ApiServiceCompleteOperation,
} from '../../services/report-operation-post-API/api-report-operation.service';

import {
  LanguageService,
} from '../../services/language/language.service';

import {
  UserApiService,
  UserSettings,
} from '../../services/user-get-API/api-user-get.service';

interface DashboardTranslations {
  loading: string;
  unavailable: string;
  retry: string;

  workspace: string;
  goodMorning: string;
  goodAfternoon: string;
  welcomeDescription: string;
  reportNextOperation: string;

  activeOperations: string;
  completedThisWeek: string;
  deliveredQuantity: string;
  rejectedQuantity: string;
  weeklyPoints: string;

  weeklyOutput: string;
  productivity: string;
  thisWeek: string;
  completedOperations: string;

  qualityPerformance: string;
  productionStatus: string;
  quality: string;
  delivered: string;
  rejected: string;
  yourRank: string;

  currentWorkload: string;
  productionOperations: string;
  active: string;
  order: string;
  operation: string;
  productionItem: string;
  workCenter: string;
  plannedQuantity: string;
  reportOperation: string;
  noActiveOperations: string;
  operationsAppearHere: string;

  productionWorkspace: string;
  production: string;

  championsBoard: string;
  weeklyCompetition: string;
  operations: string;
  points: string;
  noChampions: string;

  productivityScore: string;
  weeklyPointsSmall: string;

  recentIssues: string;
  noRejectedQuantities: string;

  productionReporting: string;
  completeOperation: string;
  cancel: string;
  confirmOperation: string;
  reporting: string;

  noOperatorFound: string;
  noOperatorAction: string;
  dashboardLoadError: string;
  validDeliveredQuantity: string;
  validRejectedQuantity: string;
  quantityRequired: string;
  reportSuccess: string;
  reportFailure: string;

  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

@Component({
  selector: 'app-dashboard',

  standalone: true,

  templateUrl:
    './dashboard.component.html',

  styleUrls: [
    './dashboard.component.css',
  ],

  imports: [
    CommonModule,
    FormsModule,
    ChartjsComponent,
    ProgressComponent,
  ],
})
export class DashboardComponent
  implements OnInit, OnDestroy
{
  private languageSubscription?:
    Subscription;

  private dailyProductivity:
    OperatorDashboardResponse[
      'daily_productivity'
    ] = [];

  private readonly settingsUpdatedListener =
    (
      event: Event
    ) => {
      const settings =
        (
          event as CustomEvent<
            Partial<UserSettings>
          >
        ).detail;

      this.applyUserSettings(
        settings
      );
    };

  loading = true;
  loadingError = '';

  operatorUsername = '';
  operatorName = 'Operator';
  operatorRole = 'Operator';

  operatorImage =
    'assets/default-avatar.png';

  currentDate =
    new Date();

  statistics = {
    active_operations: 0,
    completed_this_week: 0,
    delivered_quantity: 0,
    rejected_quantity: 0,
    quality_score: 100,
    points: 0,
  };

  activeOperations:
    OperatorDashboardOperation[] = [];

  champions:
    ChampionOperator[] = [];

  recentIssues:
    OperatorDashboardResponse[
      'recent_issues'
    ] = [];

  productivityChart: any;

  reportModalVisible = false;

  selectedOperation:
    OperatorDashboardOperation
    | null = null;

  deliveredQuantity:
    number | null = null;

  rejectedQuantity = 0;

  reportError = '';
  reportSuccess = '';

  reporting = false;

  text: DashboardTranslations = {
    loading: '',
    unavailable: '',
    retry: '',

    workspace: '',
    goodMorning: '',
    goodAfternoon: '',
    welcomeDescription: '',
    reportNextOperation: '',

    activeOperations: '',
    completedThisWeek: '',
    deliveredQuantity: '',
    rejectedQuantity: '',
    weeklyPoints: '',

    weeklyOutput: '',
    productivity: '',
    thisWeek: '',
    completedOperations: '',

    qualityPerformance: '',
    productionStatus: '',
    quality: '',
    delivered: '',
    rejected: '',
    yourRank: '',

    currentWorkload: '',
    productionOperations: '',
    active: '',
    order: '',
    operation: '',
    productionItem: '',
    workCenter: '',
    plannedQuantity: '',
    reportOperation: '',
    noActiveOperations: '',
    operationsAppearHere: '',

    productionWorkspace: '',
    production: '',

    championsBoard: '',
    weeklyCompetition: '',
    operations: '',
    points: '',
    noChampions: '',

    productivityScore: '',
    weeklyPointsSmall: '',

    recentIssues: '',
    noRejectedQuantities: '',

    productionReporting: '',
    completeOperation: '',
    cancel: '',
    confirmOperation: '',
    reporting: '',

    noOperatorFound: '',
    noOperatorAction: '',
    dashboardLoadError: '',
    validDeliveredQuantity: '',
    validRejectedQuantity: '',
    quantityRequired: '',
    reportSuccess: '',
    reportFailure: '',

    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: '',
  };

  constructor(
    private readonly dashboardService:
      OperatorDashboardService,

    private readonly reportService:
      ApiServiceCompleteOperation,

    private readonly languageService:
      LanguageService,

    private readonly userApiService:
      UserApiService,

    private readonly router:
      Router
  ) {}

  ngOnInit(): void {
const user = getAuthUser();

if (user?.username) {
  this.operatorUsername = user.username.toLowerCase();
  this.operatorName = user.username || 'Operator';
}

/*
 * This subscription is triggered every
 * time the language changes in Settings.
 */
this.languageSubscription =
  this.languageService.currentLanguage$.subscribe(() => {
    this.refreshTranslations();

    /*
     * Rebuild the chart so its labels
     * also change immediately.
     */
    if (this.dailyProductivity.length > 0) {
      this.buildProductivityChart(
        this.dailyProductivity
      );
    }
  });

    window.addEventListener(
      'mes-user-settings-updated',
      this.settingsUpdatedListener
    );

    this.loadLoggedInUser();
    this.loadUserSettings();
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.languageSubscription
      ?.unsubscribe();

    window.removeEventListener(
      'mes-user-settings-updated',
      this.settingsUpdatedListener
    );
  }

  refreshTranslations(): void {
    this.text = {
      
      loading:
        this.translate(
          'OPERATOR_DASHBOARD.LOADING'
        ),

      unavailable:
        this.translate(
          'OPERATOR_DASHBOARD.UNAVAILABLE'
        ),

      retry:
        this.translate(
          'COMMON.RETRY'
        ),

      workspace:
        this.translate(
          'OPERATOR_DASHBOARD.WORKSPACE'
        ),

      goodMorning:
        this.translate(
          'OPERATOR_DASHBOARD.GOOD_MORNING'
        ),

      goodAfternoon:
        this.translate(
          'OPERATOR_DASHBOARD.GOOD_AFTERNOON'
        ),

      welcomeDescription:
        this.translate(
          'OPERATOR_DASHBOARD.WELCOME_DESCRIPTION'
        ),

      reportNextOperation:
        this.translate(
          'OPERATOR_DASHBOARD.REPORT_NEXT_OPERATION'
        ),

      activeOperations:
        this.translate(
          'OPERATOR_DASHBOARD.ACTIVE_OPERATIONS'
        ),

      completedThisWeek:
        this.translate(
          'OPERATOR_DASHBOARD.COMPLETED_THIS_WEEK'
        ),

      deliveredQuantity:
        this.translate(
          'OPERATOR_DASHBOARD.DELIVERED_QUANTITY'
        ),

      rejectedQuantity:
        this.translate(
          'OPERATOR_DASHBOARD.REJECTED_QUANTITY'
        ),

      weeklyPoints:
        this.translate(
          'OPERATOR_DASHBOARD.WEEKLY_POINTS'
        ),

      weeklyOutput:
        this.translate(
          'OPERATOR_DASHBOARD.WEEKLY_OUTPUT'
        ),

      productivity:
        this.translate(
          'OPERATOR_DASHBOARD.PRODUCTIVITY'
        ),

      thisWeek:
        this.translate(
          'OPERATOR_DASHBOARD.THIS_WEEK'
        ),

      completedOperations:
        this.translate(
          'OPERATOR_DASHBOARD.COMPLETED_OPERATIONS'
        ),

      qualityPerformance:
        this.translate(
          'OPERATOR_DASHBOARD.QUALITY_PERFORMANCE'
        ),

      productionStatus:
        this.translate(
          'OPERATOR_DASHBOARD.PRODUCTION_STATUS'
        ),

      quality:
        this.translate(
          'OPERATOR_DASHBOARD.QUALITY'
        ),

      delivered:
        this.translate(
          'OPERATOR_DASHBOARD.DELIVERED'
        ),

      rejected:
        this.translate(
          'OPERATOR_DASHBOARD.REJECTED'
        ),

      yourRank:
        this.translate(
          'OPERATOR_DASHBOARD.YOUR_RANK'
        ),

      currentWorkload:
        this.translate(
          'OPERATOR_DASHBOARD.CURRENT_WORKLOAD'
        ),

      productionOperations:
        this.translate(
          'OPERATOR_DASHBOARD.PRODUCTION_OPERATIONS'
        ),

      active:
        this.translate(
          'OPERATOR_DASHBOARD.ACTIVE'
        ),

      order:
        this.translate(
          'OPERATOR_DASHBOARD.ORDER'
        ),

      operation:
        this.translate(
          'OPERATOR_DASHBOARD.OPERATION'
        ),

      productionItem:
        this.translate(
          'OPERATOR_DASHBOARD.PRODUCTION_ITEM'
        ),

      workCenter:
        this.translate(
          'OPERATOR_DASHBOARD.WORK_CENTER'
        ),

      plannedQuantity:
        this.translate(
          'OPERATOR_DASHBOARD.PLANNED_QUANTITY'
        ),

      reportOperation:
        this.translate(
          'OPERATOR_DASHBOARD.REPORT_OPERATION'
        ),

      noActiveOperations:
        this.translate(
          'OPERATOR_DASHBOARD.NO_ACTIVE_OPERATIONS'
        ),

      operationsAppearHere:
        this.translate(
          'OPERATOR_DASHBOARD.OPERATIONS_APPEAR_HERE'
        ),

      productionWorkspace:
        this.translate(
          'OPERATOR_DASHBOARD.PRODUCTION_WORKSPACE'
        ),

      production:
        this.translate(
          'OPERATOR_DASHBOARD.PRODUCTION'
        ),

      championsBoard:
        this.translate(
          'OPERATOR_DASHBOARD.CHAMPIONS_BOARD'
        ),

      weeklyCompetition:
        this.translate(
          'OPERATOR_DASHBOARD.WEEKLY_COMPETITION'
        ),

      operations:
        this.translate(
          'OPERATOR_DASHBOARD.OPERATIONS'
        ),

      points:
        this.translate(
          'OPERATOR_DASHBOARD.POINTS'
        ),

      noChampions:
        this.translate(
          'OPERATOR_DASHBOARD.NO_CHAMPIONS'
        ),

      productivityScore:
        this.translate(
          'OPERATOR_DASHBOARD.PRODUCTIVITY_SCORE'
        ),

      weeklyPointsSmall:
        this.translate(
          'OPERATOR_DASHBOARD.WEEKLY_POINTS_SMALL'
        ),

      recentIssues:
        this.translate(
          'OPERATOR_DASHBOARD.RECENT_ISSUES'
        ),

      noRejectedQuantities:
        this.translate(
          'OPERATOR_DASHBOARD.NO_REJECTED_QUANTITIES'
        ),

      productionReporting:
        this.translate(
          'OPERATOR_DASHBOARD.PRODUCTION_REPORTING'
        ),

      completeOperation:
        this.translate(
          'OPERATOR_DASHBOARD.COMPLETE_OPERATION'
        ),

      cancel:
        this.translate(
          'COMMON.CANCEL'
        ),

      confirmOperation:
        this.translate(
          'OPERATOR_DASHBOARD.CONFIRM_OPERATION'
        ),

      reporting:
        this.translate(
          'OPERATOR_DASHBOARD.REPORTING'
        ),

      noOperatorFound:
        this.translate(
          'OPERATOR_DASHBOARD.NO_OPERATOR_FOUND'
        ),

      noOperatorAction:
        this.translate(
          'OPERATOR_DASHBOARD.NO_OPERATOR_ACTION'
        ),

      dashboardLoadError:
        this.translate(
          'OPERATOR_DASHBOARD.LOAD_ERROR'
        ),

      validDeliveredQuantity:
        this.translate(
          'OPERATOR_DASHBOARD.VALID_DELIVERED_QUANTITY'
        ),

      validRejectedQuantity:
        this.translate(
          'OPERATOR_DASHBOARD.VALID_REJECTED_QUANTITY'
        ),

      quantityRequired:
        this.translate(
          'OPERATOR_DASHBOARD.QUANTITY_REQUIRED'
        ),

      reportSuccess:
        this.translate(
          'OPERATOR_DASHBOARD.REPORT_SUCCESS'
        ),

      reportFailure:
        this.translate(
          'OPERATOR_DASHBOARD.REPORT_FAILURE'
        ),

      monday:
        this.translate(
          'OPERATOR_DASHBOARD.DAYS.MONDAY'
        ),

      tuesday:
        this.translate(
          'OPERATOR_DASHBOARD.DAYS.TUESDAY'
        ),

      wednesday:
        this.translate(
          'OPERATOR_DASHBOARD.DAYS.WEDNESDAY'
        ),

      thursday:
        this.translate(
          'OPERATOR_DASHBOARD.DAYS.THURSDAY'
        ),

      friday:
        this.translate(
          'OPERATOR_DASHBOARD.DAYS.FRIDAY'
        ),

      saturday:
        this.translate(
          'OPERATOR_DASHBOARD.DAYS.SATURDAY'
        ),

      sunday:
        this.translate(
          'OPERATOR_DASHBOARD.DAYS.SUNDAY'
        ),
    };

    /*
     * Update currently visible error
     * messages after language changes.
     */
    if (
      this.loadingError
      && !this.loading
    ) {
      this.loadingError =
        this.text.dashboardLoadError;
    }
  }

private translate(
  key: string
): string {
  const translated =
    this.languageService.instant(
      key
    );

  if (
    translated &&
    translated !== key
  ) {
    return translated;
  }

  const fallbackText:
    Record<string, string> = {
    'COMMON.RETRY':
      'Retry',

    'COMMON.CANCEL':
      'Cancel',

    'OPERATOR_DASHBOARD.LOADING':
      'Loading operator dashboard...',

    'OPERATOR_DASHBOARD.UNAVAILABLE':
      'Operator dashboard unavailable',

    'OPERATOR_DASHBOARD.WORKSPACE':
      'Production workspace',

    'OPERATOR_DASHBOARD.GOOD_MORNING':
      'Good morning',

    'OPERATOR_DASHBOARD.GOOD_AFTERNOON':
      'Good afternoon',

    'OPERATOR_DASHBOARD.WELCOME_DESCRIPTION':
      'Monitor your operations, quality and weekly performance.',

    'OPERATOR_DASHBOARD.REPORT_NEXT_OPERATION':
      'Report next operation',

    'OPERATOR_DASHBOARD.ACTIVE_OPERATIONS':
      'Active operations',

    'OPERATOR_DASHBOARD.COMPLETED_THIS_WEEK':
      'Completed this week',

    'OPERATOR_DASHBOARD.DELIVERED_QUANTITY':
      'Delivered quantity',

    'OPERATOR_DASHBOARD.REJECTED_QUANTITY':
      'Rejected quantity',

    'OPERATOR_DASHBOARD.WEEKLY_POINTS':
      'Weekly points',

    'OPERATOR_DASHBOARD.WEEKLY_OUTPUT':
      'Weekly output',

    'OPERATOR_DASHBOARD.PRODUCTIVITY':
      'Productivity',

    'OPERATOR_DASHBOARD.THIS_WEEK':
      'This week',

    'OPERATOR_DASHBOARD.COMPLETED_OPERATIONS':
      'Completed operations',

    'OPERATOR_DASHBOARD.QUALITY_PERFORMANCE':
      'Quality performance',

    'OPERATOR_DASHBOARD.PRODUCTION_STATUS':
      'Production status',

    'OPERATOR_DASHBOARD.QUALITY':
      'Quality',

    'OPERATOR_DASHBOARD.DELIVERED':
      'Delivered',

    'OPERATOR_DASHBOARD.REJECTED':
      'Rejected',

    'OPERATOR_DASHBOARD.YOUR_RANK':
      'Your rank',

    'OPERATOR_DASHBOARD.CURRENT_WORKLOAD':
      'Current workload',

    'OPERATOR_DASHBOARD.PRODUCTION_OPERATIONS':
      'Production operations',

    'OPERATOR_DASHBOARD.ACTIVE':
      'active',

    'OPERATOR_DASHBOARD.ORDER':
      'Order',

    'OPERATOR_DASHBOARD.OPERATION':
      'Operation',

    'OPERATOR_DASHBOARD.PRODUCTION_ITEM':
      'Production item',

    'OPERATOR_DASHBOARD.WORK_CENTER':
      'Work center',

    'OPERATOR_DASHBOARD.PLANNED_QUANTITY':
      'Planned quantity',

    'OPERATOR_DASHBOARD.REPORT_OPERATION':
      'Report operation',

    'OPERATOR_DASHBOARD.NO_ACTIVE_OPERATIONS':
      'No active operations',

    'OPERATOR_DASHBOARD.OPERATIONS_APPEAR_HERE':
      'Your currently assigned operations will appear here.',

    'OPERATOR_DASHBOARD.PRODUCTION_WORKSPACE':
      'Production workspace',

    'OPERATOR_DASHBOARD.PRODUCTION':
      'Production',

    'OPERATOR_DASHBOARD.CHAMPIONS_BOARD':
      'Champions Board',

    'OPERATOR_DASHBOARD.WEEKLY_COMPETITION':
      'Weekly competition',

    'OPERATOR_DASHBOARD.OPERATIONS':
      'operations',

    'OPERATOR_DASHBOARD.POINTS':
      'pts',

    'OPERATOR_DASHBOARD.NO_CHAMPIONS':
      'No operator performance has been recorded this week.',

    'OPERATOR_DASHBOARD.PRODUCTIVITY_SCORE':
      'Productivity score',

    'OPERATOR_DASHBOARD.WEEKLY_POINTS_SMALL':
      'weekly points',

    'OPERATOR_DASHBOARD.RECENT_ISSUES':
      'Recent issues',

    'OPERATOR_DASHBOARD.NO_REJECTED_QUANTITIES':
      'No rejected quantities recorded this week.',

    'OPERATOR_DASHBOARD.PRODUCTION_REPORTING':
      'Production reporting',

    'OPERATOR_DASHBOARD.COMPLETE_OPERATION':
      'Complete operation',

    'OPERATOR_DASHBOARD.CONFIRM_OPERATION':
      'Confirm operation',

    'OPERATOR_DASHBOARD.REPORTING':
      'Reporting...',

    'OPERATOR_DASHBOARD.NO_OPERATOR_FOUND':
      'This page needs an operator session. Log in with an operator account, or open the dashboard for your current role.',

    'OPERATOR_DASHBOARD.NO_OPERATOR_ACTION':
      'Open my dashboard',

    'OPERATOR_DASHBOARD.LOAD_ERROR':
      'The operator dashboard could not be loaded.',

    'OPERATOR_DASHBOARD.VALID_DELIVERED_QUANTITY':
      'Enter a valid delivered quantity.',

    'OPERATOR_DASHBOARD.VALID_REJECTED_QUANTITY':
      'Enter a valid rejected quantity.',

    'OPERATOR_DASHBOARD.QUANTITY_REQUIRED':
      'At least one quantity is required.',

    'OPERATOR_DASHBOARD.REPORT_SUCCESS':
      'Operation reported successfully.',

    'OPERATOR_DASHBOARD.REPORT_FAILURE':
      'The operation could not be reported.',

    'OPERATOR_DASHBOARD.DAYS.MONDAY':
      'Mon',

    'OPERATOR_DASHBOARD.DAYS.TUESDAY':
      'Tue',

    'OPERATOR_DASHBOARD.DAYS.WEDNESDAY':
      'Wed',

    'OPERATOR_DASHBOARD.DAYS.THURSDAY':
      'Thu',

    'OPERATOR_DASHBOARD.DAYS.FRIDAY':
      'Fri',

    'OPERATOR_DASHBOARD.DAYS.SATURDAY':
      'Sat',

    'OPERATOR_DASHBOARD.DAYS.SUNDAY':
      'Sun',
  };

  return fallbackText[key] || key;
}

  loadLoggedInUser(): void {
    try {
      const storedUser =
        getAuthUser();

      this.operatorUsername =
        storedUser?.username
        || getAuthUsername()
        || '';

      this.operatorName =
        storedUser?.display_name
        || storedUser?.username
        || 'Operator';

      this.operatorRole =
        storedUser?.job_title
        || this.formatRole(
          storedUser?.role
          || 'operator'
        );

      this.operatorImage =
        storedUser?.profile_image
        || 'assets/default-avatar.png';
    } catch {
      this.operatorUsername =
        getAuthUsername();

      this.operatorName =
        this.operatorUsername
        || 'Operator';

      this.operatorRole =
        'Operator';

      this.operatorImage =
        'assets/default-avatar.png';
    }
  }

  loadUserSettings(): void {
    const sessionId =
      getAuthItem(
        'session_id'
      );

    if (!sessionId) {
      return;
    }

    this.userApiService
      .getUserSettings(
        sessionId
      )
      .subscribe({
        next: (
          settings
        ) => {
          this.applyUserSettings(
            settings
          );
        },

        error: (
          error
        ) => {
          console.error(
            'Could not load operator settings:',
            error
          );
        },
      });
  }

  private applyUserSettings(
    settings:
      Partial<UserSettings>
      | null
      | undefined
  ): void {
    if (!settings) {
      return;
    }

    this.operatorName =
      settings.display_name
      || settings.username
      || this.operatorUsername
      || 'Operator';

    this.operatorRole =
      settings.job_title
      || this.formatRole(
        settings.role
        || 'operator'
      );

    this.operatorImage =
      settings.profile_image
      || 'assets/default-avatar.png';

    this.updateStoredUserSettings(
      settings
    );
  }

  private updateStoredUserSettings(
    settings:
      Partial<UserSettings>
  ): void {
    let storedUser: any = {};

    try {
      storedUser =
        JSON.parse(
          localStorage.getItem(
            'user'
          ) || '{}'
        );
    } catch {
      storedUser = {};
    }

    const updatedUser = {
      ...storedUser,
      ...settings,
    };

    localStorage.setItem(
      'user',
      JSON.stringify(
        updatedUser
      )
    );
  }

  loadDashboard(): void {
    const role =
      getAuthRole();

    if (
      role &&
      role !== 'operator'
    ) {
      this.loading = false;

      this.loadingError =
        this.text.noOperatorFound;

      return;
    }

    if (
      !this.operatorUsername
    ) {
      this.loading = false;

      this.loadingError =
        this.text.noOperatorFound;

      return;
    }

    this.loading = true;
    this.loadingError = '';

    this.dashboardService
      .getDashboard(
        this.operatorUsername
      )
      .subscribe({
        next: (response) => {
          /*
           * Keep display name and custom job title
           * loaded from User Settings.
           * The dashboard API username is used only
           * when no personal setting is available.
           */
          if (
            !this.operatorName
            || this.operatorName
            === 'Operator'
          ) {
            this.operatorName =
              response.operator.username;
          }

          if (
            !this.operatorRole
          ) {
            this.operatorRole =
              this.formatRole(
                response.operator.role
              );
          }

          if (
            response.operator
              .profile_image
            && this.operatorImage
              === 'assets/default-avatar.png'
          ) {
            this.operatorImage =
              response.operator
                .profile_image;
          }

          this.statistics =
            response.statistics;

          this.activeOperations =
            response.active_operations;

          this.champions =
            response.champions;

          this.recentIssues =
            response.recent_issues;

          this.dailyProductivity =
            response.daily_productivity;

          this.buildProductivityChart(
            this.dailyProductivity
          );

          this.loading = false;
        },

        error: (error) => {
          console.error(
            'Dashboard loading failed:',
            error
          );

          this.loadingError =
            error?.error?.error
            || this.text
              .dashboardLoadError;

          this.loading = false;
        },
      });
  }

  openCorrectDashboard(): void {
    const role =
      getAuthRole();

    const routeByRole:
      Record<string, string> = {
      admin: '/admin_dashboard',
      supervisor: '/supervisor_dashboard',
      quality: '/quality_dashboard',
      operator: '/dashboard',
    };

    this.router.navigate([
      routeByRole[role] || '/login',
    ]);
  }

  buildProductivityChart(
    productivity:
      OperatorDashboardResponse[
        'daily_productivity'
      ]
  ): void {
    this.productivityChart = {
      type: 'bar',

      data: {
        labels:
          productivity.map(
            (item) =>
              this.translateDay(
                item.day
              )
          ),

        datasets: [
          {
            label:
              this.text
                .completedOperations,

            data:
              productivity.map(
                (item) =>
                  item.count
              ),

            backgroundColor:
              'rgba(0, 174, 239, 0.22)',

            borderColor:
              '#00aeef',

            borderWidth: 1,

            borderRadius: 8,
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            display: false,
          },
        },

        scales: {
          x: {
            grid: {
              display: false,
            },
          },

          y: {
            beginAtZero: true,

            ticks: {
              precision: 0,
            },

            grid: {
              color:
                'rgba(148,163,184,.15)',
            },
          },
        },
      },
    };
  }

  translateDay(
    day: string
  ): string {
    const normalizedDay =
      String(day || '')
        .trim()
        .toLowerCase();

    const dayMap:
      Record<string, string> = {
      mon:
        this.text.monday,

      monday:
        this.text.monday,

      tue:
        this.text.tuesday,

      tuesday:
        this.text.tuesday,

      wed:
        this.text.wednesday,

      wednesday:
        this.text.wednesday,

      thu:
        this.text.thursday,

      thursday:
        this.text.thursday,

      fri:
        this.text.friday,

      friday:
        this.text.friday,

      sat:
        this.text.saturday,

      saturday:
        this.text.saturday,

      sun:
        this.text.sunday,

      sunday:
        this.text.sunday,
    };

    return (
      dayMap[normalizedDay]
      || day
    );
  }

  openReportModal(
    operation:
      OperatorDashboardOperation
  ): void {
    this.selectedOperation =
      operation;

    this.deliveredQuantity =
      operation.routing_quantity
      || null;

    this.rejectedQuantity = 0;

    this.reportError = '';
    this.reportSuccess = '';

    this.reportModalVisible = true;
  }

  closeReportModal(): void {
    if (
      this.reporting
    ) {
      return;
    }

    this.reportModalVisible = false;
    this.selectedOperation = null;
    this.deliveredQuantity = null;
    this.rejectedQuantity = 0;
    this.reportError = '';
    this.reportSuccess = '';
  }

  confirmReport(): void {
    if (
      !this.selectedOperation
      || this.reporting
    ) {
      return;
    }

    const delivered =
      Number(
        this.deliveredQuantity
      );

    const rejected =
      Number(
        this.rejectedQuantity
      );

    if (
      !Number.isFinite(
        delivered
      )
      || delivered < 0
    ) {
      this.reportError =
        this.text
          .validDeliveredQuantity;

      return;
    }

    if (
      !Number.isFinite(
        rejected
      )
      || rejected < 0
    ) {
      this.reportError =
        this.text
          .validRejectedQuantity;

      return;
    }

    if (
      delivered === 0
      && rejected === 0
    ) {
      this.reportError =
        this.text
          .quantityRequired;

      return;
    }

    this.reporting = true;
    this.reportError = '';
    this.reportSuccess = '';

    this.reportService
      .postData({
        order_id:
          this.selectedOperation
            .order,

        operation:
          this.selectedOperation
            .operation,

        qty_deliver:
          delivered,

        qty_reject:
          rejected,

        username:
          this.operatorUsername,
      })
      .subscribe({
        next: (
          response: any
        ) => {
          this.reporting = false;

          /*
           * Use the translated frontend
           * message instead of the backend
           * English response.
           */
          this.reportSuccess =
            this.text
              .reportSuccess;

          console.log(
            'Operation report response:',
            response
          );

          setTimeout(() => {
            this.closeReportModal();
            this.loadDashboard();
          }, 1000);
        },

        error: (
          error: any
        ) => {
          this.reporting = false;

          console.error(
            'Operation report failed:',
            error
          );

          this.reportError =
            this.text
              .reportFailure;
        },
      });
  }

  get greetingText(): string {
    const currentHour =
      new Date().getHours();

    return currentHour < 12
      ? this.text.goodMorning
      : this.text.goodAfternoon;
  }

  get currentOperatorRank():
    number | null {
    const champion =
      this.champions.find(
        (operator) =>
          operator.username
            .toLowerCase()
          === this.operatorUsername
            .toLowerCase()
      );

    return champion?.rank
      || null;
  }

  get qualityGaugeValue():
    number {
    return Math.round(
      this.statistics
        .quality_score
    );
  }

  getGaugeRotation():
    string {
    const value =
      Math.min(
        Math.max(
          this.qualityGaugeValue,
          0
        ),
        100
      );

    return (
      `${value * 3.6}deg`
    );
  }

  getRankClass(
    rank: number
  ): string {
    if (
      rank === 1
    ) {
      return 'rank-gold';
    }

    if (
      rank === 2
    ) {
      return 'rank-silver';
    }

    if (
      rank === 3
    ) {
      return 'rank-bronze';
    }

    return 'rank-normal';
  }

  isCurrentOperator(
    username: string
  ): boolean {
    return (
      username.toLowerCase()
      === this.operatorUsername
        .toLowerCase()
    );
  }

  formatRole(
    role: string
  ): string {
    return String(
      role || ''
    )
      .replace(
        /_/g,
        ' '
      )
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }
}
