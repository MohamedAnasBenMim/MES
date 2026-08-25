import { Component } from '@angular/core';
import { IconDirective } from '@coreui/icons-angular';
import { CommonModule } from '@angular/common';
import { CreateUserApiService } from '../../../services/user-post-API/api-user-post.service';
import { UserApiService } from '../../../services/user-get-API/api-user-get.service';
import {
  CountryCode,
  CountryCodeService,
} from '../../../services/country-code/country-code.service';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import {
  TextColorDirective,
  CardComponent,
  CardBodyComponent,
  FormDirective,
  InputGroupComponent,
  InputGroupTextDirective,
  FormControlDirective,
  ButtonDirective,
  ModalComponent,
  ModalBodyComponent,
  ModalHeaderComponent,
} from '@coreui/angular';

interface UserFormData {
  id?: number;
  username: string;
  email: string;
  role: string;
  language: string;
  phone_number: string;
  is_active?: boolean;
}

@Component({
  selector: 'app-users',
  standalone: true,
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  providers: [CreateUserApiService, UserApiService],
  imports: [
    CommonModule,
    HttpClientModule,
    TextColorDirective,
    CardComponent,
    CardBodyComponent,
    FormDirective,
    InputGroupComponent,
    InputGroupTextDirective,
    IconDirective,
    FormControlDirective,
    ButtonDirective,
    ModalComponent,
    ModalBodyComponent,
    ModalHeaderComponent,
    FormsModule,
  ],
})
export class UsersComponent {
  users: any[] = [];

  showRegisterForm = false;

  countryCodes: CountryCode[] = [];
  selectedCountryCode: string = '+216';
  phoneLocalNumber: string = '';
  countriesLoading: boolean = false;

  // Activate / deactivate modal
  showStatusConfirmModal = false;
  selectedUserForStatus: any = null;
  isTogglingStatus = false;

  // Delete confirmation modal
  showDeleteConfirmModal = false;
  selectedUserForDelete: any = null;
  isDeletingUser = false;

  // Email verification modal
  showVerificationModal = false;
  verificationCode: string = '';
  verificationEmail: string = '';
  verificationError: string = '';
  pendingVerificationId: number | null = null;
  isSendingVerificationCode = false;
  isVerifyingCode = false;

  // Success modal
  showSuccessModal = false;
  successModalTitle: string = '';
  successModalMessage: string = '';
  successModalExtraMessage: string = '';

  // Error modal
  showErrorModal = false;
  errorModalTitle: string = '';
  errorModalMessage: string = '';

  formData: UserFormData = {
    username: '',
    email: '',
    role: '',
    language: '',
    phone_number: '',
  };

  constructor(
    private CreateUserApiService: CreateUserApiService,
    private UserApiService: UserApiService,
    private CountryCodeService: CountryCodeService
  ) {}

  ngOnInit(): void {
    this.loadCountryCodes();
    this.fetchUsers();
  }

  loadCountryCodes(): void {
    this.countriesLoading = true;

    this.CountryCodeService.getCountryCodes().subscribe({
      next: (countries: CountryCode[]) => {
        this.countryCodes = countries;
        this.countriesLoading = false;

        if (this.formData.phone_number) {
          this.splitPhoneNumber(this.formData.phone_number);
        }
      },
      error: (err: any) => {
        console.error('❌ Failed to load country codes:', err);
        this.countriesLoading = false;

        this.openErrorModal(
          'Countries Loading Failed',
          'Failed to load country codes. Please refresh the page.'
        );
      },
    });
  }

  fetchUsers(): void {
    this.UserApiService.getData().subscribe({
      next: (data: any) => {
        this.users = data;
      },
      error: (err: any) => {
        console.error('Error fetching users:', err);

        this.openErrorModal(
          'Users Loading Failed',
          err.error?.error || 'Failed to load users.'
        );
      },
    });
  }

  syncPhoneNumber(): void {
    const cleanPhone = (this.phoneLocalNumber || '').replace(/[^\d]/g, '');

    if (cleanPhone) {
      this.formData.phone_number = `${this.selectedCountryCode}${cleanPhone}`;
    } else {
      this.formData.phone_number = '';
    }
  }

