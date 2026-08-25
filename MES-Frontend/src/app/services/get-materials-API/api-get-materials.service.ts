import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiGetMaterials {
  // private backendUrl = 'http://localhost:8000/get_materials/'; // Renamed URL
  private baseurl = 'http://localhost:8000/';
  private api = 'api/get_materials/';
  private backendUrl = this.baseurl + this.api;

  constructor(private http: HttpClient) {}

  // getData(): Observable<any> {
  //   return this.http.get<any>(this.backendUrl);
  // }
  getData(order_id: string, operation: number): Observable<any> {
    const params = new HttpParams()
      .set('order_id', order_id)
      .set('operation', operation.toString());

    return this.http.get<any>(this.backendUrl, { params });
  }
  // postData(data: any): Observable<any> {
  //   return this.http.post(this.backendUrl, data); // not '/api/post_nc/'
  // }
}
