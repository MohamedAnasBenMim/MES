import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableDirective } from '@coreui/angular';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // ✅ Add this

import { ActiveOperation } from '../../../services/activelist-get-API/Get_activeListService';
import { GetActiveListService } from '../../../services/activelist-get-API/Get_activeListService';
import { getAuthUser } from '../../../utils/auth-storage';

interface UserFormData {
  id?: number;
  username: string;
  email: string;
  role: string;
  language: string;
  phone_number: string;
  password: string;
  companyId: string;
}
@Component({
  standalone: true,
  selector: 'app-active-list',
  templateUrl: './active-list.component.html',
  styleUrls: ['./active-list.component.css'],
  imports: [CommonModule, FormsModule, TableDirective], // ✅ Add FormsModule here
})
export class ActiveListComponent implements OnInit {
  selectedItem: any;
  activeOperations: ActiveOperation[] = [];
  filteredActive: ActiveOperation[] = [];
  formData: UserFormData = {
    id: undefined,
    username: '',
    email: '',
    role: '',
    language: '',
    phone_number: '',
    password: '',
    companyId: '',
  };

  // Pagination & filter
  itemsPerPage = 10;
  currentPage = 1;
  orderFilter: string = '';
  finishDateFilter: string = '';

  username = '';
  companyId = '';

  constructor(
    private router: Router,
    private activeListService: GetActiveListService
  ) {}

  ngOnInit(): void {
    const username = getAuthUser();

    if (username.id) {
      this.formData.id = username.id;
      this.username = username.username; // <-- FIX
      this.companyId = this.selectedItem?.companyId || '';
    } else {
      alert('❌ No user found. Please login.');
    }

    this.selectedItem = history.state.selectedItem;
    console.log('Received item:', this.selectedItem);
    this.activeListService.getActiveList(this.username).subscribe({
      next: (data: ActiveOperation[]) => {
        this.activeOperations = data;
        this.filteredActive = data;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error fetching active operations:', err);
      },
    });
  }

  // ---- FILTER + PAGINATION ----

  paginatedData(): ActiveOperation[] {
    const filtered = this.filteredAndSortedData();

    const start = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  }

  totalPages(): number {
    return Math.ceil(this.filteredAndSortedData().length / this.itemsPerPage);
  }

  filteredAndSortedData(): ActiveOperation[] {
    let filtered = this.activeOperations;

    if (this.orderFilter) {
      const filter = this.orderFilter.toLowerCase();
      filtered = filtered.filter((op: ActiveOperation) =>
        op.Order?.toString().toLowerCase().includes(filter)
      );
    }

    if (this.finishDateFilter) {
      filtered = filtered.filter(
        (op: ActiveOperation) =>
          this.toDateInputValue(op.PlannedFinishDate) === this.finishDateFilter
      );
    }

    return [...filtered].sort((a, b) => {
      const finishDateDiff =
        this.getPlannedFinishTime(a.PlannedFinishDate) -
        this.getPlannedFinishTime(b.PlannedFinishDate);

      if (finishDateDiff !== 0) {
        return finishDateDiff;
      }

      return a.id - b.id;
    });
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

  goToOperationExecution(op: ActiveOperation) {
    this.router.navigate(['/manufacturing/operation-execution'], {
      state: { selectedItem: op },
    });
  }
}
