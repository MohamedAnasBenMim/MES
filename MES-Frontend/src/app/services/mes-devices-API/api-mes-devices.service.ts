import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type MesDeviceStatus = 'active' | 'disabled';

export interface MesDevice {
  id: number;
  device_id: string;
  device_name: string;
  device_type: string;
  mac_address: string;
  ip_address: string | null;
  status: MesDeviceStatus;
  last_login: string | null;
  last_seen: string | null;
  disabled_date: string | null;
  disabled_by: string;
  disable_reason: string;
  created_date: string;
  created_by: string;
  last_updated_date: string;
  last_updated_by: string;
}

export interface MesDevicePayload {
  username: string;
  device_id?: string;
  device_name: string;
  device_type: string;
  mac_address: string;
  ip_address?: string;
}

export interface MesDeviceDisablePayload {
  username: string;
  disable_reason: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiMesDevicesService {
  private baseUrl = 'http://localhost:8000/api/mes-devices/';

  constructor(private http: HttpClient) {}

  getDevices(
    username: string,
    search: string = '',
    status: string = '',
  ): Observable<MesDevice[]> {
    let params = new HttpParams().set('username', username);

    if (search) {
      params = params.set('search', search);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<MesDevice[]>(this.baseUrl, { params });
  }

  getDevice(id: number, username: string): Observable<MesDevice> {
    const params = new HttpParams().set('username', username);

    return this.http.get<MesDevice>(`${this.baseUrl}${id}/`, { params });
  }

  createDevice(payload: MesDevicePayload): Observable<any> {
    return this.http.post(this.baseUrl, payload);
  }

  updateDevice(id: number, payload: MesDevicePayload): Observable<any> {
    return this.http.put(`${this.baseUrl}${id}/`, payload);
  }

  disableDevice(id: number, payload: MesDeviceDisablePayload): Observable<any> {
    return this.http.post(`${this.baseUrl}${id}/disable/`, payload);
  }

  enableDevice(id: number, username: string): Observable<any> {
    return this.http.post(`${this.baseUrl}${id}/enable/`, { username });
  }

  updateLastSeen(deviceId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}last-seen/`, {
      device_id: deviceId,
    });
  }
}
