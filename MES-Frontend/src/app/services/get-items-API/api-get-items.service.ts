import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ApiGetItems {
  // private backendUrl = 'http://localhost:8000/get_items/'; // Renamed URL
  private baseurl = 'http://localhost:8000/';
  private api = 'api/get_items/';
  private backendUrl = this.baseurl + this.api;

  constructor(private http: HttpClient) {}

  getData(): Observable<any[]> {
    return this.http.get<any>(this.backendUrl).pipe(
      map((res) => {
        if (Array.isArray(res)) {
          return res;
        }

        return res?.value || res?.data || [];
      })
    );
  }
}
