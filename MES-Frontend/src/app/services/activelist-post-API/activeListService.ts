import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class activeListService {
  private baseurl = 'http://localhost:8000/';
  private api = 'api/post_operation_active_list/';
  private backendUrl = this.baseurl + this.api;

  constructor(private http: HttpClient) {}

  addToActiveList(data: any): Observable<any> {
    return this.http.post(this.backendUrl, data);
  }
}
