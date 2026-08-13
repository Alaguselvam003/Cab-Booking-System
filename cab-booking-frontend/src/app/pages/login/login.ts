import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  loginData = {
    email: '',
    password: ''
  };
  message = '';

  constructor(private authService: AuthService, private router: Router) {}

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
}
