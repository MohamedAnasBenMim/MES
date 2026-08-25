import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // private backendUrl = 'http://localhost:8000/post_nc/'; // Renamed URL
  private baseurl = 'http://localhost:8000/';
  private api = 'api/post_nc/';
  private backendUrl = this.baseurl + this.api;

  constructor(private http: HttpClient) {}

  getData(): Observable<any> {
    return this.http.get<any>(this.backendUrl);
  }

  postData(data: any): Observable<any> {
    // return this.http.post('/api/post_nc/', data);
    // return this.http.post('http://localhost:8000/post_nc/', data); // not '/api/post_nc/'
    return this.http.post(this.backendUrl, data); // ✅ Use merged URL
  }
}
