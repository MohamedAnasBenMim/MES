import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // private backendUrl = 'http://localhost:8000/nc-data/';
  private baseurl = 'http://localhost:8000/';
  private api = 'api/nc-data/';
  private backendUrl = this.baseurl + this.api;

  constructor(private http: HttpClient) {}

  fetchAllNcReports(): Observable<any[]> {
    return this.http
      .get<any[]>(this.backendUrl)
      .pipe(tap((res) => console.log('✅ Fetched NC reports:', res)));
  }

  // Optional: kept for comparison/testing if needed
  getData(): Observable<any> {
    return this.http.get<any>(this.backendUrl);
  }
}
