import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConfigApiService {
  private baseurl = 'http://localhost:8000/';
  private api = 'api/create_ionapi_credentials/';
  private backendUrl = this.baseurl + this.api;

  constructor(private http: HttpClient) {}

  getData(): Observable<any> {
    return this.http.get<any>(this.backendUrl);
  }

  postData(data: any): Observable<any> {
    return this.http.post(this.backendUrl, data);
  }
}
