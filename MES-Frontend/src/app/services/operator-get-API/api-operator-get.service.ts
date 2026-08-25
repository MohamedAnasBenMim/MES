import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OperatorItem {
  id: number;
  row_id?: string;
  username: string;
  email: string;
  role: string;
  status: string;
  active_operation_count?: number;
  current_operation?: ActiveOperationItem | null;
  current_assignment?: OperatorAssignmentItem | null;
}

export interface OperatorAssignmentItem {
  id: number;
  operator_id: number;
  operator_name: string;
  operation_id: number;
  assigned_by_id: number;
  assigned_by_name: string;
  assigned_at: string;
  closed_at?: string | null;
  closed_reason?: string | null;
  notes?: string;
  status: string;
}

export interface ActiveOperationItem {
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
}

@Injectable({
  providedIn: 'root',
})
export class ApiOperatorGetService {
  private baseUrl = 'http://localhost:8000/api/operators/';

  constructor(private http: HttpClient) {}

  getOperators(): Observable<OperatorItem[]> {
    return this.http.get<OperatorItem[]>(this.baseUrl);
  }
}
