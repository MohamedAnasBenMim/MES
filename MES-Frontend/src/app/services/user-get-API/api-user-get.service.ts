// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Observable } from 'rxjs';

export interface UserSettings {
  id: number;
  username: string;
  email: string;
  role: string;
  display_name: string;
  job_title: string;
  profile_image: string | null;
  language: string;
  timezone: string;
  country: string;
  date_format: string;
  time_format: '12h' | '24h';
  theme: 'light' | 'dark' | 'system';
}

// @Injectable({
//   providedIn: 'root',
// })
// export class UserApiService {
//   // private backendUrl = '/get_users/';
//   private baseurl = '/';
//   private api = 'api/get_users/';
//   private backendUrl = this.baseurl + this.api;
//   constructor(private http: HttpClient) {}

//   getData(): Observable<any> {
//     return this.http.get<any>(this.backendUrl);
//   }
//   getUserById(id: number): Observable<any> {
//     return this.http.get<any>(
//       `/get_user_data/${id}/`
//     );
//   }

//   postData(data: any): Observable<any> {
//     return this.http.post(
//       '/create_user/',
//       data
//     );
//   }

//   deleteUser(id: number): Observable<any> {
//     return this.http.delete(
//       `/delete_user/${id}/`
//     );
//   }
//   updateUser(id: number, data: any): Observable<any> {
//     return this.http.post(
//       `/update_user/${id}/`,
//       data
//     );
//   }
//   editUser(id: number, data: FormData): Observable<any> {
//     return this.http.post(
//       `/update_user/${id}/`,
//       data
//     );
//   }
//   loginUser(data: any): Observable<any> {
//     return this.http.post('/login/', data);
//   }
// }
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  private baseurl = '/api/';

  constructor(private http: HttpClient) {}

  heartbeatSession(data: any): Observable<any> {
    return this.http.post(`${this.baseurl}user-session/heartbeat/`, data);
  }

  logoutSession(data: any): Observable<any> {
    return this.http.post(`${this.baseurl}user-session/logout/`, data);
  }

  getUserSessionActivity(): Observable<any> {
    return this.http.get<any>(`${this.baseurl}user-session/activity/`);
  }

  getData(): Observable<any> {
    return this.http.get<any>(`${this.baseurl}get_users/`);
  }

  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseurl}get_user_data/${id}/`);
  }

  postData(data: any): Observable<any> {
    return this.http.post(`${this.baseurl}create_user/`, data);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseurl}delete_user/${id}/`);
  }

  updateUser(id: number, data: any): Observable<any> {
    return this.http.post(`${this.baseurl}update_user/${id}/`, data);
  }

  editUser(id: number, data: FormData): Observable<any> {
    return this.http.post(`${this.baseurl}update_user/${id}/`, data);
  }

  loginUser(data: any): Observable<any> {
    return this.http.post(`${this.baseurl}login/`, data);
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.baseurl}dashboard-stats/`);
  }

  toggleUserStatus(id: number): Observable<any> {
    return this.http.post(`${this.baseurl}toggle_user_status/${id}/`, {});
  }
  getUserSettings(sessionId: string): Observable<UserSettings> {
    return this.http.get<UserSettings>(`${this.baseurl}user/settings/`, {
      params: { session_id: sessionId },
    });
  }

  updateUserSettings(
    formData: FormData,
  ): Observable<UserSettings & { success: boolean }> {
    return this.http.put<UserSettings & { success: boolean }>(
      `${this.baseurl}user/settings/`,
      formData,
    );
  }
}
