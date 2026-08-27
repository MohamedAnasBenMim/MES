import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableDirective } from '@coreui/angular';
import {
  ApiOperatorGetService,
  OperatorAssignmentItem,
  OperatorItem,
} from '../../../services/operator-get-API/api-operator-get.service';
import {
  ApiOperatorAssignmentService,
  OperatorAssignmentResponse,
} from '../../../services/operator-assignment-API/api-operator-assignment.service';
import {
  ActiveOperationItem,
  ApiOperationActiveGetService,
} from '../../../services/operation-active-get-API/api-operation-active-get.service';
import {
  getAuthRole,
  getAuthUserId,
  getAuthUsername,
} from '../../../utils/auth-storage';

interface OperatorRow extends OperatorItem {
  employee_id?: string;
  employeeId?: string;
  department?: string;
  workcenter?: string;
  shift?: string;
  skill?: string;
  current_assignment?:
    | (OperatorAssignmentItem & {
        operation?: ActiveOperationItem;
      })
    | null;
  current_operation?: ActiveOperationItem | null;
}

@Component({
  selector: 'app-supervisor-assignment-operators',
  standalone: true,
  imports: [CommonModule, FormsModule, TableDirective],
  templateUrl: './supervisor-assignment-operators.component.html',
  styleUrls: ['./supervisor-assignment-operators.component.css'],
})
export class SupervisorAssignmentOperatorsComponent implements OnInit {
  operators: OperatorRow[] = [];
  loading = true;

  itemsPerPage = 10;
  currentPage = 1;

  searchFilter = '';
  departmentFilter = '';
  workcenterFilter = '';
  shiftFilter = '';
  skillFilter = '';
  availabilityFilter = '';

  constructor(
    private operatorService: ApiOperatorGetService,
    private assignmentService: ApiOperatorAssignmentService,
    private activeOperationService: ApiOperationActiveGetService,
  ) {}

  ngOnInit(): void {
    this.loadOperators();
  }

  loadOperators(): void {
    this.loading = true;

    this.operatorService.getOperators().subscribe({
      next: (data) => {
        this.operators = data as OperatorRow[];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching operators:', err);
        this.loading = false;
      },
    });
  }

  filteredData(): OperatorRow[] {
    let filtered = this.operators;

    if (this.searchFilter) {
      const filter = this.searchFilter.toLowerCase();
      filtered = filtered.filter(
        (operator) =>
          operator.username?.toLowerCase().includes(filter) ||
          this.getEmployeeId(operator).toLowerCase().includes(filter),
      );
    }

    if (this.departmentFilter) {
      filtered = filtered.filter(
        (operator) => this.getDepartment(operator) === this.departmentFilter,
      );
    }

    if (this.workcenterFilter) {
      filtered = filtered.filter(
        (operator) => this.getWorkcenter(operator) === this.workcenterFilter,
      );
    }

    if (this.shiftFilter) {
      filtered = filtered.filter(
        (operator) => this.getShift(operator) === this.shiftFilter,
      );
    }

    if (this.skillFilter) {
      filtered = filtered.filter(
        (operator) => this.getSkill(operator) === this.skillFilter,
      );
    }

    if (this.availabilityFilter) {
      filtered = filtered.filter(
        (operator) => this.getStatus(operator) === this.availabilityFilter,
      );
    }

    return filtered;
  }
  assignmentModalOpen = false;
  assignmentMode: 'assign' | 'reassign' = 'assign';
  selectedOperator: OperatorRow | null = null;
  activeOperations: ActiveOperationItem[] = [];
  selectedOperation: ActiveOperationItem | null = null;
  operationSearchFilter = '';
  operationWorkcenterFilter = '';
  operationLoading = false;
  assignmentSubmitting = false;

  successMessage = '';
  errorMessage = '';

  historyModalOpen = false;
  historyLoading = false;
  historyRecords: OperatorAssignmentResponse[] = [];
  historyOperator: OperatorRow | null = null;

  paginatedData(): OperatorRow[] {
    const filtered = this.filteredData();
    const start = (this.currentPage - 1) * this.itemsPerPage;

    return filtered.slice(start, start + this.itemsPerPage);
  }

  trackOperatorRow(index: number, operator: OperatorRow): string {
    return (
      operator.row_id ||
      `${operator.id}-${operator.current_operation?.id || index}`
    );
  }

