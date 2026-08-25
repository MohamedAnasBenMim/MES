import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
// import { FormsModule } from '@angular/forms';
import { timer } from 'rxjs';
import { ApiService } from '../../../services/nc-post-API/api-nc-post.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { viewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import {
  ButtonCloseDirective,
  ToastBodyComponent,
  ToastComponent,
} from '@coreui/angular';

import {
  ButtonDirective,
  ToasterComponent,
  ToasterPlacement,
} from '@coreui/angular';
// import { AppToastSampleComponent } from './toast-sample.component';
import {
  ColComponent,
  FormControlDirective,
  FormFeedbackComponent,
  FormLabelDirective,
} from '@coreui/angular';

@Component({
  selector: 'app-nc-popup',
  standalone: true,
  templateUrl: './nc-popup.component.html',
  styleUrls: ['./nc-popup.component.css'],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    // ToastComponent,
    // ToastBodyComponent,
    // ButtonCloseDirective,
    ReactiveFormsModule,
    FormsModule,
    // ToasterComponent,
    // ButtonDirective,
    // ColComponent,
    // FormLabelDirective,
    // FormControlDirective,
    // FormFeedbackComponent,
  ], // ✅ Required for ngModel
  providers: [ApiService],
})
export class NcPopupComponent {
  itemCode: string = '';
  description: string = '';
  ncSubject: string = '';
  productionOrder: string = '';
  operationNo: number | null = null;
  OrderPosition: number | null = null;
  Quantity: number | null = 1;
  bomitem: string = '';
  toastMessage: string | null = null;
  @Input() dataFromParent: any;
  @Output() close = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<any>(); // 👈 for notifying parent

  constructor(private apiService: ApiService) {} //, private toastr: ToastrService) {} // ✅ Inject service here
  // constructor(private apiService: ApiService, private toastr: ToastrService) {} // ✅ Inject service here
  placement = ToasterPlacement.TopCenter;

  readonly toaster = viewChild(ToasterComponent);

  // addToast() {
  //   const options = {
  //     title: `CoreUI for Angular Toast`,
  //     delay: 5000,
  //     placement: this.placement,
  //     color: 'info',
  //     autohide: true,
  //   };
  // }
  ngOnInit(): void {
    this.productionOrder = this.dataFromParent.Order;
    this.operationNo = this.dataFromParent.Operation;
    this.itemCode = this.dataFromParent.item;
    this.bomitem = this.dataFromParent.bomitem;
    this.OrderPosition = this.dataFromParent.OrderPosition;
  }

  onClose() {
    this.close.emit();
  }
  onCancel() {
    this.close.emit();
  }
  onSubmit() {
    const payload = {
      Description: this.ncSubject,
      OrderOrigin: 'JSCProduction',
      OriginOrder: this.productionOrder,
      Operation: Number(this.operationNo),
      DescriptionOfNonConformance: this.description,
      Item: this.bomitem,
      OrderPosition: this.OrderPosition,
    };
    console.log('NC Submitted data123:', payload);

    this.submitted.emit(payload); // 👈 notify the parent with data

    this.apiService.postData(payload).subscribe({
      next: (res) => {
        alert(
          `✅ NC created successfully! NC Number: ${res.NonConformanceReport}`
        );
      },
      error: (err) => {
        alert(`❌ Failed to create NC`);
      },
    });
  }
}
//     this.apiService.postData(payload).subscribe({
//       next: (res) => {
//         this.toastr.success(
//           `NC created successfully! NC Number: ${res.NonConformanceReport}`,
//           '✅ Success'
//         );
//         // this.submitted.emit(payload); // 👈 notify the parent with data
//       },
//       error: (err) => {
//         this.toastr.error('Failed to create NC', '❌ Error');
//       },
//     });
//   }
// }
