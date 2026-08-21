import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  loginData = {
    email: '',
    password: ''
  };
  message = '';

  isForgotPasswordMode = false;
  forgotPasswordData = {
    email: '',
    phone: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user && user.role) {
          if (user.role === 'driver') {
            this.router.navigate(['/driver/dashboard']);
          } else {
            this.router.navigate(['/passenger/dashboard']);
          }
        }
      } catch (e) {
        console.error('Error restoring session:', e);
      }
    }
  }

  login() {
    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        console.log('Login successful', response);
        this.message = 'Login successful! Redirecting...';
        localStorage.setItem('currentUser', JSON.stringify(response));

        setTimeout(() => {
          if (response.role === 'driver') {
            this.router.navigate(['/driver/dashboard']);
          } else {
            this.router.navigate(['/passenger/dashboard']);
          }
        }, 1000);
      },
      error: (error) => {
        console.log('Login failed', error);
        this.message = 'Login failed! Invalid credentials.';
      }
    });
  }

  toggleForgotPassword(mode: boolean) {
    this.isForgotPasswordMode = mode;
    this.message = '';
    this.forgotPasswordData = {
      email: '',
      phone: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  resetPassword() {
    if (!this.forgotPasswordData.email || !this.forgotPasswordData.email.toLowerCase().endsWith('@gmail.com')) {
      this.message = 'Reset failed! Email must end with @gmail.com';
      return;
    }

    const phoneStr = String(this.forgotPasswordData.phone);
    if (!/^\d{10}$/.test(phoneStr)) {
      this.message = 'Reset failed! Phone number must contain exactly 10 digits.';
      return;
    }

    const newPassword = this.forgotPasswordData.newPassword;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_+\-\[\]\\\/]/.test(newPassword);
    if (!newPassword || newPassword.length < 6 || !hasSpecialChar) {
      this.message = 'Reset failed! New password must be at least 6 characters and contain at least one special character.';
      return;
    }

    if (newPassword !== this.forgotPasswordData.confirmPassword) {
      this.message = 'Reset failed! Passwords do not match.';
      return;
    }

    const payload = {
      email: this.forgotPasswordData.email,
      phone: Number(this.forgotPasswordData.phone),
      newPassword: newPassword
    };

    this.authService.forgotPassword(payload).subscribe({
      next: (response) => {
        console.log('Password reset successful', response);
        this.message = 'Password reset successful! You can login now.';
        setTimeout(() => {
          this.toggleForgotPassword(false);
        }, 2000);
      },
      error: (error) => {
        console.log('Password reset failed', error);
        this.message = 'Reset failed! ' + (error.error || error.message || 'Verification details incorrect.');
      }
    });
  }
}
