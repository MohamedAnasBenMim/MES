import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // private backendUrl = '/get_inventory/'; // Renamed URL
  private baseurl = '/';
  private api = 'api/get_inventory/';
  private backendUrl = this.baseurl + this.api;

  constructor(private http: HttpClient) {}

  getData(): Observable<any> {
    // return this.http.get<any>(this.backendUrl, data);
    return this.http.get<any>(this.backendUrl);
  }
}
