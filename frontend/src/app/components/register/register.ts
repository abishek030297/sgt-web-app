import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  userData = {
    username: '',
    email: '',
    password: '',
    full_name: ''
  };
  loading = false;
  error = '';
  success = '';

  register(): void {
    if (!this.userData.username || !this.userData.email || !this.userData.password || !this.userData.full_name) {
      this.error = 'All fields are required';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.register(this.userData).subscribe({
      next: (response: any) => {
        this.success = 'Registration successful! Redirecting...';
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (error: any) => {
        this.error = error.error?.error || 'Registration failed';
        this.loading = false;
      }
    });
  }
}