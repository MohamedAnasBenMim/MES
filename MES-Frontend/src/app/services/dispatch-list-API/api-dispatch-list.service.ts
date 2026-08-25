import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseurl = 'http://localhost:8000/';
  private api = 'api/dispatch-data/';
  private backendUrl = this.baseurl + this.api;

  constructor(private http: HttpClient) {}

  getData(username: string): Observable<any[]> {
    return this.http
      .get<any>(this.backendUrl, {
        params: { username: username },
      })
      .pipe(
        tap((res) => console.log('✅ Dispatch response:', res)),

        // Backend now returns:
        // { source: "cache" | "infor", count: number, data: [...] }
        // So we return only res.data to the component
        map((res) => res.data || [])
      );
  }

  getDataWithRefresh(username: string): Observable<any[]> {
    return this.http
      .get<any>(this.backendUrl, {
        params: {
          username: username,
          refresh: 'true',
        },
      })
      .pipe(
        tap((res) => console.log('🔄 Dispatch refreshed:', res)),
        map((res) => res.data || [])
      );
  }
}