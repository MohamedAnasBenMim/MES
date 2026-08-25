import { NgFor, NgIf } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from '@coreui/angular';

import {
  CountryCode,
  CountryCodeService,
} from '../../../services/country-code/country-code.service';
import {
  CreateUserApiService,
} from '../../../services/user-post-API/api-user-post.service';
import {
  UserApiService,
} from '../../../services/user-get-API/api-user-get.service';
import {
  clearAuthSession,
  getAuthUser,
  updateAuthUser,
} from '../../../utils/auth-storage';

interface UserFormData {
  id?: number;
  username: string;
  email: string;
  role: string;
  language: string;
  phone_number: string;
  password: string;
  oldPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

type MessageModalType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit_profile.component.html',
  styleUrls: ['./edit_profile.component.css'],
  providers: [CreateUserApiService, UserApiService],
  standalone: true,
  imports: [
    FormsModule,
    CardModule,
    NgIf,
    NgFor,
    HttpClientModule,
  ],
})
export class edit_profileComponent implements OnInit {
  formData: UserFormData = {
    id: undefined,
    username: '',
    email: '',
    role: '',
    language: '',
    phone_number: '',
    password: '',
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  };

  countryCodes: CountryCode[] = [];
  selectedCountryCode = '+216';
  phoneLocalNumber = '';
  countriesLoading = false;

  selectedImage: File | null = null;
  imagePreviewUrl: string | null = null;

  isSaving = false;
  isSendingVerificationCode = false;
  isVerifyingCode = false;

  verificationModalVisible = false;
  verificationCode = '';
  verificationId: number | null = null;
  verificationEmail = '';
  verificationExpiresInMinutes = 10;

  messageModalVisible = false;
  messageModalTitle = '';
  messageModalMessage = '';
  messageModalType: MessageModalType = 'info';
  redirectToLoginAfterMessage = false;

  constructor(
    private readonly router: Router,
    private readonly userApiService: UserApiService,
    private readonly createUserApiService: CreateUserApiService,
    private readonly countryCodeService: CountryCodeService
  ) {}

  ngOnInit(): void {
    this.loadCountryCodes();

    const user = this.getStoredUser();

    if (user?.id) {
      this.formData.id = user.id;
      this.loadUserData(user.id);
      return;
    }

    this.showMessage(
      'Session Required',
      'No logged-in user was found. Please sign in again.',
      'error',
      true
    );
  }

  goBack(): void {
    history.back();
  }

  loadCountryCodes(): void {
    this.countriesLoading = true;

    this.countryCodeService.getCountryCodes().subscribe({
      next: (countries: CountryCode[]) => {
        this.countryCodes = countries;
        this.countriesLoading = false;

        if (this.formData.phone_number) {
          this.splitPhoneNumber(this.formData.phone_number);
        }
      },
      error: (error: any) => {
        console.error('Failed to load country codes:', error);
        this.countriesLoading = false;
      },
    });
  }

  syncPhoneNumber(): void {
    const cleanPhone = (this.phoneLocalNumber || '').replace(/[^\d]/g, '');

    this.formData.phone_number = cleanPhone
      ? this.selectedCountryCode + cleanPhone
      : '';
  }

  splitPhoneNumber(fullPhone: string): void {
    if (!fullPhone) {
      this.selectedCountryCode = '+216';
      this.phoneLocalNumber = '';
      return;
    }

    const cleanFullPhone = fullPhone.replace(/\s+/g, '');
    const sortedCodes = [...this.countryCodes].sort(
      (first, second) => second.code.length - first.code.length
    );

    const matchedCountry = sortedCodes.find((country) =>
      cleanFullPhone.startsWith(country.code)
    );

    if (matchedCountry) {
      this.selectedCountryCode = matchedCountry.code;
      this.phoneLocalNumber = cleanFullPhone.replace(matchedCountry.code, '');
      return;
    }

    this.selectedCountryCode = '+216';
    this.phoneLocalNumber = cleanFullPhone.replace('+216', '');
  }

