import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InforCredentials } from './infor-credentials.model';
import { ConfigApiService } from '../../../services/config-post-API/api-config-post.service';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  IonAPICredential,
  IonapiService,
} from '../../../services/config-get-API/api-config-get.service';
import {
  ToastBodyComponent,
  ToastComponent,
  ToastHeaderComponent,
} from '@coreui/angular';
import { ToastSampleIconComponent } from '../../../layout/default-layout/toast-sample-icon';

@Component({
  selector: 'app-config-list',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ToastComponent,
    ToastHeaderComponent,
    ToastSampleIconComponent,
    ToastBodyComponent,
  ],
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css'],
  providers: [ConfigApiService],
})
export class ConfigComponent implements OnInit {
  credentials: Record<string, any> = {};
  company: string = '';
  url: string = '';
  token: string = '';
  filename: string = 'test';

  constructor(
    private ConfigApiService: ConfigApiService,
    private router: Router,
    private ionapiService: IonapiService
  ) {}

  isArray(value: any): value is any[] {
    return Array.isArray(value);
  }
  @ViewChild('successToast') successToast!: ToastComponent;
  @ViewChild('errorToast') errorToast!: ToastComponent;
  successMessage = '';
  errorMessage = '';
  showSuccess = false;
  showError = false;
  formData = {
    ci: '',
    cn: '',
    cs: '',
    dt: '',
    ev: '',
    iu: '',
    oa: '',
    or: '',
    ot: '',
    pu: '',
    saak: '',
    sask: '',
    sc: '',
    ti: '',
    v: '',
    company: '',
    filename: '',
  };
  selectedFileName: string = '';

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFileName = file.name; // ✅ Track file name
    this.filename = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);

        // ✅ Only update fields from JSON, keep existing `company`
        this.formData = {
          ...this.formData,
          ci: json.ci || '',
          cn: json.cn || '',
          cs: json.cs || '',
          dt: json.dt || '',
          ev: json.ev || '',
          iu: json.iu || '',
          oa: json.oa || '',
          or: json.or || '',
          ot: json.ot || '',
          pu: json.pu || '',
          saak: json.saak || '',
          sask: json.sask || '',
          sc: json.sc || '',
          ti: json.ti || '',
          v: json.v || '',
        };
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };

    reader.readAsText(file);
  }

  showSuccessToast(message: string) {
    this.successMessage = message;
    this.showSuccess = true;

    setTimeout(() => {
      this.showSuccess = false; // hide after 3 seconds
    }, 5000);
  }

  showErrorToast(message: string) {
    this.errorMessage = message;
    this.showError = true;

    setTimeout(() => {
      this.showError = false; // hide after 3 seconds
    }, 5000);
  }

  onSubmit(): void {
    this.formData.filename = this.selectedFileName; // ✅ Add this line

    const payload = { ...this.formData };

    this.ConfigApiService.postData(payload).subscribe({
      next: (res: any) => {
        const cn = res.data?.cn || 'N/A';
        const ti = res.data?.ti || 'N/A';
        this.showSuccessToast(
          `${res.message}\nCustomer ID: ${cn}\nTenant: ${ti}`
        );
      },
      error: (err: any) => {
        const errorMsg = err.error?.error || 'Unknown error';
        const cn = err.error?.data?.cn || 'N/A';
        const ti = err.error?.data?.ti || 'N/A';
        this.showErrorToast(`${errorMsg}\nCustomer ID: ${cn}\nTenant: ${ti}`);
        console.error(err);
      },
    });
  }

  ionapiData!: IonAPICredential;
  formDisabled: boolean = true;
  hiddenFields = {
    ci: true,
    cn: false,
    cs: true,
  };

  ngOnInit(): void {
    this.ionapiService.getIonapiCredentials().subscribe({
      next: (data) => {
        // Map backend response → formData
        this.formData = {
          ci: data.ci || '',
          cn: data.cn || '',
          cs: data.cs || '',
          dt: data.dt || '',
          ev: data.ev || '',
          iu: data.iu || '',
          oa: data.oa || '',
          or: data.or || '',
          ot: data.ot || '',
          pu: data.pu || '',
          saak: data.saak || '',
          sask: data.sask || '',
          sc: data.sc || '',
          ti: data.ti || '',
          v: data.v || '',
          company: data.company || '',
          filename: data.filename || '',
        };

        this.selectedFileName = data.filename || '';
        this.formDisabled = false; // enable form after loading
      },

      error: (err) => {
        console.error('Error loading credentials:', err);
      },
    });
  }
}
