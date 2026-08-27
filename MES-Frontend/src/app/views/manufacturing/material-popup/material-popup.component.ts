import { Input, Output, EventEmitter } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { TableDirective } from '@coreui/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiGetMaterials } from '../../../services/get-materials-API/api-get-materials.service';
import { ApiInitiateMaterials } from '../../../services/initiate-material-post-API/api-initiate-material.service';
import { FormsModule } from '@angular/forms'; // ✅ Add this
import { NcPopupComponent } from '../nc-popup/nc-popup.component';

// import { ButtonDirective } from '@coreui/angular';

interface MaterialItem {
  Position: string;
  Item: string;
  ToIssue: Number;
  ToIssueByWarehousing: Number;
  SubsequentDelivery: Number;
  QuantityQuarantined: Number;
  QuantityScrapped: Number;
  ActualQuantity: Number;
  EstimatedQuantity: Number;
}

@Component({
  selector: 'app-material-popup',
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    TableDirective,
    NcPopupComponent,
    // ButtonDirective,
  ],
  templateUrl: './material-popup.component.html',
  styleUrl: './material-popup.component.css',
  providers: [ApiGetMaterials, ApiInitiateMaterials],
})
// export class MaterialConsumptionPopupComponent {
export class MaterialConsumptionPopupComponent implements OnInit {
  @Input() selectedItem: any;
  @Output() closed = new EventEmitter<void>();

  materialData: any;
  NCmaterialData: any;
  itemsPerPage = 3;
  currentPage = 1;
  materialFilter: string = '';
  showPopup = false;

  isLoading = true; // ✅ Added
  hasError = false; // Optional: handle API failure

  constructor(
    private apiService: ApiGetMaterials,
    private ApiInitiateMaterials: ApiInitiateMaterials,
    private router: Router,
  ) {}

  close() {
    this.closed.emit();
  }
  sumIssued(item: any): number {
    return (
      (item.ToIssue || 0) +
      (item.ToIssueByWarehousing || 0) +
      (item.SubsequentDelivery || 0)
    );
  }
  // getData(order_id: string, operation: number): Observable<any> {
  get_material_length(order_id: string, operation: number): void {
    this.apiService.getData(order_id, operation).subscribe({
      next: (data) => {
        this.materialData = data.value;
        this.NCmaterialData = data.value;
      },
      error: (err) => {
        console.error('Error fetching data:', err);
      },
    });
  }

  ngOnInit(): void {
    const order_id = this.selectedItem.Order;
    const operation = this.selectedItem.Operation;

    this.get_material_length(order_id, operation);
  }

  paginatedData(): MaterialItem[] {
    let filtered = this.materialData;

    if (this.materialFilter) {
      const filter = this.materialFilter.toLowerCase();
      filtered = filtered.filter(
        (item: MaterialItem) => item.Item?.toLowerCase().includes(filter),
      );
    }

    const start = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  }

  totalPages(): number {
    let filtered = this.materialData;

    if (this.materialFilter) {
      const filter = this.materialFilter.toLowerCase();
      filtered = filtered.filter(
        (item: MaterialItem) => item.Item?.toLowerCase().includes(filter),
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

  goToActiveList(item: MaterialItem) {
    this.router.navigate(['/manufacturing/active-list'], {
      state: { selectedItem: item },
    });
  }

  viewDetails(item: any) {
    console.log('View', item);
  }

  editItem(item: any) {
    console.log('Edit', item);
  }

  deleteItem(item: any) {
    console.log('Delete', item);
  }
  buildPayload(item: any) {
    return {
      order_id: item?.Order,
      position: item?.Position,
      // order_id: 'J60000010',
      // position: 10,
    };
  }

  Initiate_material(item: any): void {
    const payload = this.buildPayload(item);
    this.ApiInitiateMaterials.postData(payload).subscribe({
      next: (res) => {
        console.log('apiService POST successful (initiate material)', res);
      },
      error: (err) => {
        console.error('apiService POST error (initiate material):', err);
      },
    });
  }
  openNcComponent(item: any): void {
    console.log('Item passed from button:', item); // ✅ Debug: see item in console

    this.NCmaterialData = {
      Order: this.selectedItem?.Order,
      Operation: this.selectedItem?.Operation,
      item: this.selectedItem?.OperatedItem,
      bomitem: item.Item,
      timestamp: new Date(),
    };
    this.showPopup = !this.showPopup;
  }
  handleNcSubmit(payload: any): void {
    console.log('Submitted data:', payload);

    // this.saveNc(payload);
  }
  toggleNcPopup() {
    this.materialData = {
      Order: this.selectedItem?.Order,
      Operation: this.selectedItem?.Operation,
      item: this.selectedItem?.OperatedItem,
      bomitem: this.selectedItem?.Item,

      timestamp: new Date(),
    };
    this.showPopup = !this.showPopup;
  }
}
