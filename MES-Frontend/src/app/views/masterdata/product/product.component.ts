import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableDirective } from '@coreui/angular';
import { ApiGetItems } from '../../../services/get-items-API/api-get-items.service';

interface ProductItem {
  Item: string;
  Description?: string;
  ItemType?: string;
  ItemGroup?: string;
  ProductType?: string;
  InventoryUnit?: string;
  UnitSet?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, TableDirective],
  providers: [ApiGetItems],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css'],
})
export class ProductComponent implements OnInit {
  productData: ProductItem[] = [];
  itemsPerPage = 10;
  currentPage = 1;
  productFilter = '';
  loading = true;
  errorMessage = '';

  constructor(private apiGetItems: ApiGetItems) {}

  ngOnInit(): void {
    this.apiGetItems.getData().subscribe({
      next: (data) => {
        this.productData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        this.errorMessage = 'Failed to load products.';
        this.loading = false;
      },
    });
  }

  filteredData(): ProductItem[] {
    if (!this.productFilter) {
      return this.productData;
    }

    const filter = this.productFilter.toLowerCase();

    return this.productData.filter((item) =>
      [
        item.Item,
        item.Description,
        item.ItemType,
        item.ItemGroup,
        item.ProductType,
      ].some((value) => value?.toString().toLowerCase().includes(filter)),
    );
  }

  paginatedData(): ProductItem[] {
    const filtered = this.filteredData();
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  }

  totalPages(): number {
    return Math.ceil(this.filteredData().length / this.itemsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
}
