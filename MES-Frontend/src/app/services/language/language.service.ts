import {
  Injectable,
  inject,
} from '@angular/core';

import {
  TranslateService,
} from '@ngx-translate/core';

import {
  BehaviorSubject,
  Observable,
  catchError,
  map,
  of,
  tap,
} from 'rxjs';

import {
  UserApiService,
} from '../user-get-API/api-user-get.service';

export type SupportedLanguage =
  | 'en'
  | 'fr'
  | 'de'
  | 'nl';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly translate =
    inject(TranslateService);

  private readonly userApi =
    inject(UserApiService);

  private readonly supportedLanguages:
    SupportedLanguage[] = [
      'en',
    ];

  private readonly currentLanguageSubject =
    new BehaviorSubject<SupportedLanguage>(
      this.normalize(
        localStorage.getItem('language')
      )
    );

  readonly currentLanguage$ =
    this.currentLanguageSubject.asObservable();

  get currentLanguage():
    SupportedLanguage {
    return this.currentLanguageSubject.value;
  }

  initialize(): void {
    this.translate.addLangs(
      this.supportedLanguages
    );

    this.translate.setFallbackLang(
      'en'
    );

    const storedLanguage =
      this.normalize(
        localStorage.getItem(
          'language'
        )
      );

    this.applyLanguage(
      storedLanguage
    );
  }

  loadLoggedInUserLanguage():
    Observable<SupportedLanguage> {
    const sessionId =
      localStorage.getItem(
        'session_id'
      );

    if (!sessionId) {
      const language =
        this.normalize(
          localStorage.getItem(
            'language'
          )
        );

      this.applyLanguage(
        language
      );

      return of(language);
    }

    return this.userApi
      .getUserSettings(
        sessionId
      )
      .pipe(
        map((response: any) =>
          this.normalize(
            response?.language
          )
        ),

        tap((language) => {
          this.applyLanguage(
            language
          );
        }),

        catchError((error) => {
          console.error(
            'Could not load the user language:',
            error
          );

          const fallback =
            this.normalize(
              localStorage.getItem(
                'language'
              )
            );

          this.applyLanguage(
            fallback
          );

          return of(fallback);
        })
      );
  }

  saveLanguage(
    language: string
  ): Observable<SupportedLanguage> {
    const normalized =
      this.normalize(language);

    const sessionId =
      localStorage.getItem(
        'session_id'
      );

    /*
     * Apply the selected language
     * immediately before saving.
     */
    this.applyLanguage(
      normalized
    );

    if (!sessionId) {
      return of(normalized);
    }

    const formData =
      new FormData();

    formData.append(
      'session_id',
      sessionId
    );

    formData.append(
      'language',
      normalized
    );

    return this.userApi
      .updateUserSettings(
        formData
      )
      .pipe(
        map((response: any) =>
          this.normalize(
            response?.language ||
            normalized
          )
        ),

        tap((savedLanguage) => {
          this.applyLanguage(
            savedLanguage
          );
        })
      );
  }

  applyLanguage(
    language: string
  ): void {
    const normalized =
      this.normalize(language);

    localStorage.setItem(
      'language',
      normalized
    );

    document.documentElement.lang =
      normalized;

    this.translate
      .use(normalized)
      .subscribe({
        next: () => {
          /*
           * Components are notified only
           * after the translation JSON file
           * has finished loading.
           */
          this.currentLanguageSubject.next(
            normalized
          );

          this.updateStoredUserLanguage(
            normalized
          );
        },

        error: (
          error: unknown
        ) => {
          console.error(
            `Unable to load ${normalized}.json:`,
            error
          );

          if (normalized === 'en') {
            this.currentLanguageSubject.next(
              'en'
            );

            return;
          }

          this.translate
            .use('en')
            .subscribe({
              next: () => {
                localStorage.setItem(
                  'language',
                  'en'
                );

                document.documentElement.lang =
                  'en';

                this.currentLanguageSubject.next(
                  'en'
                );

                this.updateStoredUserLanguage(
                  'en'
                );
              },
            });
        },
      });
  }

  instant(
    key: string
  ): string {
    const translated =
      this.translate.instant(
        key
      );

    return translated || key;
  }

  normalize(
    language:
      | string
      | null
      | undefined
  ): SupportedLanguage {
    return 'en';
  }

  private updateStoredUserLanguage(
    language: SupportedLanguage
  ): void {
    const storedUser =
      localStorage.getItem(
        'user'
      );

    if (!storedUser) {
      return;
    }

    try {
      const user =
        JSON.parse(storedUser);

      user.language =
        language;

      user.preferred_language =
        language;

      localStorage.setItem(
        'user',
        JSON.stringify(user)
      );
    } catch {
      console.warn(
        'Invalid user data in localStorage.'
      );
    }
  }
}
