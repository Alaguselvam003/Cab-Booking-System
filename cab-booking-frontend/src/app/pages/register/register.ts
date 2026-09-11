import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent implements OnInit {
  selectedCountryCode = '+91';
  
  countryCodes = [
    { code: '+91', label: '+91 (India)', flag: '🇮🇳' },
    { code: '+1', label: '+1 (US/Canada)', flag: '🇺🇸' },
    { code: '+44', label: '+44 (UK)', flag: '🇬🇧' },
    { code: '+971', label: '+971 (UAE)', flag: '🇦🇪' },
    { code: '+61', label: '+61 (Australia)', flag: '🇦🇺' },
    { code: '+65', label: '+65 (Singapore)', flag: '🇸🇬' },
    { code: '+49', label: '+49 (Germany)', flag: '🇩🇪' },
    { code: '+33', label: '+33 (France)', flag: '🇫🇷' },
    { code: '+81', label: '+81 (Japan)', flag: '🇯🇵' }
  ];

  registerData = {
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user',
    licensenumber: null,
    vehicleType: 'Sedan',
    numberplate: '',
    capacity: 4
  };
  
  message = '';
  loading = false;

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
  
  register() {
    if (!this.registerData.email || !this.registerData.email.toLowerCase().endsWith('@gmail.com')) {
      this.message = 'Registration failed! Email must end with @gmail.com';
      return;
    }

    const phoneStr = String(this.registerData.phone).trim();
    if (!/^\d{10}$/.test(phoneStr)) {
      this.message = 'Registration failed! Phone number must contain exactly 10 digits.';
      return;
    }

    const password = this.registerData.password;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_+\-\[\]\\\/]/.test(password);
    if (!password || password.length < 6 || !hasSpecialChar) {
      this.message = 'Registration failed! Password must be at least 6 characters and contain at least one special character.';
      return;
    }

    this.loading = true;
    this.message = '';

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Registration successful', response);
        this.message = 'Registration successful! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (error) => {
        this.loading = false;
        console.log('Registration failed', error);
        this.message = 'Registration failed! ' + (error.error || error.message || 'Please check your inputs.');
      }
    });
  }
}
