import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import {
  ApiIdmConfigurationService,
  IdmConfiguration,
  IdmConfigurationPayload,
} from '../../../services/idm-configuration-API/api-idm-configuration.service';
import {
  getAuthRole,
  getAuthUser,
  getAuthUsername,
} from '../../../utils/auth-storage';

@Component({
  selector: 'app-idm-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './idm-configuration.component.html',
  styleUrls: ['./idm-configuration.component.css'],
})
export class IdmConfigurationComponent implements OnInit {
  configurations: IdmConfiguration[] = [];
  searchTerm = '';
  editingId: number | null = null;
  username = '';

  successMessage = '';
  errorMessage = '';

  formData: IdmConfigurationPayload = {
    username: '',
    document: '',
    document_type: '',
    entity_type: '',
    entity_type_value: '',
    accounting_entity: '',
    accounting_entity_value: '',
    location: '',
    location_value: '',
    invoice_number: '',
    transaction_type: '',
    financial_company: '',
  };

  constructor(private idmApi: ApiIdmConfigurationService) {}

  ngOnInit(): void {
    this.username = this.resolveAdminUsername();
    this.formData.username = this.username;
    this.loadConfigurations();
  }

  get filteredConfigurations(): IdmConfiguration[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.configurations;
    }

    return this.configurations.filter((item) =>
      [
        item.document,
        item.document_type,
        item.entity_type,
        item.entity_type_value,
        item.accounting_entity,
        item.accounting_entity_value,
        item.location,
        item.location_value,
        item.invoice_number,
        item.transaction_type,
        item.financial_company,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }

  loadConfigurations(): void {
    if (!this.username) {
      this.showError('Admin session not found. Please login again as admin.');
      return;
    }

    this.idmApi.getConfigurations(this.username).subscribe({
      next: (data) => {
        this.configurations = data;
      },
      error: (err) => {
        this.showError(
          this.getErrorMessage(err, 'Failed to load IDM configurations.'),
        );
      },
    });
  }

  saveConfiguration(form?: NgForm): void {
    this.clearMessages();

    if (form?.invalid) {
      form.control.markAllAsTouched();
      this.showError('Please fill all required fields.');
      return;
    }

    this.username = this.resolveAdminUsername();

    if (!this.username) {
      this.showError('Admin session not found. Please login again as admin.');
      return;
    }

    this.formData.username = this.username;

    const request$ = this.editingId
      ? this.idmApi.updateConfiguration(this.editingId, this.formData)
      : this.idmApi.createConfiguration(this.formData);

    request$.subscribe({
      next: (res) => {
        this.showSuccess(
          res.message || 'IDM configuration saved successfully.',
        );
        this.cancelEdit(form);
        this.loadConfigurations();
      },
      error: (err) => {
        this.showError(
          this.getErrorMessage(err, 'Failed to save IDM configuration.'),
        );
      },
    });
  }

  editConfiguration(config: IdmConfiguration): void {
    this.editingId = config.id;

    this.formData = {
      username: this.username,
      document: config.document,
      document_type: config.document_type,
      entity_type: config.entity_type,
      entity_type_value: config.entity_type_value,
      accounting_entity: config.accounting_entity,
      accounting_entity_value: config.accounting_entity_value,
      location: config.location || '',
      location_value: config.location_value || '',
      invoice_number: config.invoice_number,
      transaction_type: config.transaction_type || '',
      financial_company: config.financial_company,
    };

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteConfiguration(config: IdmConfiguration): void {
    const confirmed = confirm(
      `Delete IDM configuration "${config.document_type}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.idmApi.deleteConfiguration(config.id, this.username).subscribe({
      next: (res) => {
        this.showSuccess(
          res.message || 'IDM configuration deleted successfully.',
        );
        this.loadConfigurations();

        if (this.editingId === config.id) {
          this.cancelEdit();
        }
      },
      error: (err) => {
        this.showError(
          this.getErrorMessage(err, 'Failed to delete IDM configuration.'),
        );
      },
    });
  }

  private resolveAdminUsername(): string {
    const user = getAuthUser();
    const role = getAuthRole();
    const username = getAuthUsername() || user?.username || '';

    if (username) {
      return username;
    }

    return role === 'admin' ? 'admin' : '';
  }

  private getErrorMessage(err: any, fallback: string): string {
    if (err?.status === 0) {
      return 'Cannot reach the backend server. Please start Django on port 8000.';
    }

    if (typeof err?.error === 'string') {
      return err.error;
    }

    return err?.error?.error || err?.message || fallback;
  }

  cancelEdit(form?: NgForm): void {
    this.editingId = null;

    this.formData = {
      username: this.username,
      document: '',
      document_type: '',
      entity_type: '',
      entity_type_value: '',
      accounting_entity: '',
      accounting_entity_value: '',
      location: '',
      location_value: '',
      invoice_number: '',
      transaction_type: '',
      financial_company: '',
    };

    form?.resetForm(this.formData);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
