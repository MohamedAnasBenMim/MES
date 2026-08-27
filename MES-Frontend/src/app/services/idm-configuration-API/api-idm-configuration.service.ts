import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IdmConfiguration {
  id: number;
  document: string;
  document_type: string;
  entity_type: string;
  entity_type_value: string;
  accounting_entity: string;
  accounting_entity_value: string;
  location: string;
  location_value: string;
  invoice_number: string;
  transaction_type: string;
  financial_company: string;
  created_by?: string;
  created_date?: string;
  modified_by?: string;
  modified_date?: string;
}

export interface IdmConfigurationPayload {
  username: string;
  document: string;
  document_type: string;
  entity_type: string;
  entity_type_value: string;
  accounting_entity: string;
  accounting_entity_value: string;
  location?: string;
  location_value?: string;
  invoice_number: string;
  transaction_type?: string;
  financial_company: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiIdmConfigurationService {
  private baseUrl = 'http://localhost:8000/api/idm-configurations/';

  constructor(private http: HttpClient) {}

  getConfigurations(username: string): Observable<IdmConfiguration[]> {
    const params = new HttpParams().set('username', username);

    return this.http.get<IdmConfiguration[]>(this.baseUrl, { params });
  }

  createConfiguration(payload: IdmConfigurationPayload): Observable<any> {
    return this.http.post(this.baseUrl, payload);
  }

  updateConfiguration(
    id: number,
    payload: IdmConfigurationPayload,
  ): Observable<any> {
    return this.http.put(`${this.baseUrl}${id}/`, payload);
  }

  deleteConfiguration(id: number, username: string): Observable<any> {
    const params = new HttpParams().set('username', username);

    return this.http.delete(`${this.baseUrl}${id}/`, { params });
  }
}
