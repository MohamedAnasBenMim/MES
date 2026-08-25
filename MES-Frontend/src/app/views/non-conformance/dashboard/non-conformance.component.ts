import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/nc-list-API/api-nclist.service';
import { TableDirective } from '@coreui/angular';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-non-conformance',
  templateUrl: './non-conformance.component.html',
  styleUrl: './non-conformance.component.css',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, TableDirective],
  providers: [ApiService],
})
export class NonConformanceComponent implements OnInit {
  itemsPerPage = 10;
  currentPage = 1;
  ncData: any[] = [];
  ncNumberFilter = '';

  constructor(private apiService: ApiService, private router: Router) {}

  loading = true;

  ngOnInit(): void {
    console.log('🚀 Component loaded');
    this.apiService.fetchAllNcReports().subscribe({
      next: (allReports) => {
        this.ncData = allReports;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error fetching NC reports:', err);
        this.loading = false;
      },
    });
  }

paginatedData() {
  let filtered = this.ncData;

  if (this.ncNumberFilter) {
    const filter = this.ncNumberFilter.toLowerCase();
    filtered = filtered.filter((item) =>
      item.NonConformanceReport?.toString().toLowerCase().includes(filter)
    );
  }

  const start = (this.currentPage - 1) * this.itemsPerPage;
  return filtered?.slice(start, start + this.itemsPerPage);
}

totalPages() {
  let filtered = this.ncData;

  if (this.ncNumberFilter) {
    const filter = this.ncNumberFilter.toLowerCase();
    filtered = filtered.filter((item) =>
      item.NonConformanceReport?.toString().toLowerCase().includes(filter)
    );
  }

  return Math.ceil((filtered?.length || 0) / this.itemsPerPage);
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

  // goToActiveList(item: any) {
  //   this.router.navigate(['/active-list'], { state: { selectedItem: item } });
  // }
}
