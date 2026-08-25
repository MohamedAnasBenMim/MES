import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ApiMesDevicesService,
  MesDevice,
  MesDevicePayload,
} from '../../../services/mes-devices-API/api-mes-devices.service';
import { getAuthUsername } from '../../../utils/auth-storage';

@Component({
  selector: 'app-mes-devices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mes-devices.component.html',
  styleUrls: ['./mes-devices.component.css'],
})
export class MesDevicesComponent implements OnInit {
  devices: MesDevice[] = [];
  searchTerm = '';
  statusFilter = '';
  username = '';

  successMessage = '';
  errorMessage = '';

  selectedDevice: MesDevice | null = null;

  deviceToDisable: MesDevice | null = null;
  disableReason = '';

  showDeviceForm = false;
  editingDeviceId: number | null = null;
  deviceForm: MesDevicePayload = {
    username: '',
    device_name: '',
    device_type: 'PC',
    mac_address: '',
    ip_address: '',
    };

  constructor(private mesDevicesApi: ApiMesDevicesService) {}

  ngOnInit(): void {
    this.username = getAuthUsername() || '';
    this.loadDevices();
  }

  loadDevices(): void {
    if (!this.username) {
      this.showError('Admin session not found. Please login again.');
      return;
    }

    this.mesDevicesApi
      .getDevices(this.username, this.searchTerm, this.statusFilter)
      .subscribe({
        next: (data) => {
          this.devices = data;
        },
        error: (err) => {
          this.showError(
            err.error?.error || 'Failed to load MES devices.'
          );
        },
      });
  }

  onSearchChange(): void {
    this.loadDevices();
  }

  onStatusChange(): void {
    this.loadDevices();
  }

openAddDevice(): void {
  this.clearMessages();
  this.showDeviceForm = true;
  this.editingDeviceId = null;

  this.deviceForm = {
    username: this.username,
    device_name: '',
    device_type: 'PC',
    mac_address: '',
    ip_address: '',
  };
}

  viewDetails(device: MesDevice): void {
    this.selectedDevice = device;
  }

  closeDetails(): void {
    this.selectedDevice = null;
  }

editDevice(device: MesDevice): void {
  this.clearMessages();
  this.showDeviceForm = true;
  this.editingDeviceId = device.id;

  this.deviceForm = {
    username: this.username,
    device_id: device.device_id,
    device_name: device.device_name,
    device_type: device.device_type,
    mac_address: device.mac_address,
    ip_address: device.ip_address || '',
  };

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

saveDevice(): void {
  this.clearMessages();

  if (!this.deviceForm.device_name.trim()) {
    this.showError('Device Name is required.');
    return;
  }

  if (!this.deviceForm.device_type.trim()) {
    this.showError('Device Type is required.');
    return;
  }

  if (!this.deviceForm.mac_address.trim()) {
    this.showError('MAC Address is required.');
    return;
  }

  this.deviceForm.username = this.username;

  const request$ = this.editingDeviceId
    ? this.mesDevicesApi.updateDevice(this.editingDeviceId, this.deviceForm)
    : this.mesDevicesApi.createDevice(this.deviceForm);

  request$.subscribe({
    next: (res) => {
      this.showSuccess(res.message || 'MES device saved successfully.');
      this.cancelDeviceForm();
      this.loadDevices();
    },
    error: (err) => {
      this.showError(err.error?.error || 'Failed to save MES device.');
    },
  });
}

cancelDeviceForm(): void {
  this.showDeviceForm = false;
  this.editingDeviceId = null;

  this.deviceForm = {
    username: this.username,
    device_name: '',
    device_type: 'PC',
    mac_address: '',
    ip_address: '',
  };
}

private clearMessages(): void {
  this.successMessage = '';
  this.errorMessage = '';
}




disableDevice(device: MesDevice): void {
  this.clearMessages();
  this.deviceToDisable = device;
  this.disableReason = '';
}



enableDevice(device: MesDevice): void {
  this.clearMessages();

  this.mesDevicesApi.enableDevice(device.id, this.username).subscribe({
    next: (res) => {
      this.showSuccess(res.message || 'MES device enabled successfully.');
      this.loadDevices();
    },
    error: (err) => {
      this.showError(err.error?.error || 'Failed to enable MES device.');
    },
  });
}




confirmDisableDevice(): void {
  this.clearMessages();

  if (!this.deviceToDisable) {
    return;
  }

  const reason = this.disableReason.trim();

  if (!reason) {
    this.showError('Disable reason is required.');
    return;
  }

  this.mesDevicesApi
    .disableDevice(this.deviceToDisable.id, {
      username: this.username,
      disable_reason: reason,
    })
    .subscribe({
      next: (res) => {
        this.showSuccess(res.message || 'MES device disabled successfully.');
        this.closeDisableModal();
        this.loadDevices();
      },
      error: (err) => {
        this.showError(err.error?.error || 'Failed to disable MES device.');
      },
    });
}

closeDisableModal(): void {
  this.deviceToDisable = null;
  this.disableReason = '';
}




  formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleString();
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
  }
}