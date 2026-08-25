import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/inventory-list-API/api-inventory-list.service';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms'; // ✅ Add this
import { TableDirective } from '@coreui/angular';

interface InventoryItem {
  Item: string;
  Warehouse: string;
  Location: string;
  InventoryDate: string;
  InventoryOnHand: number;
  InventoryBlocked: string;
  InventoryAllocated: string;
  InventoryOnOrder: string;
}

@Component({
  selector: 'app-inventory-list',
  imports: [CommonModule, HttpClientModule, FormsModule, TableDirective],
  standalone: true,
  providers: [ApiService],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.css'],
})
export class inventoryListComponent implements OnInit {
  // InventoryData: InventoryItem[] = [];
  InventoryData: any;
  itemsPerPage = 10;
  currentPage = 1;
  orderFilter: string = '';

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.apiService.getData().subscribe({
      next: (data) => {
        this.InventoryData = data.value;
      },
      error: (err) => {
        console.error('Error fetching data:', err);
      },
    });
  }

  paginatedData(): InventoryItem[] {
    let filtered = this.InventoryData;

    if (this.orderFilter) {
      filtered = filtered.filter((item: InventoryItem) =>
        item.Item?.toString()
          .toLowerCase()
          .includes(this.orderFilter.toLowerCase())
      );
    }

    const start = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  }

  totalPages(): number {
    let filtered = this.InventoryData;

    if (this.orderFilter) {
      filtered = filtered.filter((item: InventoryItem) =>
        item.Item?.toString()
          .toLowerCase()
          .includes(this.orderFilter.toLowerCase())
      );
    }

    return Math.ceil(filtered.length / this.itemsPerPage);
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

  goToActiveList(item: InventoryItem) {
    this.router.navigate(['/manufacturing/active-list'], {
      state: { selectedItem: item },
    });
  }
}
