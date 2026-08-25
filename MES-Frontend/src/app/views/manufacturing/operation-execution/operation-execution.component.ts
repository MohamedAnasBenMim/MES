import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../../services/report-order-post-API/api-report-order.service';
import { ApiServiceCompleteOperation } from '../../../services/report-operation-post-API/api-report-operation.service';
import { ApiServiceLastOperation } from '../../../services/get-last-operation-API/api-last-operation.service';
import { NcPopupComponent } from '../nc-popup/nc-popup.component';
import { Tabs2Module } from '@coreui/angular';
import { MaterialConsumptionPopupComponent } from '../material-popup/material-popup.component';
import { ApiGetMaterials } from '../../../services/get-materials-API/api-get-materials.service';
import { ApiGetRelatedNC } from '../../../services/get-related-nc-API/api-get-related-nc.service';
import { getAuthUser } from '../../../utils/auth-storage';
interface ExecutionItem {
  Order: string;
  Operation: string;
  OperatedItem: string;
  ReferenceOperationMachineType: string;
  RoutingQuantity: number;
  PlannedStartDate: string;
  ReferenceOperationWorkCenter: string;
  OperationStatus: string;
}
@Component({
  standalone: true,
  selector: 'app-operation-execution',
  templateUrl: './operation-execution.component.html',
  styleUrls: ['./operation-execution.component.css'],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    NcPopupComponent,
    Tabs2Module,
    MaterialConsumptionPopupComponent,
  ], // ✅ Required for ngModel
  providers: [
    ApiService,
    ApiServiceCompleteOperation,
    ApiServiceLastOperation,
    ApiGetMaterials,
    ApiGetRelatedNC,
  ],
})
export class OperationExecutionComponent implements OnInit {
  selectedItem: any;
  contentLoaded: boolean = false;
  activeNavItem: string = 'proplanner';
  showPopup = false;
  productionData: any;

  showCompletePopup: boolean = false;
  completeOrderChecked: boolean = false;
  lastoperation: boolean = false;
  // order_id: string = '';

  constructor(
    private apiService: ApiService,
    private ApiGetMaterials: ApiGetMaterials,
    private router: Router,
    private ApiServiceCompleteOperation: ApiServiceCompleteOperation,
    private ApiServiceLastOperation: ApiServiceLastOperation,
    private ApiGetRelatedNC: ApiGetRelatedNC
  ) {
    const nav = this.router.getCurrentNavigation();
    this.selectedItem = nav?.extras?.state?.['selectedItem'];
  }

  ngOnInit(): void {
    if (this.selectedItem) {
      const order_id = this.selectedItem.Order;
      const operation = this.selectedItem.Operation;

      this.get_material_length(order_id, operation);
      this.get_related_nc(order_id, operation);
    } else {
      // console.warn('⚠️ No selectedItem passed — maybe user refreshed?');
    }
  }

  // Set active navigation item
  setActiveNavItem(item: string): void {
    this.activeNavItem = item;
  }

  // Button action handlers
  showOrderDetails(): void {
    // console.log('Order details clicked');
  }

  popupVisible = false;

  closePopup() {
    this.popupVisible = false;
  }

  // Demo data for testing when no item is passed
  private getDemoData(): any {
    return {
      machineId: 'FLOW010',
      machineNumber: '21F010',
      overtime: '564610',
      elapsedTime: '56460',
      timeLeft: '0',
      orderNumber: 'J20000011',
      orderTotal: '10',
      progress: '0',
      target: '86.1',
      consumed: '0',
      total: '0',
      processId: 'PGF100071',
      currentValue: '0.0',
      targetValue: '1',
      serialNumber: '24041DR0001',
      disposition: 'NC0000025 dispositioned',
    };
  }

  completeOperation() {
    this.toggleCompletePopup(); // Show the confirmation popup
  }
  toggleNcPopup() {
    this.productionData = {
      Order: this.selectedItem?.Order,
      Operation: this.selectedItem?.Operation,
      item: this.selectedItem?.OperatedItem,
      timestamp: new Date(),
    };
    this.showPopup = !this.showPopup;
  }
  toggleCompletePopup() {
    this.showCompletePopup = !this.showCompletePopup;
  }
  LastOp: number = -1; // Use -1 as default to distinguish unset state

  buildPayload(now: Date) {
    const orderId = this.selectedItem?.Order;
    const operationId = this.selectedItem?.Operation;
    const user = getAuthUser();

    return {
      active_operation_id: this.selectedItem?.id,
      order_id: orderId,
      order_number: orderId,
      operation: operationId,
      qty_deliver: 1,
      qty_reject: 0,
      login_code: 'zumtech2',
      username: user?.username || '',
      CompletionDateTime: now.toISOString(),
    };
  }
  buildPayload1() {
    const orderId = this.selectedItem?.Order;
    const operationId = this.selectedItem?.Operation;

    return {
      order_id: orderId,
      order_number: orderId,
      operation: operationId,
      // qty_deliver: 1,
      // qty_reject: 0,
      // login_code: 'zumtech2',
    };
  }

