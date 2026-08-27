import { Injectable } from '@angular/core';

import { HttpClient, HttpParams } from '@angular/common/http';

import { Observable } from 'rxjs';

export interface OperatorDashboardOperation {
  id: number;
  order: string;
  operation: string;
  item: string;
  machine_type: string;
  routing_quantity: number;
  planned_start_date: string;
  work_center: string;
  status: string;
  company_id: string;
}

export interface ChampionOperator {
  rank: number;
  username: string;
  display_name: string;
  role: string;
  points: number;
  completed_operations: number;
  quality_score: number;
  avatar: string;
}

export interface OperatorDashboardResponse {
  operator: {
    username: string;
    role: string;
    language: string;
    profile_image: string;
  };

  statistics: {
    active_operations: number;
    completed_this_week: number;
    delivered_quantity: number;
    rejected_quantity: number;
    quality_score: number;
    points: number;
  };

  daily_productivity: Array<{
    day: string;
    count: number;
  }>;

  active_operations: OperatorDashboardOperation[];

  champions: ChampionOperator[];

  recent_issues: Array<{
    order: string;
    operation: string;
    rejected_quantity: number;
    date: string;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class OperatorDashboardService {
  private readonly url = 'http://localhost:8000/api/operator-dashboard/';

  constructor(private readonly http: HttpClient) {}

  getDashboard(username: string): Observable<OperatorDashboardResponse> {
    const params = new HttpParams().set('username', username);

    return this.http.get<OperatorDashboardResponse>(this.url, {
      params,
    });
  }
}
