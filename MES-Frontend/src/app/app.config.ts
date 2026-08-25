import {
  APP_INITIALIZER,
  ApplicationConfig,
  importProvidersFrom,
} from '@angular/core';

import {
  provideRouter,
  withHashLocation,
} from '@angular/router';

import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

import {
  provideAnimations,
} from '@angular/platform-browser/animations';

import {
  provideTranslateService,
} from '@ngx-translate/core';

import {
  provideTranslateHttpLoader,
} from '@ngx-translate/http-loader';

import {
  SidebarModule,
} from '@coreui/angular';

import {
  routes,
} from './app.routes';

import {
  LanguageService,
} from './services/language/language.service';

function initializeLanguage(
  languageService: LanguageService
): () => void {
  return () => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    const resolvedTheme = savedTheme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : savedTheme;
    document.documentElement.setAttribute('data-coreui-theme', resolvedTheme);
    languageService.initialize();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withHashLocation()
    ),

    provideHttpClient(
      withInterceptorsFromDi()
    ),

    provideAnimations(),

    /*
     * Required by CoreUI Angular 5.4.x.
     * It provides SidebarNavHelper and fixes:
     * "No provider for _SidebarNavHelper"
     */
    importProvidersFrom(
      SidebarModule
    ),

    /*
     * Keep only one ngx-translate provider
     * in the complete application.
     */
    provideTranslateService({
      fallbackLang: 'en',
      lang: 'en',

      loader:
        provideTranslateHttpLoader({
          prefix:
            './assets/i18n/',

          suffix:
            '.json',
        }),
    }),

    {
      provide:
        APP_INITIALIZER,

      useFactory:
        initializeLanguage,

      deps: [
        LanguageService,
      ],

      multi: true,
    },
  ],
};
