import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardGroupComponent,
  ColComponent,
  ContainerComponent,
  FormControlDirective,
  FormDirective,
  InputGroupComponent,
  InputGroupTextDirective,
  RowComponent,
} from '@coreui/angular';

import { IconDirective } from '@coreui/icons-angular';

import { CreateUserApiService } from '../../../services/user-post-API/api-user-post.service';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,

    ContainerComponent,
    RowComponent,
    ColComponent,
    CardComponent,
    CardBodyComponent,
    CardGroupComponent,
    FormDirective,
    FormControlDirective,
    InputGroupComponent,
    InputGroupTextDirective,
    ButtonDirective,
    IconDirective,
  ],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.css',
})
export class ForgetPasswordComponent {
  email: string = '';
  message: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  constructor(private createUserApiService: CreateUserApiService) {}

  sendNewPassword(): void {
    console.log('Button clicked');
    console.log('Email:', this.email);

    this.message = '';
    this.errorMessage = '';

    const cleanEmail = this.email.trim();

    if (!cleanEmail) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    this.loading = true;

    this.createUserApiService.forgetPassword(cleanEmail).subscribe({
      next: (res: any) => {
        console.log('API response:', res);

        this.message =
          res.message || 'If this email exists, a new password has been sent.';

        this.loading = false;
      },
      error: (err) => {
        console.log('API error:', err);

        this.errorMessage =
          err.error?.error || 'Something went wrong. Please try again.';

        this.loading = false;
      },
    });
  }
}