import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, catchError } from 'rxjs';

export interface CountryCode {
  country: string;
  code: string;
  flag: string;
  cca2: string;
}

@Injectable({
  providedIn: 'root',
})
export class CountryCodeService {
  private apiUrl =
    'https://countries.dev/countries?fields=name,alpha2Code,flag,callingCodes&sort=name';

  private cacheKey = 'country_codes_cache_countries_dev';
  private cacheDateKey = 'country_codes_cache_countries_dev_date';

  constructor(private http: HttpClient) {}

  getCountryCodes(): Observable<CountryCode[]> {
    const cachedData = localStorage.getItem(this.cacheKey);
    const cachedDate = localStorage.getItem(this.cacheDateKey);

    if (cachedData && cachedDate) {
      const cacheAge = Date.now() - Number(cachedDate);
      const oneDay = 24 * 60 * 60 * 1000;

      if (cacheAge < oneDay) {
        return of(JSON.parse(cachedData));
      }
    }

    return this.http.get<any[]>(this.apiUrl).pipe(
      map((countries: any[]) => {
        const result: CountryCode[] = [];

        countries.forEach((country: any) => {
          const countryName = country.name || '';
          const cca2 = country.alpha2Code || '';
          const flag = country.flag || '';
          const callingCodes = country.callingCodes || [];

          callingCodes.forEach((callingCode: string) => {
            if (!callingCode) {
              return;
            }

            const cleanCode = callingCode.replace(/[^\d]/g, '');

            if (!cleanCode) {
              return;
            }

            result.push({
              country: countryName,
              code: `+${cleanCode}`,
              flag: flag,
              cca2: cca2,
            });
          });
        });

        const uniqueResult = result.filter(
          (item, index, self) =>
            index ===
            self.findIndex(
              (country) =>
                country.country === item.country && country.code === item.code,
            ),
        );

        uniqueResult.sort((a, b) => a.country.localeCompare(b.country));

        localStorage.setItem(this.cacheKey, JSON.stringify(uniqueResult));
        localStorage.setItem(this.cacheDateKey, String(Date.now()));

        return uniqueResult;
      }),
      catchError((error) => {
        console.error(
          '❌ Failed to load country codes from countries.dev:',
          error,
        );

        return of([
          { country: 'Tunisia', code: '+216', flag: '🇹🇳', cca2: 'TN' },
          { country: 'France', code: '+33', flag: '🇫🇷', cca2: 'FR' },
          { country: 'Belgium', code: '+32', flag: '🇧🇪', cca2: 'BE' },
          { country: 'Netherlands', code: '+31', flag: '🇳🇱', cca2: 'NL' },
          { country: 'Germany', code: '+49', flag: '🇩🇪', cca2: 'DE' },
        ]);
      }),
    );
  }
}
