import { Component, OnInit } from '@angular/core';
import { TableDirective } from '@coreui/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/dispatch-list-API/api-dispatch-list.service';
import { activeListService } from '../../../services/activelist-post-API/activeListService';
import { FormsModule } from '@angular/forms'; // ✅ Add this
import { getAuthUsername } from '../../../utils/auth-storage';

interface DispatchItem {
  Order: string;
  Operation: string;
  OperatedItem: string;
  ReferenceOperationMachineType: string;
  RoutingQuantity: number;
  PlannedStartDate: string;
  PlannedFinishDate: string;
  ReferenceOperationWorkCenter: string;
  OperationStatus: string;
}

@Component({
  selector: 'app-dispatch-list',
  standalone: true,
  providers: [ApiService, activeListService],
  templateUrl: './dispatch-list.component.html',
  styleUrls: ['./dispatch-list.component.css'],

  imports: [CommonModule, HttpClientModule, FormsModule, TableDirective],
})
export class DispatchListComponent implements OnInit {
  dispatchData: DispatchItem[] = [];
  itemsPerPage = 10;
  currentPage = 1;
  orderFilter: string = '';
  finishDateFilter: string = '';

  constructor(
    private apiService: ApiService,
    private activeListService: activeListService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const username = getAuthUsername();

    this.apiService.getData(username).subscribe({
      next: (data) => {
        this.dispatchData = data;
      },
      error: (err) => {
        console.error('Error fetching data:', err);
      },
    });
  }

  paginatedData(): DispatchItem[] {
    const filtered = this.filteredAndSortedData();

    const start = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  }

  totalPages(): number {
    return Math.ceil(this.filteredAndSortedData().length / this.itemsPerPage);
  }

  filteredAndSortedData(): DispatchItem[] {
    let filtered = this.dispatchData;

    if (this.orderFilter) {
      const filter = this.orderFilter.toLowerCase();
      filtered = filtered.filter(
        (item: DispatchItem) =>
          item.Order?.toString().toLowerCase().includes(filter),
      );
    }

    if (this.finishDateFilter) {
      filtered = filtered.filter(
        (item: DispatchItem) =>
          this.toDateInputValue(item.PlannedFinishDate) ===
          this.finishDateFilter,
      );
    }

    return [...filtered].sort(
      (a, b) =>
        this.getPlannedFinishTime(a.PlannedFinishDate) -
        this.getPlannedFinishTime(b.PlannedFinishDate),
    );
  }

  private getPlannedFinishTime(value: string | undefined): number {
    if (!value) {
      return Number.MAX_SAFE_INTEGER;
    }

    const time = new Date(value).getTime();

    if (Number.isNaN(time)) {
      return Number.MAX_SAFE_INTEGER;
    }

    return time;
  }

  private toDateInputValue(value: string | undefined): string {
    const isoDate = value?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];

    if (isoDate) {
      return isoDate;
    }

    const time = this.getPlannedFinishTime(value);

    if (time === Number.MAX_SAFE_INTEGER) {
      return '';
    }

    const date = new Date(time);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToActiveList(item: DispatchItem) {
    const username = getAuthUsername();
    const company_id = '';

    const payload = {
      username: username,
      companyId: company_id,
      Order: item.Order,
      Operation: item.Operation,
      OperatedItem: item.OperatedItem,
      ReferenceOperationMachineType: item.ReferenceOperationMachineType,
      RoutingQuantity: item.RoutingQuantity,
      PlannedStartDate: item.PlannedStartDate,
      PlannedFinishDate: item.PlannedFinishDate,
      ReferenceOperationWorkCenter: item.ReferenceOperationWorkCenter,
      OperationStatus: item.OperationStatus,
    };

    console.log('Submitting Active List data:', payload);

    this.activeListService.addToActiveList(payload).subscribe({
      next: (res: any) => {
        console.log('Saved successfully:', res);
        this.router.navigate(['/manufacturing/active-list']);
      },
      error: (err: any) => {
        console.error('❌ Failed to save Active List:', err);
        alert('❌ Failed to save Active List');
      },
    });
  }
}