  splitPhoneNumber(fullPhone: string): void {
    if (!fullPhone) {
      this.selectedCountryCode = '+216';
      this.phoneLocalNumber = '';
      return;
    }

    const cleanFullPhone = fullPhone.replace(/\s+/g, '');

    const sortedCodes = [...this.countryCodes].sort(
      (a, b) => b.code.length - a.code.length
    );

    const matchedCountry = sortedCodes.find((country) =>
      cleanFullPhone.startsWith(country.code)
    );

    if (matchedCountry) {
      this.selectedCountryCode = matchedCountry.code;
      this.phoneLocalNumber = cleanFullPhone.replace(matchedCountry.code, '');
    } else {
      this.selectedCountryCode = '+216';
      this.phoneLocalNumber = cleanFullPhone.replace('+216', '');
    }
  }

  openRegisterPopup(): void {
    this.formData = {
      username: '',
      email: '',
      role: '',
      language: '',
      phone_number: '',
    };

    this.selectedCountryCode = '+216';
    this.phoneLocalNumber = '';

    this.pendingVerificationId = null;
    this.verificationCode = '';
    this.verificationEmail = '';
    this.verificationError = '';

    this.showRegisterForm = true;
  }

  closeRegisterPopup(): void {
    this.showRegisterForm = false;
  }

  create_account(): void {
    this.syncPhoneNumber();

    if (this.formData.id) {
      this.updateUser();
      return;
    }

    this.isSendingVerificationCode = true;

    this.CreateUserApiService.sendUserVerificationCode(this.formData).subscribe({
      next: (res: any) => {
        this.isSendingVerificationCode = false;

        this.pendingVerificationId = res.verification_id;
        this.verificationEmail = res.email || this.formData.email;
        this.verificationCode = '';
        this.verificationError = '';
        this.showVerificationModal = true;
      },
      error: (err: any) => {
        this.isSendingVerificationCode = false;

        console.error('❌ Verification code sending failed:', err);

        this.openErrorModal(
          'Create User Failed',
          err.error?.error || 'Failed to send verification code.'
        );
      },
    });
  }

  closeVerificationModal(): void {
    this.showVerificationModal = false;
    this.verificationCode = '';
    this.verificationError = '';
    this.isVerifyingCode = false;
  }

  openSuccessModal(
    title: string,
    message: string,
    extraMessage: string = ''
  ): void {
    this.successModalTitle = title;
    this.successModalMessage = message;
    this.successModalExtraMessage = extraMessage;
    this.showSuccessModal = true;
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.successModalTitle = '';
    this.successModalMessage = '';
    this.successModalExtraMessage = '';
  }

  openErrorModal(title: string, message: string): void {
    this.errorModalTitle = title;
    this.errorModalMessage = message;
    this.showErrorModal = true;
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorModalTitle = '';
    this.errorModalMessage = '';
  }

  confirmVerificationAndCreate(): void {
    if (!this.pendingVerificationId) {
      this.verificationError = 'Verification request not found.';
      return;
    }

    const cleanCode = (this.verificationCode || '').replace(/[^\d]/g, '');

    if (!cleanCode) {
      this.verificationError = 'Please enter the verification code.';
      return;
    }

    if (cleanCode.length !== 6) {
      this.verificationError = 'Verification code must contain 6 digits.';
      return;
    }

    this.isVerifyingCode = true;
    this.verificationError = '';

    this.CreateUserApiService.verifyUserAndCreate({
      verification_id: this.pendingVerificationId,
      code: cleanCode,
    }).subscribe({
      next: (res: any) => {
        this.isVerifyingCode = false;

        this.fetchUsers();

        this.showVerificationModal = false;
        this.showRegisterForm = false;

        this.pendingVerificationId = null;
        this.verificationEmail = '';
        this.verificationCode = '';
        this.verificationError = '';

        this.formData = {
          username: '',
          email: '',
          role: '',
          language: '',
          phone_number: '',
        };

        this.selectedCountryCode = '+216';
        this.phoneLocalNumber = '';

        setTimeout(() => {
          this.openSuccessModal(
            'Account Created Successfully',
            res.message || 'Email verified and user account created successfully.',
            "The generated password has been sent to the user's email."
          );
        }, 200);
      },
      error: (err: any) => {
        this.isVerifyingCode = false;

        console.error('❌ Verification failed:', err);
        this.verificationError =
          err.error?.error || 'Verification failed. Please try again.';
      },
    });
  }