  submitConfirmed() {
    const now = new Date();
    const payload = this.buildPayload(now);
    // console.log('payload order...', payload);

    this.callCompleteOperation(payload);
  }

  // callCompleteOperation(payload: any) {
  //   this.ApiServiceCompleteOperation.postData(payload).subscribe({
  //     next: (response) => {
  //       // console.log('ApiServiceCompleteOperation POST successful', response);
  //       this.showCompletePopup = false;

  //       this.checkIfLastOperation(payload);
  //     },
  //     error: (error) => {
  //       console.error('ApiServiceCompleteOperation POST error:', error);
  //     },
  //   });
  // }

  callCompleteOperation(payload: any) {
    this.ApiServiceCompleteOperation.postData(payload).subscribe({
      next: (response) => {
        // console.log('ApiServiceCompleteOperation POST successful', response);
        alert('Operation completed successfully');
        this.showCompletePopup = false;
        this.checkIfLastOperation(payload);
        this.goToDispatchList(payload);
      },
      error: (error) => {
        console.error('ApiServiceCompleteOperation POST error:', error);
        alert(this.getCompletionErrorMessage(error));
      },
    });
  }

  getCompletionErrorMessage(error: any): string {
    return (
      error?.error?.message ||
      error?.error?.error ||
      error?.message ||
      'Failed to complete the operation'
    );
  }
  goToDispatchList(payload: any) {
    this.router.navigate(['/manufacturing/dispatch-list'], {
      state: { selectedItem: payload },
    });
  }
  checkIfLastOperation(payload: any) {
    this.ApiServiceLastOperation.getData(
      payload.order_id,
      payload.operation
    ).subscribe({
      next: (data) => {
        // console.log('📦 Full response data:', data);

        if (!data || data.length === 0) {
          console.warn('⚠️ No data returned from LastOperation API');
          return; // Exit early if no data
        }

        const nextOp = data?.NextOperation;
        // console.log('🔍 NextOperation value:', nextOp);

        if (Number(nextOp) === 0) {
          // console.log('✅ Last operation detected. Completing order...');
          this.completeOrder(payload);
        } else {
          // console.log('➡️ Not the last operation. Skipping complete order.');
        }
      },
      error: (err) => {
        console.error('❌ Error fetching LastOperation:', err);
      },
    });
  }

  completeOrder(payload: any) {
    this.apiService.postData(payload).subscribe({
      next: (res) => {
        // console.log('apiService POST successful (complete order)', res);
      },
      error: (err) => {
        console.error('apiService POST error (complete order):', err);
      },
    });
  }
  materialData: any;
  ncData: any;

  materialCount: number = 0;
  totalToIssue: number = 0;
  totalEstimatedQuantity: number = 0;
  payload1 = this.buildPayload1();

  get_material_length(order_id: string, operation: number): void {
    this.ApiGetMaterials.getData(order_id, operation).subscribe({
      next: (data) => {
        this.materialData = data.value;
        // console.log(order_id, operation);

        // Calculate total ToIssue as sum of all 3 fields
        this.totalToIssue = this.materialData.reduce(
          (sum: number, item: any) => {
            const toIssue = item.ToIssue || 0;
            const toIssueByWH = item.ToIssueByWarehousing || 0;
            const subsequentDelivery = item.SubsequentDelivery || 0;
            return sum + toIssue + toIssueByWH + subsequentDelivery;
          },
          0
        );

        // Calculate total actual quantity
        this.totalEstimatedQuantity = this.materialData.reduce(
          (sum: number, item: any) => sum + (item.EstimatedQuantity || 0),
          0
        );
      },
      error: (err) => {
        console.error('Error fetching data:', err);
      },
    });
  }

  showMaterialConsumption(order_id: string, operation: number): void {
    this.popupVisible = true;
    this.get_material_length(order_id, operation);
    // ✅ correct call with parameters in scope
  }

  get_related_nc(order_id: string, operation: number): void {
    this.ApiGetRelatedNC.getData(order_id, operation).subscribe({
      next: (data) => {
        this.ncData = data;

        // console.log(order_id, operation);
        // console.log('Array length:', data.length);
        // console.log('First item:', data[0]);
      },
      error: (err) => {
        console.error('Error fetching data:', err);
      },
    });
  }
  handleNcSubmit(payload: any): void {
    // console.log('Submitted data:', payload);

    this.saveNc(payload);
  }

  saveNc(payload: any): void {
    const order_id = payload.OriginOrder;
    const operation = payload.Operation;
    this.get_related_nc(order_id, operation);
  }
  activeTab: string = 'work-instruction'; // default active tab

  showTab(tabId: string) {
    this.activeTab = tabId;
  }
}
