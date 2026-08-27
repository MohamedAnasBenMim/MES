import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Warehouse {
  Warehouse: string | null;
  Description: string | null;
  WarehouseType: string | null;
  MESControlled: boolean | string | null;
  WMSControlled: boolean | string | null;
  InventoryManagement: boolean | string | null;
}

export interface WarehousesResponse {
  value: Warehouse[];
  count: number;
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_previous: boolean;
  has_next: boolean;
  search: string;
}

export interface WarehouseRequest {
  search?: string;
  warehouseType?: string;
  mesControlled?: string;
  wmsControlled?: string;
  inventoryManagement?: string;
  page: number;
  pageSize: number;
}

export interface WarehouseFilterOptionsResponse {
  warehouse_types: string[];
}

@Injectable({
  providedIn: 'root',
})
export class WarehousesApiService {
  private readonly backendUrl = 'http://localhost:8000/api/get_warehouses/';

  private readonly filterOptionsUrl =
    'http://localhost:8000/api/get_warehouse_filter_options/';

  constructor(private readonly http: HttpClient) {}

  getWarehouses(request: WarehouseRequest): Observable<WarehousesResponse> {
    let params = new HttpParams()
      .set('page', String(request.page))
      .set('page_size', String(request.pageSize));

    const search = request.search?.trim();
    const warehouseType = request.warehouseType?.trim();
    const mesControlled = request.mesControlled?.trim();
    const wmsControlled = request.wmsControlled?.trim();
    const inventoryManagement = request.inventoryManagement?.trim();

    if (search) {
      params = params.set('search', search);
    }

    if (warehouseType) {
      params = params.set('warehouse_type', warehouseType);
    }

    if (mesControlled) {
      params = params.set('mes_controlled', mesControlled);
    }

    if (wmsControlled) {
      params = params.set('wms_controlled', wmsControlled);
    }

    if (inventoryManagement) {
      params = params.set('inventory_management', inventoryManagement);
    }

    return this.http.get<WarehousesResponse>(this.backendUrl, { params });
  }

  getWarehouseFilterOptions(): Observable<WarehouseFilterOptionsResponse> {
    return this.http.get<WarehouseFilterOptionsResponse>(this.filterOptionsUrl);
  }
}
