import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TableDirective } from '@coreui/angular';

import {
  Warehouse,
  WarehousesApiService,
} from '../../../services/warehouses-api/warehouses-api.service';

interface WarehouseRow {
  warehouse: string;
  description: string;
  warehouseType: string;
  mesControlled: string;
  wmsControlled: string;
  inventoryManagement: string;
}

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [CommonModule, FormsModule, TableDirective],
  templateUrl: './warehouses.component.html',
  styleUrls: ['./warehouses.component.css'],
})
export class WarehousesComponent implements OnInit, OnDestroy {
  displayedWarehouses: WarehouseRow[] = [];

  warehouseTypeOptions: string[] = [];

  searchTerm = '';
  selectedWarehouseType = '';
  selectedMesControlled = '';
  selectedWmsControlled = '';
  selectedInventoryManagement = '';

  itemsPerPage = 10;
  currentPage = 1;

  totalWarehouses = 0;
  totalPages = 1;

  hasPrevious = false;
  hasNext = false;

  isLoading = false;
  isLoadingFilterOptions = false;
  errorMessage = '';

  private searchTimer: any = null;
  private warehouseSubscription: Subscription | null = null;
  private filterOptionsSubscription: Subscription | null = null;

  constructor(private readonly warehousesApiService: WarehousesApiService) {}

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadWarehouses();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.warehouseSubscription?.unsubscribe();
    this.filterOptionsSubscription?.unsubscribe();
  }

  loadFilterOptions(): void {
    this.isLoadingFilterOptions = true;

    this.filterOptionsSubscription?.unsubscribe();

    this.filterOptionsSubscription = this.warehousesApiService
      .getWarehouseFilterOptions()
      .subscribe({
        next: (response) => {
          this.warehouseTypeOptions = Array.isArray(response?.warehouse_types)
            ? response.warehouse_types
            : [];

          this.isLoadingFilterOptions = false;
        },
        error: (error) => {
          console.error('Error loading warehouse filter options:', error);

          this.warehouseTypeOptions = [];
          this.isLoadingFilterOptions = false;
        },
      });
  }

  loadWarehouses(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.warehouseSubscription?.unsubscribe();

    this.warehouseSubscription = this.warehousesApiService
      .getWarehouses({
        search: this.searchTerm,
        warehouseType: this.selectedWarehouseType,
        mesControlled: this.selectedMesControlled,
        wmsControlled: this.selectedWmsControlled,
        inventoryManagement: this.selectedInventoryManagement,
        page: this.currentPage,
        pageSize: Number(this.itemsPerPage),
      })
      .subscribe({
        next: (response) => {
          this.displayedWarehouses = response.value.map((warehouse) =>
            this.mapWarehouseToRow(warehouse),
          );

          this.totalWarehouses = response.total_count;
          this.currentPage = response.page;
          this.itemsPerPage = response.page_size;
          this.totalPages = Math.max(response.total_pages, 1);
          this.hasPrevious = response.has_previous;
          this.hasNext = response.has_next;

          this.isLoading = false;
        },

        error: (error) => {
          console.error('Warehouse loading error:', error);

          this.displayedWarehouses = [];
          this.totalWarehouses = 0;
          this.totalPages = 1;
          this.hasPrevious = false;
          this.hasNext = false;
          this.isLoading = false;

          if (error?.status === 401 || error?.status === 403) {
            this.errorMessage =
              'Authorization error while accessing LN warehouse data.';
            return;
          }

          this.errorMessage =
            error?.error?.error || 'Unable to retrieve warehouse data.';
        },
      });
  }

  onSearchChange(): void {
    this.currentPage = 1;

    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => {
      this.loadWarehouses();
    }, 400);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadWarehouses();
  }

  onItemsPerPageChange(): void {
    this.itemsPerPage = Number(this.itemsPerPage);
    this.currentPage = 1;
    this.loadWarehouses();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadWarehouses();
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedWarehouseType = '';
    this.selectedMesControlled = '';
    this.selectedWmsControlled = '';
    this.selectedInventoryManagement = '';
    this.currentPage = 1;
    this.loadWarehouses();
  }

  refresh(): void {
    this.loadWarehouses();
  }

  previousPage(): void {
    if (this.isLoading || !this.hasPrevious || this.currentPage <= 1) {
      return;
    }

    this.currentPage--;
    this.loadWarehouses();
  }

  nextPage(): void {
    if (
      this.isLoading ||
      !this.hasNext ||
      this.currentPage >= this.totalPages
    ) {
      return;
    }

    this.currentPage++;
    this.loadWarehouses();
  }

  get firstDisplayedIndex(): number {
    if (this.totalWarehouses === 0 || this.displayedWarehouses.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * Number(this.itemsPerPage) + 1;
  }

  get lastDisplayedIndex(): number {
    if (this.displayedWarehouses.length === 0) {
      return 0;
    }

    return Math.min(
      this.firstDisplayedIndex + this.displayedWarehouses.length - 1,
      this.totalWarehouses,
    );
  }

  get hasActiveFilters(): boolean {
    return Boolean(
      this.searchTerm ||
        this.selectedWarehouseType ||
        this.selectedMesControlled ||
        this.selectedWmsControlled ||
        this.selectedInventoryManagement,
    );
  }

  getStatusClass(value: string): string {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === 'yes') {
      return 'status-badge status-yes';
    }

    if (normalizedValue === 'no') {
      return 'status-badge status-no';
    }

    return 'status-badge status-unknown';
  }

  trackByWarehouse(index: number, row: WarehouseRow): string | number {
    return row.warehouse !== '-' ? row.warehouse : index;
  }

  private mapWarehouseToRow(warehouse: Warehouse): WarehouseRow {
    return {
      warehouse: this.displayValue(warehouse.Warehouse),
      description: this.displayValue(warehouse.Description),
      warehouseType: this.displayValue(warehouse.WarehouseType),
      mesControlled: this.displayBoolean(warehouse.MESControlled),
      wmsControlled: this.displayBoolean(warehouse.WMSControlled),
      inventoryManagement: this.displayBoolean(warehouse.InventoryManagement),
    };
  }

  private displayValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    return String(value);
  }

  private displayBoolean(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'number') {
      return value === 1 ? 'Yes' : 'No';
    }

    const normalizedValue = String(value).trim().toLowerCase();

    if (
      ['true', 'yes', 'y', '1', 'enabled', 'active'].includes(normalizedValue)
    ) {
      return 'Yes';
    }

    if (
      ['false', 'no', 'n', '0', 'disabled', 'inactive'].includes(
        normalizedValue,
      )
    ) {
      return 'No';
    }

    return String(value);
  }
}
