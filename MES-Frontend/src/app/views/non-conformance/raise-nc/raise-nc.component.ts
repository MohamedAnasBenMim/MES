import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/nc-post-API/api-nc-post.service';
import { AttachmentApiService } from '../../../services/nc-attachment-post-API/api-nc-attachment-post.service';
import {
  Component,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import {
  ButtonCloseDirective,
  ToastBodyComponent,
  ToastComponent,
  ColComponent,
  FormControlDirective,
  FormDirective,
  FormLabelDirective,
  GutterDirective,
  RowDirective,
} from '@coreui/angular';

type DialogType = 'validation' | 'success' | 'error';

@Component({
  selector: 'app-raise-nc',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    FormControlDirective,
    FormLabelDirective,
    FormDirective,
    RowDirective,
    GutterDirective,
    ColComponent,
    ToastComponent,
    ToastBodyComponent,
    ButtonCloseDirective,
  ],
  providers: [ApiService, AttachmentApiService],
  templateUrl: './raise-nc.component.html',
  styleUrl: './raise-nc.component.css',
})
export class RaiseNcComponent {
  @ViewChild('toast')
  toastElement!: ElementRef;

  @Output()
  submitted = new EventEmitter<any>();

  toastMessage = '';

  ncSubject = '';
  productionOrder = '';
  operationNo: number | null = null;
  itemCode = '';
  description = '';
  Quantity: number | null = 1;
  OrderOrigin = 'JSCProduction';

  fileBase64: string | null = null;
  fileName: string | null = null;

  isSubmitting = false;

  showDialog = false;
  dialogType: DialogType = 'validation';
  dialogTitle = '';
  dialogMessage = '';
  dialogDetails: string[] = [];

  constructor(
    private apiService: ApiService,

    private AttachmentApiService: AttachmentApiService,

    private router: Router,
  ) {}

  ngOnInit(): void {}

  onCancel(): void {
    console.log('Form cancelled');
  }

  onAttach(): void {
    console.log('Attach clicked');
  }

  showToast(): void {
    this.toastElement.nativeElement.style.display = 'block';
  }

  closeToast(): void {
    this.toastElement.nativeElement.style.display = 'none';
  }

  private openDialog(
    type: DialogType,
    title: string,
    message: string,
    details: string[] = [],
  ): void {
    this.dialogType = type;

    this.dialogTitle = title;

    this.dialogMessage = message;

    this.dialogDetails = details;

    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;

    this.dialogDetails = [];
  }

  private getMissingFields(): string[] {
    const missing: string[] = [];

    if (!this.ncSubject.trim()) {
      missing.push('NC Subject');
    } else if (this.ncSubject.trim().length > 30) {
      missing.push('NC Subject must be 30 characters or fewer');
    }

    if (!this.productionOrder.trim()) {
      missing.push('Production Order No');
    }

    if (
      this.operationNo === null ||
      this.operationNo === undefined ||
      String(this.operationNo).trim() === ''
    ) {
      missing.push('Operation No');
    }

    if (!this.itemCode.trim()) {
      missing.push('Parent Item Code');
    }

    if (
      this.Quantity === null ||
      this.Quantity === undefined ||
      Number(this.Quantity) <= 0
    ) {
      missing.push('Quantity');
    }

    if (!this.description.trim()) {
      missing.push('NC Description');
    }

    if (!this.fileName || !this.fileBase64) {
      missing.push('Attachment');
    }

    return missing;
  }

  onSubmit(): void {
    const missingFields = this.getMissingFields();

    if (missingFields.length > 0) {
      this.openDialog(
        'validation',
        'Missing information',
        'Please complete the following required fields before submitting the non-conformance report.',
        missingFields,
      );

      return;
    }

    const payload = {
      Description: this.ncSubject.trim(),

      OrderOrigin: 'JSCProduction',

      OriginOrder: this.productionOrder.trim(),

      Operation: Number(this.operationNo),

      DescriptionOfNonConformance: this.description.trim(),

      Item: this.itemCode.trim(),
    };

    this.isSubmitting = true;

    console.log('NC Submitted data:', payload);

    this.submitted.emit(payload);

    this.apiService.postData(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        this.openDialog(
          'success',
          'Non-conformance created',
          `The report was created successfully. NC Number: ${
            response?.NonConformanceReport || 'Generated'
          }`,
        );

        this.attach_file();
      },

      error: (error) => {
        this.isSubmitting = false;

        console.error('Failed to create NC:', error);

        this.openDialog(
          'error',
          'Submission failed',
          this.getSubmissionErrorMessage(error),
        );
      },
    });
  }

  private getSubmissionErrorMessage(error: any): string {
    const backendError = error?.error;

    const details =
      backendError?.details ||
      backendError?.message ||
      backendError?.error ||
      error?.message;

    if (!details) {
      return 'The non-conformance report could not be created. Please verify the information and try again.';
    }

    if (typeof details === 'string') {
      return details;
    }

    const nestedMessage =
      details?.error?.details?.[0]?.message ||
      details?.error?.message ||
      details?.details?.[0]?.message ||
      details?.message;

    if (nestedMessage) {
      return nestedMessage;
    }

    return JSON.stringify(details);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;

    if (!input || !input.files || input.files.length === 0) {
      this.fileName = null;

      this.fileBase64 = null;

      return;
    }

    const file = input.files.item(0);

    if (!file) {
      this.fileName = null;

      this.fileBase64 = null;

      return;
    }

    this.fileName = file.name;

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== 'string') {
        this.fileBase64 = null;

        return;
      }

      const base64Part = result.split(',')[1];

      this.fileBase64 = base64Part || null;
    };

    reader.onerror = () => {
      this.fileName = null;

      this.fileBase64 = null;

      this.openDialog(
        'error',
        'Attachment error',
        'The selected attachment could not be read. Please select the file again.',
      );
    };

    reader.readAsDataURL(file);
  }

  attach_file(): void {
    if (!this.fileBase64 || !this.fileName) {
      return;
    }

    const payload1 = {
      item: {
        attrs: {
          attr: [
            {
              name: 'MDS_AccountingEntity',
              value: 'infor.ln.5100',
            },
            {
              name: 'MDS_EntityType',
              value: 'InforERPEnterpriseQualityNonConformingMaterialReport',
            },
            {
              name: 'MDS_EntityType',
              value: this.OrderOrigin,
            },
            {
              name: 'MDS_id1',
              value: this.OrderOrigin,
            },
            {
              name: 'MDS_id2',
              value: this.productionOrder,
            },
            {
              name: 'MDS_id3',
              value: this.operationNo,
            },
          ],
        },

        resrs: {
          res: [
            {
              filename: this.fileName,

              base64: this.fileBase64,
            },
          ],
        },

        acl: {
          name: 'Public',
        },

        entityName: 'MDS_GenericDocument',
      },
    };

    this.AttachmentApiService.postData(payload1).subscribe({
      next: () => {
        this.toastMessage = 'Attachment uploaded successfully.';

        this.showToast();

        console.log('Attachment uploaded');
      },

      error: () => {
        this.toastMessage = 'Failed to upload attachment.';

        this.showToast();

        console.error('Failed to upload attachment');
      },
    });
  }
}
