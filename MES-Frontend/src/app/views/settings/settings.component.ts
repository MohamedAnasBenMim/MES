import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { LanguageService, SupportedLanguage } from '../../services/language/language.service';
import { UserApiService, UserSettings } from '../../services/user-get-API/api-user-get.service';
import {
  getAuthItem,
  getAuthUser,
  updateAuthUser,
} from '../../utils/auth-storage';

type ThemePreference = 'light' | 'dark';
type TimeFormat = '12h' | '24h';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);

  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  fieldErrors: Record<string, string> = {};

  form = {
    language: 'en' as SupportedLanguage,
    timezone: 'Africa/Tunis',
    country: 'TN',
    date_format: 'dd/MM/yyyy',
    time_format: '24h' as TimeFormat,
    theme: 'light' as ThemePreference,
  };

  readonly languages = [
    { code: 'en' as SupportedLanguage, key: 'LANGUAGES.ENGLISH' },
  ];

  readonly timezones = [
    'Africa/Tunis', 'Europe/Paris', 'Europe/Berlin', 'Europe/Amsterdam',
    'Europe/London', 'America/New_York', 'America/Chicago',
    'America/Los_Angeles', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Tokyo',
  ];

  readonly countries = [
    { code: 'TN', label: 'Tunisia' }, { code: 'FR', label: 'France' },
    { code: 'DE', label: 'Germany' }, { code: 'NL', label: 'Netherlands' },
    { code: 'GB', label: 'United Kingdom' }, { code: 'US', label: 'United States' },
    { code: 'IT', label: 'Italy' }, { code: 'ES', label: 'Spain' },
    { code: 'AE', label: 'United Arab Emirates' }, { code: 'SA', label: 'Saudi Arabia' },
  ];

  constructor(
    public readonly languageService: LanguageService,
    private readonly userApi: UserApiService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const sessionId = getAuthItem('session_id');
    if (!sessionId) {
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    this.languageService.currentLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.changeDetector.detectChanges());

    this.userApi.getUserSettings(sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: settings => {
          this.applyResponse(settings);
          this.isLoading = false;
        },
        error: error => {
          console.error('Settings loading failed:', error);
          this.errorMessage = this.t('SETTINGS_PAGE.LOAD_ERROR');
          this.isLoading = false;
        },
      });
  }

  t(key: string): string {
    return this.languageService.instant(key);
  }

  languageLabel(key: string): string {
    return this.t(key);
  }

  previewLanguage(): void {
    this.clearMessages();
    this.languageService.applyLanguage(this.form.language);
  }

  previewTheme(): void {
    this.clearMessages();
    this.applyTheme(this.form.theme);
  }

  save(): void {
    if (this.isSaving || !this.validate()) return;
    const sessionId = getAuthItem('session_id');
    if (!sessionId) return;

    const data = new FormData();
    data.append('session_id', sessionId);
    data.append('language', this.form.language);
    data.append('timezone', this.form.timezone);
    data.append('country', this.form.country);
    data.append('date_format', this.form.date_format);
    data.append('time_format', this.form.time_format);
    data.append('theme', this.form.theme);

    this.isSaving = true;
    this.clearMessages();
    this.userApi.updateUserSettings(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
  const savedSettings:
    UserSettings = {
    ...response,

    country:
      response.country
      || this.form.country,

    timezone:
      response.timezone
      || this.form.timezone,

    language:
      response.language
      || this.form.language,

    date_format:
      response.date_format
      || this.form.date_format,

    time_format:
      response.time_format
      || this.form.time_format,

    theme:
      this.normalizeTheme(
        response.theme
        || this.form.theme
      ),
  };

  this.applyResponse(
    savedSettings
  );

  this.languageService
    .applyLanguage(
      savedSettings.language
    );

  this.applyTheme(
    this.normalizeTheme(
      savedSettings.theme
    )
  );

  this.updateStoredUser(
    savedSettings
  );

  localStorage.setItem(
    'country',
    savedSettings.country
  );

  localStorage.setItem(
    'timezone',
    savedSettings.timezone
  );

  localStorage.setItem(
    'date_format',
    savedSettings.date_format
  );

  localStorage.setItem(
    'time_format',
    savedSettings.time_format
  );

  window.dispatchEvent(
    new CustomEvent(
      'mes-user-settings-updated',
      {
        detail:
          savedSettings,
      }
    )
  );

  this.successMessage =
    this.t(
      'SETTINGS_PAGE.SAVE_SUCCESS'
    );

  this.isSaving = false;
},
        error: error => {
          this.fieldErrors = error?.error?.errors || {};
          this.errorMessage = this.t('SETTINGS_PAGE.SAVE_ERROR');
          this.isSaving = false;
        },
      });
  }

  private validate(): boolean {
    this.fieldErrors = {};
    return Object.keys(this.fieldErrors).length === 0;
  }

private applyResponse(
  settings: UserSettings
): void {
  this.form = {
    language:
      this.languageService
        .normalize(
          settings.language
        ),

    timezone:
      settings.timezone
      || 'Africa/Tunis',

    country:
      settings.country
      || 'TN',

    date_format:
      settings.date_format
      || 'dd/MM/yyyy',

    time_format:
      settings.time_format
      || '24h',

    theme:
      this.normalizeTheme(
        settings.theme
      ),
  };

  this.applyTheme(
    this.form.theme
  );

  localStorage.setItem(
    'country',
    this.form.country
  );

  localStorage.setItem(
    'timezone',
    this.form.timezone
  );

  localStorage.setItem(
    'date_format',
    this.form.date_format
  );

  localStorage.setItem(
    'time_format',
    this.form.time_format
  );
}

  private normalizeTheme(
    theme: string | null | undefined
  ): ThemePreference {
    return theme === 'dark' ? 'dark' : 'light';
  }

  private applyTheme(theme: ThemePreference): void {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-coreui-theme', theme);
  }

private updateStoredUser(
  settings: UserSettings
): void {
  const user: any =
    getAuthUser();

  Object.assign(
    user,
    {
      id:
        settings.id,

      username:
        settings.username,

      email:
        settings.email,

      role:
        settings.role,

      display_name:
        settings.display_name,

      job_title:
        settings.job_title,

      profile_image:
        settings.profile_image,

      language:
        settings.language,

      timezone:
        settings.timezone,

      country:
        settings.country,

      date_format:
        settings.date_format,

      time_format:
        settings.time_format,

      theme:
        settings.theme,
    }
  );

  updateAuthUser(user);

  localStorage.setItem(
    'country',
    settings.country
  );

  localStorage.setItem(
    'timezone',
    settings.timezone
  );

  localStorage.setItem(
    'date_format',
    settings.date_format
  );

  localStorage.setItem(
    'time_format',
    settings.time_format
  );
}

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.fieldErrors = {};
  }
}
