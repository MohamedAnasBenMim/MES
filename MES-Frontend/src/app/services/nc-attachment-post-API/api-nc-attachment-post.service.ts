import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AttachmentApiService {
  // private backendUrl = 'http://localhost:8000/post_nc_attachment/'; // Renamed URL
  private baseurl = 'http://localhost:8000/';
  private api = 'api/post_nc_attachment/';
  private backendUrl = this.baseurl + this.api;

  constructor(private http: HttpClient) {}

  getData(): Observable<any> {
    return this.http.get<any>(this.backendUrl);
  }

  postData(data: any): Observable<any> {
    return this.http.post(this.backendUrl, data);
  }
}
