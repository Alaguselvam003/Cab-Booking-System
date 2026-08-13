import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [RouterLink, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
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

  constructor(private authService: AuthService, private router: Router) {}
  
  register() {
    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        console.log('Registration successful', response);
        this.message = 'Registration successful! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (error) => {
        console.log('Registration failed', error);
        this.message = 'Registration failed! ' + (error.error || error.message || '');
      }
    });
  }
}
