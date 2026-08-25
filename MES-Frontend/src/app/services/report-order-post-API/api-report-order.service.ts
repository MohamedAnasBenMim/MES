import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // private backendUrl = 'http://localhost:8000/completeorder/';
  private baseurl = 'http://localhost:8000/';
  private api = 'api/completeorder/';
  private backendUrl = this.baseurl + this.api;

  constructor(private http: HttpClient) {}

  getData(): Observable<any> {
    return this.http.get<any>(this.backendUrl);
  }

  postData(data: any): Observable<any> {
    const orderId = data.order_id;
    return this.http.post(this.backendUrl, data);
  }
}
