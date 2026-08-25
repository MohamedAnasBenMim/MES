import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiInitiateMaterials {
  // private backendUrl =
  //   'http://localhost:8000/post_initiate_materials/'; // Renamed URL

  private baseurl = 'http://localhost:8000/';
  private api = 'api/post_initiate_materials/';
  private backendUrl = this.baseurl + this.api;

  constructor(private http: HttpClient) {}

  getData(): Observable<any> {
    return this.http.get<any>(this.backendUrl);
  }

  postData(data: any): Observable<any> {
    return this.http.post(this.backendUrl, data); // not '/api/post_nc/'
  }
}
// # order_number = 'J60000010'
// # Position = 10
