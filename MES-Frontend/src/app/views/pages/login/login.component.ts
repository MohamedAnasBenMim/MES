// import { Component } from '@angular/core';
// import { NgStyle } from '@angular/common';
// import { IconDirective } from '@coreui/icons-angular';
// import { Router } from '@angular/router';
// import { FormsModule } from '@angular/forms'; //

// import {
//   ContainerComponent,
//   RowComponent,
//   ColComponent,
//   CardGroupComponent,
//   TextColorDirective,
//   CardComponent,
//   CardBodyComponent,
//   FormDirective,
//   InputGroupComponent,
//   InputGroupTextDirective,
//   FormControlDirective,
//   ButtonDirective,
// } from '@coreui/angular';

// @Component({
//   selector: 'app-login',
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.css'],
//   standalone: true,
//   imports: [
//     FormsModule, // ✅ Add this
//     ContainerComponent,
//     RowComponent,
//     ColComponent,
//     CardGroupComponent,
//     TextColorDirective,
//     CardComponent,
//     CardBodyComponent,
//     FormDirective,
//     InputGroupComponent,
//     InputGroupTextDirective,
//     IconDirective,
//     FormControlDirective,
//     ButtonDirective,
//     NgStyle,
//   ],
// })
// export class LoginComponent {
//   username: string = '';
//   password: string = '';

//   constructor(private router: Router) {}

//   login() {
//     // const validUser = 'admin';
//     const validUser = ['admin', 'karim.atigui@zum-it.com', 'admin1'];
//     const validPasswords = ['123456', '123456', 'pass123']; // ✅ add more valid passwords here

//     // if (this.username === validUser && validPasswords.includes(this.password)) {
//     if (
//       validUser.includes(this.username) &&
//       validPasswords.includes(this.password)
//     ) {
//       this.router.navigate(['/dashboard']);
//     } else {
//       alert('Invalid username or password');
//     }
//   }
// }

// old codeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee

import { NgStyle, NgIf } from '@angular/common';
import { IconDirective } from '@coreui/icons-angular';
import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserApiService } from '../../../services/user-get-API/api-user-get.service';
import { setAuthSession } from '../../../utils/auth-storage';
import { getDeviceId } from '../../../utils/device-identity';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language/language.service';

import {
  ContainerComponent,
  RowComponent,
  ColComponent,
  CardGroupComponent,
  TextColorDirective,
  CardComponent,
  CardBodyComponent,
  FormDirective,
  InputGroupComponent,
  InputGroupTextDirective,
  FormControlDirective,
  ButtonDirective,
} from '@coreui/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [UserApiService],
  standalone: true,
  imports: [
    FormsModule,
    NgStyle,
    NgIf,
    RouterLink,
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardGroupComponent,
    TextColorDirective,
    CardComponent,
    CardBodyComponent,
    FormDirective,
    InputGroupComponent,
    InputGroupTextDirective,
    IconDirective,
    FormControlDirective,
    ButtonDirective,
    TranslateModule,
  ],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  users: any[] = [];

  // Custom modal state
  errorModalVisible: boolean = false;
  errorModalTitle: string = 'Error';
  errorModalMessage: string = '';

  constructor(
    private UserApiService: UserApiService,
    private router: Router,
    private languageService: LanguageService,
  ) {}

  fetchUsers(): void {
    this.UserApiService.getData().subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (err) => {
        console.error('Error fetching users:', err);
      },
    });
  }

  showError(message: string, title: string = 'Error'): void {
    this.errorModalTitle = title;
    this.errorModalMessage = message;
    this.errorModalVisible = true;
  }

  closeErrorModal(): void {
    this.errorModalVisible = false;
  }

  login(): void {
    const credentials = {
      username: this.username,
      password: this.password,
      device_id: getDeviceId(),
    };

    this.UserApiService.loginUser(credentials).subscribe({
      next: (response) => {
        console.log('Login success:', response);

        const user = response.user;
        const sessionId = response.session_id;

        let role = (user.role || '').toLowerCase();

        // If the user is Django superuser/staff, force role admin
        if (!role && (user.is_superuser || user.is_staff)) {
          role = 'admin';
        }

        setAuthSession(user, role, sessionId);

        const preferredLanguage =
          user.preferred_language || user.language || 'en';

        this.languageService.applyLanguage(preferredLanguage);

        if (role === 'admin') {
          this.router.navigate(['/admin_dashboard']);
        } else if (role === 'quality') {
          this.router.navigate(['/quality_dashboard']);
        } else if (role === 'supervisor') {
          this.router.navigate(['/supervisor_dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        console.error('Login error:', err);

        const message =
          err.error?.error || 'Something went wrong. Please try again.';

        if (err.error?.account_locked) {
          this.showError(message, 'Account Deactivated');
          return;
        }

        if (err.status === 403) {
          this.showError(message, 'Account Access Blocked');
          return;
        }

        if (err.status === 401 || err.status === 404) {
          this.showError(message, 'Login Failed');
          return;
        }

        this.showError(message, 'Server Error');
      },
    });
  }

  login_Fix(): void {
    const validUser = ['admin', 'karim01atigui@gmail.com', 'admin1', 'mahdi'];
    const validPasswords = ['123456', '123456', 'pass123', 'mahdi'];

    if (
      validUser.includes(this.username) &&
      validPasswords.includes(this.password)
    ) {
      this.router.navigate(['/dashboard']);
    } else {
      this.showError('Invalid username or password', 'Login Failed');
    }
  }
}
