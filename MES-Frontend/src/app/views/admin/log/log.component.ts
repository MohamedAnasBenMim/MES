import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { UserApiService } from '../../../services/user-get-API/api-user-get.service';

interface SessionLog {
  id: number;
  username: string;
  email: string | null;
  role: string | null;
  login_time: string;
  logout_time: string | null;
  last_activity: string | null;
  duration_seconds: number;
  duration_display: string;
  status: string;
  is_active: boolean;
  ip_address: string | null;
}

@Component({
  selector: 'app-log',
  imports: [CommonModule, FormsModule],
  templateUrl: './log.component.html',
  styleUrl: './log.component.css',
})
export class LogComponent implements OnInit {
  logs: SessionLog[] = [];
  isLoading = false;
  errorMessage = '';
  searchTerm = '';
  statusFilter = 'all';

  constructor(private userApiService: UserApiService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  get filteredLogs(): SessionLog[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.logs.filter((log) => {
      const matchesStatus =
        this.statusFilter === 'all' || log.status === this.statusFilter;

      const matchesSearch =
        !search ||
        log.username?.toLowerCase().includes(search) ||
        log.email?.toLowerCase().includes(search) ||
        log.role?.toLowerCase().includes(search) ||
        log.ip_address?.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }

  get activeSessions(): number {
    return this.logs.filter((log) => log.status === 'Active').length;
  }

  get idleSessions(): number {
    return this.logs.filter((log) => log.status === 'Idle').length;
  }

  get closedSessions(): number {
    return this.logs.filter((log) => log.status === 'Closed').length;
  }

  loadLogs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userApiService.getUserSessionActivity().subscribe({
      next: (data: SessionLog[]) => {
        this.logs = data || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load session activity:', error);
        this.errorMessage = 'Unable to load session activity logs.';
        this.isLoading = false;
      },
    });
  }

  getStatusClass(status: string): string {
    const normalized = status.toLowerCase();

    if (normalized === 'active') {
      return 'status-active';
    }

    if (normalized === 'idle') {
      return 'status-idle';
    }

    return 'status-closed';
  }
}
