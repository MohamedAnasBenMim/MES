import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  NgZone,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import {
  AvatarComponent,
  BadgeComponent,
  ColorModeService,
  ContainerComponent,
  DropdownComponent,
  DropdownDividerDirective,
  DropdownHeaderDirective,
  DropdownItemDirective,
  DropdownMenuDirective,
  DropdownToggleDirective,
  HeaderComponent,
  HeaderNavComponent,
  HeaderTogglerDirective,
  NavItemComponent,
  NavLinkDirective,
  SidebarToggleDirective,
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';

import {
  UserApiService,
  UserSettings,
} from '../../../services/user-get-API/api-user-get.service';
import { LanguageService } from '../../../services/language/language.service';
import {
  clearAuthSession,
  getAuthItem,
  getAuthUser,
  getAuthUserId,
  getAuthUsername,
} from '../../../utils/auth-storage';

interface HeaderTranslations {
  dashboard: string;
  users: string;
  settings: string;
  account: string;
  updates: string;
  messages: string;
  profile: string;
  logout: string;
  home: string;
  light: string;
  dark: string;
  auto: string;
  toggleSidebar: string;
  openUserMenu: string;
  openThemePicker: string;
  manufacturing: string;
  warehousing: string;
  nonConformance: string;
}

@Component({
  selector: 'app-default-header',
  templateUrl: './default-header.component.html',
  styleUrls: ['./default-header.component.css'],
  standalone: true,
  imports: [
    ContainerComponent,
    HeaderTogglerDirective,
    SidebarToggleDirective,
    IconDirective,
    HeaderNavComponent,
    NavItemComponent,
    NavLinkDirective,
    RouterLink,
    RouterLinkActive,
    NgTemplateOutlet,
    DropdownComponent,
    DropdownToggleDirective,
    AvatarComponent,
    DropdownMenuDirective,
    DropdownHeaderDirective,
    DropdownItemDirective,
    BadgeComponent,
    DropdownDividerDirective,
  ],
})
export class DefaultHeaderComponent
  extends HeaderComponent
  implements OnInit, OnDestroy
{
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly languageService = inject(LanguageService);
  readonly #colorModeService = inject(ColorModeService);

  readonly colorMode = this.#colorModeService.colorMode;

  readonly colorModes = [
    { name: 'light', icon: 'cilSun' },
    { name: 'dark', icon: 'cilMoon' },
    { name: 'auto', icon: 'cilContrast' },
  ];

  readonly icons = computed(() => {
    const currentMode = this.colorMode();
    return (
      this.colorModes.find((mode) => mode.name === currentMode)?.icon ||
      'cilSun'
    );
  });

  sidebarId = input('sidebar1');

  imagePreviewUrl = 'assets/default-avatar.png';
  currentPageLabel = 'Home';

  currentDateText = '';
  currentTimeText = '';
  currentHourMinute = '';
  currentSecond = '00';
  currentPeriod = '';

  userTimezone = localStorage.getItem('timezone') || 'Africa/Tunis';
  userCountryCode = localStorage.getItem('country') || 'TN';
  userDateFormat = localStorage.getItem('date_format') || 'dd/MM/yyyy';
  userTimeFormat: '12h' | '24h' = (
    localStorage.getItem('time_format') || '24h'
  ) as '12h' | '24h';

  text: HeaderTranslations = {
    dashboard: 'Dashboard',
    users: 'Users',
    settings: 'Settings',
    account: 'Account',
    updates: 'Updates',
    messages: 'Messages',
    profile: 'Profile',
    logout: 'Logout',
    home: 'Home',
    light: 'Light',
    dark: 'Dark',
    auto: 'Auto',
    toggleSidebar: 'Toggle sidebar navigation',
    openUserMenu: 'Open user menu',
    openThemePicker: 'Open theme picker',
    manufacturing: 'Manufacturing',
    warehousing: 'Warehousing',
    nonConformance: 'Non-conformance',
  };

  private clockTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  private readonly settingsUpdatedListener = (event: Event) => {
    const settings = (event as CustomEvent<Partial<UserSettings>>).detail;

    if (!settings) {
      return;
    }

    if (settings.profile_image) {
      this.imagePreviewUrl = settings.profile_image;
    } else if (settings.profile_image === null) {
      this.imagePreviewUrl = 'assets/default-avatar.png';
    }

    this.applyRegionalSettings(settings);
    this.persistRegionalSettings(settings);
    this.updateDateTime();
    this.changeDetector.detectChanges();
  };

  constructor(
    private readonly router: Router,
    private readonly userApiService: UserApiService,
    private readonly ngZone: NgZone
  ) {
    super();
  }

  ngOnInit(): void {
    this.applyStoredRegionalSettings();
    this.loadUserProfileImage();
    this.loadHeaderSettings();

    window.addEventListener(
      'mes-user-settings-updated',
      this.settingsUpdatedListener
    );

    this.startClock();
    this.startHeartbeat();

    this.languageService.currentLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refreshTranslations();
        this.updateDateTime();
      });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.updateCurrentPageLabel();
      });

    this.refreshTranslations();
    this.updateCurrentPageLabel();
  }

  ngOnDestroy(): void {
    window.removeEventListener(
      'mes-user-settings-updated',
      this.settingsUpdatedListener
    );

    this.stopClock();
    this.stopHeartbeat();
  }

  get userCountryLabel(): string {
    const value = String(this.userCountryCode || '').trim().toUpperCase();
    const countries: Record<string, string> = {
      TN: 'Tunisia',
      FR: 'France',
      DE: 'Germany',
      NL: 'Netherlands',
      GB: 'United Kingdom',
      US: 'United States',
      IT: 'Italy',
      ES: 'Spain',
      AE: 'United Arab Emirates',
      SA: 'Saudi Arabia',
    };

    return countries[value] || value || 'Tunisia';
  }

  getColorModeLabel(modeName: string): string {
    if (modeName === 'dark') {
      return this.text.dark;
    }

    if (modeName === 'auto') {
      return this.text.auto;
    }

    return this.text.light;
  }

  loadUserProfileImage(): void {
    const userId = getAuthUserId();

    if (!userId) {
      return;
    }

    this.userApiService.getUserById(userId).subscribe({
      next: (fullUser) => {
        if (fullUser?.profile_image) {
          this.imagePreviewUrl = fullUser.profile_image;
        }
      },
      error: (error) => {
        console.error('Failed to fetch user data:', error);
      },
    });
  }

  loadHeaderSettings(): void {
    this.applyStoredRegionalSettings();

    const sessionId = getAuthItem('session_id');

    if (!sessionId) {
      this.applyRegionalSettings(this.getStoredUser());
      this.updateDateTime();
      return;
    }

    this.userApiService
      .getUserSettings(sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (settings) => {
          this.applyRegionalSettings(settings);
          this.persistRegionalSettings(settings);

          if (settings.profile_image) {
            this.imagePreviewUrl = settings.profile_image;
          }

          this.updateDateTime();
        },
        error: (error: unknown) => {
          console.error('Failed to load header settings:', error);
          this.applyRegionalSettings(this.getStoredUser());
          this.applyStoredRegionalSettings();
          this.updateDateTime();
        },
      });
  }

  startClock(): void {
    this.stopClock();
    this.updateDateTime();
    this.scheduleNextClockTick();
  }

  stopClock(): void {
    if (this.clockTimeout) {
      clearTimeout(this.clockTimeout);
      this.clockTimeout = null;
    }
  }

  updateDateTime(): void {
    const now = new Date();
    const locale = this.getCurrentLocale();

    const dateParts = new Intl.DateTimeFormat(locale, {
      timeZone: this.userTimezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).formatToParts(now);

    const dateValues: Record<string, string> = {};

    for (const part of dateParts) {
      if (part.type !== 'literal') {
        dateValues[part.type] = part.value;
      }
    }

    const day = dateValues['day'] || '';
    const month = dateValues['month'] || '';
    const year = dateValues['year'] || '';

    if (this.userDateFormat === 'MM/dd/yyyy') {
      this.currentDateText = `${month}/${day}/${year}`;
    } else if (this.userDateFormat === 'yyyy-MM-dd') {
      this.currentDateText = `${year}-${month}-${day}`;
    } else {
      this.currentDateText = `${day}/${month}/${year}`;
    }

    const timeParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: this.userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      hourCycle: 'h23',
    }).formatToParts(now);

    const timeValues: Record<string, string> = {};

    for (const part of timeParts) {
      if (part.type !== 'literal') {
        timeValues[part.type] = part.value;
      }
    }

    let hour = Number(timeValues['hour'] || '0');
    const minute = timeValues['minute'] || '00';
    const second = timeValues['second'] || '00';

    if (this.userTimeFormat === '12h') {
      this.currentPeriod = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12;
      this.currentHourMinute = `${hour.toString().padStart(2, '0')}:${minute}`;
    } else {
      this.currentPeriod = '';
      this.currentHourMinute = `${hour.toString().padStart(2, '0')}:${minute}`;
    }

    this.currentSecond = second;
    this.currentTimeText = `${this.currentHourMinute}:${second}${
      this.currentPeriod ? ` ${this.currentPeriod}` : ''
    }`;
  }

  startHeartbeat(): void {
    this.sendHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 60000);
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  sendHeartbeat(): void {
    const sessionId = getAuthItem('session_id');
    const username = getAuthUsername();

    if (!sessionId && !username) {
      return;
    }

    this.userApiService
      .heartbeatSession({
        session_id: sessionId,
        username,
      })
      .subscribe({
        error: (error) => {
          console.error('Heartbeat failed:', error);
        },
      });
  }

  logout(): void {
    const sessionId = getAuthItem('session_id');
    const username = getAuthUsername();

    this.stopHeartbeat();

    if (!sessionId && !username) {
      this.finishLogout();
      return;
    }

    this.userApiService
      .logoutSession({
        session_id: sessionId,
        username,
      })
      .subscribe({
        next: () => {
          this.finishLogout();
        },
        error: (error) => {
          console.error('Session logout failed:', error);
          this.finishLogout();
        },
      });
  }

  finishLogout(): void {
    clearAuthSession();
    this.router.navigate(['/login']);
  }

  editprofile(): void {
    this.router.navigate(['/edit_profile']);
  }

  openSettings(): void {
    this.router.navigate(['/settings']);
  }

  private scheduleNextClockTick(): void {
    const delay = 1000 - (Date.now() % 1000) + 10;

    this.clockTimeout = setTimeout(() => {
      this.ngZone.run(() => {
        this.updateDateTime();
        this.changeDetector.detectChanges();
        this.scheduleNextClockTick();
      });
    }, delay);
  }

  private applyStoredRegionalSettings(): void {
    this.userTimezone = localStorage.getItem('timezone') || this.userTimezone;
    this.userCountryCode = localStorage.getItem('country') || this.userCountryCode;
    this.userDateFormat = localStorage.getItem('date_format') || this.userDateFormat;
    this.userTimeFormat = (
      localStorage.getItem('time_format') || this.userTimeFormat
    ) as '12h' | '24h';
  }

  private applyRegionalSettings(settings: Partial<UserSettings> | any): void {
    if (!settings) {
      return;
    }

    this.userTimezone = settings.timezone || this.userTimezone;
    this.userCountryCode = settings.country || this.userCountryCode;
    this.userDateFormat = settings.date_format || this.userDateFormat;
    this.userTimeFormat = (settings.time_format || this.userTimeFormat) as
      | '12h'
      | '24h';
  }

  private persistRegionalSettings(settings: Partial<UserSettings>): void {
    if (settings.timezone) {
      localStorage.setItem('timezone', settings.timezone);
    }

    if (settings.country) {
      localStorage.setItem('country', settings.country);
    }

    if (settings.date_format) {
      localStorage.setItem('date_format', settings.date_format);
    }

    if (settings.time_format) {
      localStorage.setItem('time_format', settings.time_format);
    }
  }

  private refreshTranslations(): void {
    this.text = {
      ...this.text,
      dashboard: this.t('COMMON.DASHBOARD', 'Dashboard'),
      users: this.t('COMMON.USERS', 'Users'),
      settings: this.t('COMMON.SETTINGS', 'Settings'),
      account: this.t('COMMON.ACCOUNT', 'Account'),
      updates: this.t('COMMON.UPDATES', 'Updates'),
      messages: this.t('COMMON.MESSAGES', 'Messages'),
      profile: this.t('COMMON.PROFILE', 'Profile'),
      logout: this.t('COMMON.LOGOUT', 'Logout'),
      home: this.t('COMMON.HOME', 'Home'),
      light: this.t('COMMON.LIGHT', 'Light'),
      dark: this.t('COMMON.DARK', 'Dark'),
      auto: this.t('COMMON.AUTO', 'Auto'),
      toggleSidebar: this.t(
        'COMMON.TOGGLE_SIDEBAR',
        'Toggle sidebar navigation'
      ),
      openUserMenu: this.t('COMMON.OPEN_USER_MENU', 'Open user menu'),
      openThemePicker: this.t(
        'COMMON.OPEN_THEME_PICKER',
        'Open theme picker'
      ),
      manufacturing: this.t('COMMON.MANUFACTURING', 'Manufacturing'),
      warehousing: this.t('COMMON.WAREHOUSING', 'Warehousing'),
      nonConformance: this.t('COMMON.NON_CONFORMANCE', 'Non-conformance'),
    };
  }

  private t(key: string, fallback: string): string {
    const translated = this.languageService.instant(key);

    return translated && translated !== key ? translated : fallback;
  }

  private updateCurrentPageLabel(): void {
    const currentUrl = this.router.url.split('?')[0].split('#')[0];
    const labels: Record<string, string> = {
      '/dashboard': this.text.dashboard,
      '/admin_dashboard': this.text.dashboard,
      '/supervisor_dashboard': this.text.dashboard,
      '/quality_dashboard': this.text.dashboard,
      '/settings': this.text.settings,
      '/edit_profile': this.text.profile,
    };

    this.currentPageLabel = labels[currentUrl] || this.text.dashboard;
  }

  private getCurrentLocale(): string {
    const language = this.languageService.currentLanguage || 'en';
    const locales: Record<string, string> = {
      en: 'en-US',
      fr: 'fr-FR',
      de: 'de-DE',
      nl: 'nl-NL',
    };

    return locales[language] || 'en-US';
  }

  private getStoredUser(): any {
    return getAuthUser();
  }
}
