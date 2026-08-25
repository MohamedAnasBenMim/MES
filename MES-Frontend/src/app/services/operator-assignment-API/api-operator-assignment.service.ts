import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActiveOperationItem } from '../operation-active-get-API/api-operation-active-get.service';

export interface AssignmentPayload {
  operator_id: number;
  operation_id: number;
  assigned_by_id: number;
  assigned_by_username?: string;
  assigned_by_role?: string;
  notes?: string;
}

export interface AssignmentUpdatePayload {
  assigned_by_id: number;
  assigned_by_username?: string;
  assigned_by_role?: string;
  operation_id?: number;
  notes?: string;
  status?: string;
}

export interface AssignmentRemovePayload {
  assigned_by_id: number;
  assigned_by_username?: string;
  assigned_by_role?: string;
  notes?: string;
}

export interface OperatorAssignmentResponse {
  id: number;
  operator_id: number;
  operator_name: string;
  operation_id: number;
  operation: ActiveOperationItem;
  assigned_by_id: number;
  assigned_by_name: string;
  assigned_at: string;
  closed_at?: string | null;
  closed_reason?: string | null;
  notes?: string;
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiOperatorAssignmentService {
  private baseUrl = 'http://localhost:8000/api/operator-assignments/';

  constructor(private http: HttpClient) {}

  createAssignment(payload: AssignmentPayload): Observable<OperatorAssignmentResponse> {
    return this.http.post<OperatorAssignmentResponse>(this.baseUrl, payload);
  }

  updateAssignment(
    assignmentId: number,
    payload: AssignmentUpdatePayload
  ): Observable<OperatorAssignmentResponse> {
    return this.http.put<OperatorAssignmentResponse>(
      `${this.baseUrl}${assignmentId}/`,
      payload
    );
  }

  removeAssignment(
    assignmentId: number,
    payload: AssignmentRemovePayload
  ): Observable<OperatorAssignmentResponse> {
    const params = new HttpParams()
      .set('assigned_by_id', String(payload.assigned_by_id))
      .set('assigned_by_username', payload.assigned_by_username || '')
      .set('assigned_by_role', payload.assigned_by_role || '');

    return this.http.delete<OperatorAssignmentResponse>(
      `${this.baseUrl}${assignmentId}/`,
      {
        body: payload,
        params,
      }
    );
  }

  getAssignmentHistory(operatorId: number): Observable<OperatorAssignmentResponse[]> {
    return this.http.get<OperatorAssignmentResponse[]>(
      `${this.baseUrl}history/?operator_id=${operatorId}`
    );
  }
}
