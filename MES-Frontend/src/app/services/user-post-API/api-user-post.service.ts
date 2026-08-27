import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PasswordChangeCodeRequest {
  username: string;
  email?: string;
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface PasswordChangeCodeResponse {
  message: string;
  verification_id: number;
  email: string;
  masked_email: string;
  expires_in_minutes: number;
}

export interface PasswordChangeVerificationRequest {
  verification_id: number;
  code: string;
}

@Injectable({
  providedIn: 'root',
})
export class CreateUserApiService {
  private readonly baseurl = 'http://localhost:8000/api/';

  constructor(private readonly http: HttpClient) {}

  getData(): Observable<any> {
    return this.http.get<any>(`${this.baseurl}create_user/`);
  }

  postData(data: any): Observable<any> {
    return this.http.post(`${this.baseurl}create_user/`, data);
  }

  sendUserVerificationCode(data: any): Observable<any> {
    return this.http.post(`${this.baseurl}send-user-verification-code/`, data);
  }

  verifyUserAndCreate(data: any): Observable<any> {
    return this.http.post(`${this.baseurl}verify-user-and-create/`, data);
  }

  editUser(id: number, data: FormData): Observable<any> {
    return this.http.put(`${this.baseurl}update_user/${id}/`, data);
  }

  forgetPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseurl}forget-password/`, {
      email: email.trim(),
    });
  }

  loginUser(credentials: any): Observable<any> {
    return this.http.post(`${this.baseurl}login/`, credentials);
  }

  requestProfilePasswordChangeCode(
    data: PasswordChangeCodeRequest,
  ): Observable<PasswordChangeCodeResponse> {
    return this.http.post<PasswordChangeCodeResponse>(
      `${this.baseurl}profile-password/request-code/`,
      data,
    );
  }

  verifyProfilePasswordChangeCode(
    data: PasswordChangeVerificationRequest,
  ): Observable<any> {
    return this.http.post(`${this.baseurl}profile-password/verify-code/`, data);
  }
}
