import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  assigned?: boolean;
  assignment_id?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class ApiOperationActiveGetService {
  private baseUrl = 'http://localhost:8000/api/operations/active/';

  constructor(private http: HttpClient) {}

  getActiveOperations(): Observable<ActiveOperationItem[]> {
    return this.http.get<ActiveOperationItem[]>(this.baseUrl);
  }
}