  totalPages(): number {
    return Math.ceil(this.filteredData().length / this.itemsPerPage) || 1;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  resetPage(): void {
    this.currentPage = 1;
  }

  uniqueDepartments(): string[] {
    return this.uniqueValues(
      this.operators.map((operator) => this.getDepartment(operator)),
    );
  }

  uniqueWorkcenters(): string[] {
    return this.uniqueValues(
      this.operators.map((operator) => this.getWorkcenter(operator)),
    );
  }

  uniqueShifts(): string[] {
    return this.uniqueValues(
      this.operators.map((operator) => this.getShift(operator)),
    );
  }

  uniqueSkills(): string[] {
    return this.uniqueValues(
      this.operators.map((operator) => this.getSkill(operator)),
    );
  }

  uniqueStatuses(): string[] {
    return this.uniqueValues(
      this.operators.map((operator) => this.getStatus(operator)),
    );
  }

  uniqueValues(values: string[]): string[] {
    return [...new Set(values.filter((value) => value && value !== '-'))];
  }

  getEmployeeId(operator: OperatorRow): string {
    return operator.employee_id || operator.employeeId || '-';
  }

  getDepartment(operator: OperatorRow): string {
    return operator.department || '-';
  }

  getWorkcenter(operator: OperatorRow): string {
    return (
      operator.workcenter ||
      operator.current_operation?.ReferenceOperationWorkCenter ||
      operator.current_assignment?.operation?.ReferenceOperationWorkCenter ||
      '-'
    );
  }

  getShift(operator: OperatorRow): string {
    return operator.shift || '-';
  }

  getSkill(operator: OperatorRow): string {
    return operator.skill || '-';
  }

  getStatus(operator: OperatorRow): string {
    return operator.status || 'available';
  }

  getCurrentOperation(operator: OperatorRow): string {
    const operation =
      operator.current_operation || operator.current_assignment?.operation;

    if (!operation) {
      return 'None';
    }

    return `${operation.Order || '-'} / ${operation.Operation || '-'}`;
  }

  canAssign(operator: OperatorRow): boolean {
    return this.getStatus(operator).toLowerCase() === 'available';
  }

  canReassign(operator: OperatorRow): boolean {
    return !!operator.current_assignment?.id;
  }

  assignOperator(operator: OperatorRow): void {
    this.openAssignmentModal(operator, 'assign');
  }

  reassignOperator(operator: OperatorRow): void {
    this.openAssignmentModal(operator, 'reassign');
  }

  removeAssignment(operator: OperatorRow): void {
    const assignmentId = operator.current_assignment?.id;
    const actorPayload = this.getSupervisorPayload();

    if (!assignmentId || !actorPayload.assigned_by_id) {
      return;
    }

    this.assignmentService
      .removeAssignment(assignmentId, {
        ...actorPayload,
        notes: 'Removed from supervisor assignment page',
      })
      .subscribe({
        next: () => {
          this.loadOperators();
          this.showSuccess('Assignment removed successfully.');
        },
        error: (err) => {
          console.error('Error removing assignment:', err);
          this.showError(
            this.getErrorMessage(err, 'Failed to remove assignment.'),
          );
        },
      });
  }

  viewHistory(operator: OperatorRow): void {
    this.historyOperator = operator;
    this.historyRecords = [];
    this.historyModalOpen = true;
    this.historyLoading = true;

    this.assignmentService.getAssignmentHistory(operator.id).subscribe({
      next: (data) => {
        this.historyRecords = data;
        this.historyLoading = false;
      },
      error: (err) => {
        console.error('Error fetching assignment history:', err);
        this.historyLoading = false;
        this.showError(
          this.getErrorMessage(err, 'Failed to load assignment history.'),
        );
      },
    });
  }

  openAssignmentModal(
    operator: OperatorRow,
    mode: 'assign' | 'reassign',
  ): void {
    this.selectedOperator = operator;
    this.assignmentMode = mode;
    this.selectedOperation = null;
    this.operationSearchFilter = '';
    this.operationWorkcenterFilter = '';
    this.assignmentModalOpen = true;
    this.loadActiveOperations();
  }
  closeAssignmentModal(): void {
    if (this.assignmentSubmitting) {
      return;
    }

    this.assignmentModalOpen = false;
    this.selectedOperator = null;
    this.selectedOperation = null;
    this.activeOperations = [];
  }

  loadActiveOperations(): void {
    this.operationLoading = true;

    this.activeOperationService.getActiveOperations().subscribe({
      next: (data) => {
        this.activeOperations = data;
        this.operationLoading = false;
      },
      error: (err) => {
        console.error('Error fetching active operations:', err);
        this.operationLoading = false;
        this.showError(
          this.getErrorMessage(err, 'Failed to load active operations.'),
        );
      },
    });
  }

  filteredOperations(): ActiveOperationItem[] {
    let filtered = this.activeOperations.filter(
      (operation) => !operation.assigned,
    );

    if (this.operationSearchFilter) {
      const filter = this.operationSearchFilter.toLowerCase();

      filtered = filtered.filter(
        (operation) =>
          operation.Order?.toString().toLowerCase().includes(filter) ||
          operation.Operation?.toString().toLowerCase().includes(filter) ||
          operation.OperatedItem?.toString().toLowerCase().includes(filter) ||
          operation.ReferenceOperationWorkCenter?.toString()
            .toLowerCase()
            .includes(filter),
      );
    }

    if (this.operationWorkcenterFilter) {
      filtered = filtered.filter(
        (operation) =>
          this.getOperationWorkcenter(operation) ===
          this.operationWorkcenterFilter,
      );
    }

    return filtered;
  }

  uniqueOperationWorkcenters(): string[] {
    return this.uniqueValues(
      this.activeOperations.map((operation) =>
        this.getOperationWorkcenter(operation),
      ),
    );
  }

  selectOperation(operation: ActiveOperationItem): void {
    this.selectedOperation = operation;
  }

  chooseOperation(operation: ActiveOperationItem): void {
    if (this.assignmentSubmitting) {
      return;
    }

    this.selectOperation(operation);
    this.confirmAssignment();
  }

  confirmAssignment(): void {
    const actorPayload = this.getSupervisorPayload();

    if (
      !this.selectedOperator ||
      !this.selectedOperation ||
      !actorPayload.assigned_by_id
    ) {
      return;
    }

    this.assignmentSubmitting = true;

    if (this.assignmentMode === 'assign') {
      this.assignmentService
        .createAssignment({
          operator_id: this.selectedOperator.id,
          operation_id: this.selectedOperation.id,
          ...actorPayload,
          notes: 'Assigned from supervisor assignment page',
        })
        .subscribe({
          next: () => this.afterAssignmentSaved(),
          error: (err) => {
            console.error('Error creating assignment:', err);
            this.assignmentSubmitting = false;
            this.showError(
              this.getErrorMessage(err, 'Failed to create assignment.'),
            );
          },
        });

      return;
    }

    const assignmentId = this.selectedOperator.current_assignment?.id;

    if (!assignmentId) {
      this.assignmentSubmitting = false;
      return;
    }

    this.assignmentService
      .updateAssignment(assignmentId, {
        operation_id: this.selectedOperation.id,
        ...actorPayload,
        notes: 'Reassigned from supervisor assignment page',
      })
      .subscribe({
        next: () => this.afterAssignmentSaved(),
        error: (err) => {
          console.error('Error updating assignment:', err);
          this.assignmentSubmitting = false;
          this.showError(
            this.getErrorMessage(err, 'Failed to update assignment.'),
          );
        },
      });
  }

  afterAssignmentSaved(): void {
    const message =
      this.assignmentMode === 'assign'
        ? 'Operation assigned successfully.'
        : 'Operation reassigned successfully.';

    this.assignmentSubmitting = false;
    this.closeAssignmentModal();
    this.loadOperators();
    this.loadActiveOperations();
    this.showSuccess(message);
  }

  getOperationWorkcenter(operation: ActiveOperationItem): string {
    return operation.ReferenceOperationWorkCenter || '-';
  }

  getOperationDescription(operation: ActiveOperationItem): string {
    return operation.ReferenceOperationMachineType || '-';
  }

  getOperationRemainingQuantity(operation: ActiveOperationItem): string {
    return '-';
  }

  getOperationPriority(operation: ActiveOperationItem): string {
    return '-';
  }

  getOperationDueDate(operation: ActiveOperationItem): string {
    return operation.PlannedFinishDate || '-';
  }

  getOperationEstimatedHours(operation: ActiveOperationItem): string {
    return '-';
  }

  closeHistoryModal(): void {
    this.historyModalOpen = false;
    this.historyOperator = null;
    this.historyRecords = [];
  }

  getHistoryOperation(record: OperatorAssignmentResponse): string {
    if (!record.operation) {
      return '-';
    }

    return `${record.operation.Order || '-'} / ${
      record.operation.Operation || '-'
    }`;
  }

  getHistoryAssignedAt(record: OperatorAssignmentResponse): string {
    return record.assigned_at || '-';
  }

  getHistoryClosedAt(record: OperatorAssignmentResponse): string {
    return record.closed_at || '-';
  }

  getHistoryReason(record: OperatorAssignmentResponse): string {
    return record.closed_reason || '-';
  }

  getHistoryNotes(record: OperatorAssignmentResponse): string {
    return record.notes || '-';
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';

    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';

    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  getErrorMessage(err: any, fallback: string): string {
    return err?.error?.error || err?.message || fallback;
  }

  refreshAssignmentData(): void {
    this.loadOperators();

    if (this.assignmentModalOpen) {
      this.loadActiveOperations();
    }
  }

  getSupervisorId(): number | null {
    return getAuthUserId();
  }

  getSupervisorUsername(): string {
    return getAuthUsername();
  }

  getSupervisorRole(): string {
    return getAuthRole();
  }

  getSupervisorPayload(): {
    assigned_by_id: number;
    assigned_by_username: string;
    assigned_by_role: string;
  } {
    return {
      assigned_by_id: this.getSupervisorId() || 0,
      assigned_by_username: this.getSupervisorUsername(),
      assigned_by_role: this.getSupervisorRole(),
    };
  }
}