  resendVerificationCode(): void {
    this.syncPhoneNumber();

    this.isSendingVerificationCode = true;
    this.verificationError = '';

    this.CreateUserApiService.sendUserVerificationCode(this.formData).subscribe({
      next: (res: any) => {
        this.isSendingVerificationCode = false;

        this.pendingVerificationId = res.verification_id;
        this.verificationEmail = res.email || this.formData.email;
        this.verificationCode = '';

        this.openSuccessModal(
          'Verification Code Resent',
          'A new verification code has been sent successfully.',
          "The generated verification code has been resend to the user's email."
        );
      },
      error: (err: any) => {
        this.isSendingVerificationCode = false;

        console.error('❌ Failed to resend verification code:', err);

        this.openErrorModal(
          'Resend Code Failed',
          err.error?.error || 'Failed to resend verification code.'
        );
      },
    });
  }

  getSubmitButtonText(): string {
    if (this.formData.id) {
      return 'Update User';
    }

    if (this.isSendingVerificationCode) {
      return 'Sending Code...';
    }

    return 'Send Verification Code';
  }

  openDeleteConfirmModal(user: any): void {
    this.selectedUserForDelete = user;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.selectedUserForDelete = null;
    this.showDeleteConfirmModal = false;
    this.isDeletingUser = false;
  }

  confirmDeleteUser(): void {
    if (!this.selectedUserForDelete?.id) {
      this.openErrorModal('Delete User Failed', 'Missing user ID.');
      return;
    }

    this.isDeletingUser = true;

    this.UserApiService.deleteUser(this.selectedUserForDelete.id).subscribe({
      next: () => {
        this.isDeletingUser = false;

        const deletedUsername = this.selectedUserForDelete.username;

        this.fetchUsers();
        this.closeDeleteConfirmModal();

        this.openSuccessModal(
          'User Deleted',
          `The user "${deletedUsername}" has been deleted successfully.`
        );
      },
      error: (err: any) => {
        this.isDeletingUser = false;

        console.error('Delete failed', err);

        this.openErrorModal(
          'Delete User Failed',
          err.error?.error || 'Failed to delete user.'
        );
      },
    });
  }

  editUser(user: any): void {
    this.formData = { ...user };
    this.splitPhoneNumber(user.phone_number || '');
    this.showRegisterForm = true;
  }

  updateUser(): void {
    if (!this.formData.id) {
      this.openErrorModal('Update User Failed', 'Cannot update user: Missing ID.');
      return;
    }

    this.syncPhoneNumber();

    this.UserApiService.updateUser(this.formData.id, this.formData).subscribe({
      next: () => {
        this.openSuccessModal(
          'User Updated',
          'The user account has been updated successfully.'
        );

        this.fetchUsers();
        this.closeRegisterPopup();
      },
      error: (err: any) => {
        console.error('❌ Error updating user:', err);

        this.openErrorModal(
          'Update User Failed',
          err.error?.error || 'Failed to update user.'
        );
      },
    });
  }

  openStatusConfirmModal(user: any): void {
    this.selectedUserForStatus = user;
    this.showStatusConfirmModal = true;
  }

  closeStatusConfirmModal(): void {
    this.selectedUserForStatus = null;
    this.showStatusConfirmModal = false;
    this.isTogglingStatus = false;
  }

  confirmToggleUserStatus(): void {
    if (!this.selectedUserForStatus) {
      this.openErrorModal('Status Update Failed', 'No user selected.');
      return;
    }

    this.isTogglingStatus = true;

    this.UserApiService.toggleUserStatus(this.selectedUserForStatus.id).subscribe({
      next: (res: any) => {
        this.isTogglingStatus = false;

        this.fetchUsers();
        this.closeStatusConfirmModal();

        this.openSuccessModal(
          'Account Status Updated',
          res.message || 'The account status has been updated successfully.'
        );
      },
      error: (err: any) => {
        this.isTogglingStatus = false;

        console.error('❌ Failed to change user status:', err);

        this.openErrorModal(
          'Status Update Failed',
          err.error?.error || 'Failed to change user status.'
        );
      },
    });
  }

  getStatusBadgeClass(user: any): string {
    return user.is_active ? 'bg-success' : 'bg-secondary';
  }

  getStatusText(user: any): string {
    return user.is_active ? 'Active' : 'Inactive';
  }

  getToggleButtonColor(user: any): string {
    return user.is_active ? 'secondary' : 'success';
  }

  getToggleButtonText(user: any): string {
    return user.is_active ? 'Deactivate' : 'Reactivate';
  }
}