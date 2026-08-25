import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiServiceLastOperation {
  // private backendUrl = 'http://localhost:8000/get_operation_data/';
  private baseurl = 'http://localhost:8000/';
  private api = 'api/get_operation_data/';
  private backendUrl = this.baseurl + this.api;
  constructor(private http: HttpClient) {}
  getData(orderId: string, operation: number): Observable<any> {
    const params = new HttpParams()
      .set('order_id', orderId)
      .set('operation', operation.toString());

    return this.http.get<any>(this.backendUrl, { params });
  }
}
