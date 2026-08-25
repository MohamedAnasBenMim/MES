import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { UserApiService } from '../../../services/user-get-API/api-user-get.service';

interface RoleDefinition {
  key: string;
  name: string;
  description: string;
  accessLevel: string;
  modules: string[];
}

interface UserAccount {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active?: boolean;
}

@Component({
  selector: 'app-roles',
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css',
})
export class RolesComponent implements OnInit {
  users: UserAccount[] = [];
  searchTerm = '';
  selectedRole = 'all';
  isLoading = false;
  errorMessage = '';

  readonly roles: RoleDefinition[] = [
    {
      key: 'admin',
      name: 'Admin',
      description: 'Full system administration and user governance.',
      accessLevel: 'Full access',
      modules: [
        'Admin Dashboard',
        'System',
        'Users',
        'Roles',
        'Documentation',
      ],
    },
    {
      key: 'supervisor',
      name: 'Supervisor',
      description: 'Production oversight and operator coordination.',
      accessLevel: 'Operational management',
      modules: [
        'Supervisor Dashboard',
        'Assignment Operators',
        'Manufacturing',
        'Warehousing',
        'Quality',
      ],
    },
    {
      key: 'operator',
      name: 'Operator',
      description: 'Execution of production and warehouse tasks.',
      accessLevel: 'Task execution',
      modules: [
        'Operator Dashboard',
        'Dispatch List',
        'Active List',
        'Warehousing',
        'Quality',
      ],
    },
    {
      key: 'quality',
      name: 'Quality',
      description: 'Quality monitoring and non-conformance handling.',
      accessLevel: 'Quality control',
      modules: [
        'Quality Dashboard',
        'Non Conformances list',
        'Raise Non-Conformance',
        'Masterdata',
        'Documentation',
      ],
    },
  ];

  constructor(private userApiService: UserApiService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  get filteredRoles(): RoleDefinition[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.roles.filter((role) => {
      const matchesRole = this.selectedRole === 'all' || role.key === this.selectedRole;
      const matchesSearch =
        !search ||
        role.name.toLowerCase().includes(search) ||
        role.description.toLowerCase().includes(search) ||
        role.modules.some((module) => module.toLowerCase().includes(search));

      return matchesRole && matchesSearch;
    });
  }

  get totalAssignedUsers(): number {
    return this.users.filter((user) => this.normalizeRole(user.role)).length;
  }

  get activeUsers(): number {
    return this.users.filter((user) => user.is_active !== false).length;
  }

  get inactiveUsers(): number {
    return this.users.filter((user) => user.is_active === false).length;
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userApiService.getData().subscribe({
      next: (data: UserAccount[]) => {
        this.users = data || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load role assignments:', error);
        this.errorMessage = 'Unable to load assigned users for each role.';
        this.isLoading = false;
      },
    });
  }

  getRoleUserCount(roleKey: string): number {
    return this.users.filter((user) => this.normalizeRole(user.role) === roleKey).length;
  }

  getRoleActiveCount(roleKey: string): number {
    return this.users.filter(
      (user) =>
        this.normalizeRole(user.role) === roleKey &&
        user.is_active !== false
    ).length;
  }

  getRoleUsers(roleKey: string): UserAccount[] {
    return this.users.filter((user) => this.normalizeRole(user.role) === roleKey);
  }

  private normalizeRole(role: string | null | undefined): string {
    return String(role || '').trim().toLowerCase();
  }
}
