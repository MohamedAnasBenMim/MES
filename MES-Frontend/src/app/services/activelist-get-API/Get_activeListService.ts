import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ActiveOperation {
  id: number;
  Order: string;
  Operation: string;
  OperatedItem?: string;
  ReferenceOperationMachineType?: string;
  RoutingQuantity?: number;
  PlannedStartDate?: string;
  PlannedFinishDate?: string;
  ReferenceOperationWorkCenter?: string;
  OperationStatus?: string;
  companyId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GetActiveListService {
  private baseurl = 'http://localhost:8000/';
  private api = 'api/get_operation_active_list/';
  private backendUrl = this.baseurl + this.api;

  constructor(private http: HttpClient) {}

  getActiveList(username: string): Observable<ActiveOperation[]> {
    return this.http.get<ActiveOperation[]>(
      `${this.backendUrl}?username=${username}`
    );
  }
}
