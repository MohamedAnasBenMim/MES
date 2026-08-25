import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiGetRelatedNC {
  // private backendUrl = 'http://localhost:8000/get_related_nc_data/'; // Renamed URL
  private baseurl = 'http://localhost:8000/';
  private api = 'api/get_related_nc_data/';
  private backendUrl = this.baseurl + this.api;

  constructor(private http: HttpClient) {}

  getData(order_id: string, operation: number): Observable<any> {
    const params = new HttpParams()
      .set('order_id', order_id)
      .set('operation', operation.toString());

    return this.http.get<any>(this.backendUrl, { params });
  }
}