  loadUserData(userId: number): void {
    this.userApiService.getUserById(userId).subscribe({
      next: (user: any) => {
        this.applyUserData(user);
      },
      error: (error: any) => {
        console.error('Failed to load user data:', error);
        this.showMessage(
          'Unable to Load Profile',
          error?.error?.error || 'Your profile information could not be loaded.',
          'error'
        );
      },
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.selectedImage = file;

    const reader = new FileReader();

    reader.onload = () => {
      this.imagePreviewUrl = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (
      this.isSaving ||
      this.isSendingVerificationCode ||
      this.isVerifyingCode
    ) {
      return;
    }

    if (!this.formData.id) {
      this.showMessage('Unable to Save', 'The user ID is missing.', 'error');
      return;
    }

    this.syncPhoneNumber();

    const oldPassword = (this.formData.oldPassword || '').trim();
    const newPassword = (this.formData.newPassword || '').trim();
    const confirmPassword = (this.formData.confirmNewPassword || '').trim();
    const wantsToChangePassword = Boolean(
      oldPassword || newPassword || confirmPassword
    );

    if (
      wantsToChangePassword &&
      !this.validatePasswordFields(oldPassword, newPassword, confirmPassword)
    ) {
      return;
    }

    const formDataToSend = new FormData();

    formDataToSend.append('username', this.formData.username);
    formDataToSend.append('phone_number', this.formData.phone_number || '');

    if (this.formData.role) {
      formDataToSend.append('role', this.formData.role);
    }

    if (this.formData.language) {
      formDataToSend.append('language', this.formData.language);
    }

    if (this.selectedImage) {
      formDataToSend.append('profile_image', this.selectedImage);
    }

    this.isSaving = true;

    this.userApiService.editUser(this.formData.id, formDataToSend).subscribe({
      next: () => {
        this.isSaving = false;

        if (wantsToChangePassword) {
          this.requestPasswordVerificationCode(
            oldPassword,
            newPassword,
            confirmPassword
          );
          return;
        }

        this.refreshStoredUser();

        this.showMessage(
          'Profile Updated',
          'Your profile was updated successfully.',
          'success'
        );
      },
      error: (error: any) => {
        this.isSaving = false;
        console.error('Error updating user:', error);

        this.showMessage(
          'Update Failed',
          error?.error?.error || 'Your profile could not be updated.',
          'error'
        );
      },
    });
  }

  verifyPasswordCode(): void {
    if (this.isVerifyingCode) {
      return;
    }

    const normalizedCode = this.verificationCode.replace(/\D/g, '').slice(0, 6);
    this.verificationCode = normalizedCode;

    if (normalizedCode.length !== 6) {
      this.showMessage(
        'Invalid Code',
        'Enter the complete 6-digit verification code.',
        'error'
      );
      return;
    }

    if (!this.verificationId) {
      this.showMessage(
        'Verification Error',
        'The verification request is missing. Request a new code.',
        'error'
      );
      return;
    }

    this.isVerifyingCode = true;

    this.createUserApiService
      .verifyProfilePasswordChangeCode({
        verification_id: this.verificationId,
        code: normalizedCode,
      })
      .subscribe({
        next: (response: any) => {
          this.isVerifyingCode = false;
          this.verificationModalVisible = false;
          this.verificationCode = '';
          this.verificationId = null;

          this.clearPasswordFields();
          this.removeAuthenticationStorage();

          this.showMessage(
            'Password Changed',
            response?.message ||
              'Your password was changed successfully. Please sign in again.',
            'success',
            true
          );
        },
        error: (error: any) => {
          this.isVerifyingCode = false;
          console.error('Password verification failed:', error);

          let message =
            error?.error?.error ||
            'The verification code could not be confirmed.';

          const remainingAttempts = error?.error?.remaining_attempts;

          if (remainingAttempts !== undefined && remainingAttempts !== null) {
            message += ` Remaining attempts: ${remainingAttempts}.`;
          }

          this.showMessage('Verification Failed', message, 'error');
        },
      });
  }

  closeVerificationModal(): void {
    if (this.isVerifyingCode || this.isSendingVerificationCode) {
      return;
    }

    this.verificationModalVisible = false;
    this.verificationCode = '';
  }

  resendVerificationCode(): void {
    const oldPassword = (this.formData.oldPassword || '').trim();
    const newPassword = (this.formData.newPassword || '').trim();
    const confirmPassword = (this.formData.confirmNewPassword || '').trim();

    if (
      !this.validatePasswordFields(oldPassword, newPassword, confirmPassword)
    ) {
      return;
    }

    this.requestPasswordVerificationCode(
      oldPassword,
      newPassword,
      confirmPassword
    );
  }

  onVerificationCodeInput(): void {
    this.verificationCode = this.verificationCode
      .replace(/\D/g, '')
      .slice(0, 6);
  }

  closeMessageModal(): void {
    this.messageModalVisible = false;

    if (this.redirectToLoginAfterMessage) {
      this.redirectToLoginAfterMessage = false;
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  private requestPasswordVerificationCode(
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ): void {
    if (this.isSendingVerificationCode) {
      return;
    }

    this.isSendingVerificationCode = true;

    this.createUserApiService
      .requestProfilePasswordChangeCode({
        username: this.formData.username,
        email: this.formData.email,
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      .subscribe({
        next: (response) => {
          this.isSendingVerificationCode = false;
          this.verificationId = response.verification_id;
          this.verificationEmail = response.masked_email || response.email;
          this.verificationExpiresInMinutes =
            response.expires_in_minutes || 10;
          this.verificationCode = '';
          this.verificationModalVisible = true;
        },
        error: (error: any) => {
          this.isSendingVerificationCode = false;
          console.error('Verification email failed:', error);

          this.showMessage(
            'Password Not Accepted',
            error?.error?.error || 'The verification code could not be sent.',
            'error'
          );
        },
      });
  }

  private validatePasswordFields(
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ): boolean {
    if (!oldPassword) {
      this.showMessage('Old Password Required', 'Enter your current password.', 'error');
      return false;
    }

    if (!newPassword) {
      this.showMessage('New Password Required', 'Enter your new password.', 'error');
      return false;
    }

    if (!confirmPassword) {
      this.showMessage(
        'Confirmation Required',
        'Confirm your new password.',
        'error'
      );
      return false;
    }

    if (newPassword !== confirmPassword) {
      this.showMessage(
        'Passwords Do Not Match',
        'The new password and confirmation are different.',
        'error'
      );
      return false;
    }

    if (newPassword.length < 8) {
      this.showMessage(
        'Password Too Short',
        'The new password must contain at least 8 characters.',
        'error'
      );
      return false;
    }

    return true;
  }

  private refreshStoredUser(): void {
    if (!this.formData.id) {
      return;
    }

    this.userApiService.getUserById(this.formData.id).subscribe({
      next: (updatedUser: any) => {
        updateAuthUser(updatedUser);
        this.applyUserData(updatedUser);
      },
      error: (error: any) => {
        console.error('Failed to refresh user:', error);
      },
    });
  }

  private applyUserData(user: any): void {
    this.formData.id = user.id || this.formData.id;
    this.formData.username = user.username || '';
    this.formData.email = user.email || '';
    this.formData.role = user.role || '';
    this.formData.language = user.language || '';
    this.formData.phone_number = user.phone_number || '';

    this.splitPhoneNumber(user.phone_number || '');

    if (user.profile_image) {
      this.imagePreviewUrl = `${user.profile_image}?t=${Date.now()}`;
    }

    this.clearPasswordFields();
  }

  private clearPasswordFields(): void {
    this.formData.password = '';
    this.formData.oldPassword = '';
    this.formData.newPassword = '';
    this.formData.confirmNewPassword = '';
  }

  private showMessage(
    title: string,
    message: string,
    type: MessageModalType,
    redirectToLogin = false
  ): void {
    this.messageModalTitle = title;
    this.messageModalMessage = message;
    this.messageModalType = type;
    this.redirectToLoginAfterMessage = redirectToLogin;
    this.messageModalVisible = true;
  }

  private removeAuthenticationStorage(): void {
    clearAuthSession();
  }

  private getStoredUser(): any {
    return getAuthUser();
  }
}
