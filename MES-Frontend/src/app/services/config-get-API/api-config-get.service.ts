import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface IonAPICredential {
  id: number;
  ti: string;
  cn: string;
  dt: string;
  ci: string;
  cs: string;
  iu: string;
  pu: string;
  oa: string;
  ot: string;
  or: string; // was 'or_field' in backend, but can be mapped to 'or'
  saak: string;
  sask: string;
  sc: string;
  ev: string;
  v: string;
  company: string; // make sure casing matches your backend
  filename: string; // make sure casing matches your backend
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class IonapiService {
  // private apiUrl = 'http://localhost:8000/get_ionapi_credential/'; // Adjust base URL as needed
  private baseurl = 'http://localhost:8000/';
  private api = 'api/get_ionapi_credential/';
  private backendUrl = this.baseurl + this.api;
  constructor(private http: HttpClient) {}

  getIonapiCredentials(): Observable<IonAPICredential> {
    return this.http.get<IonAPICredential>(this.backendUrl);
  }
}
