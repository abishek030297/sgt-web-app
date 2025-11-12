import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
}

interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    console.log('🔐 Auth Service Initialized');
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('🔄 Initializing auth from localStorage:');
    console.log('   Token exists:', !!token);
    console.log('   User exists:', !!user);

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        this.currentUserSubject.next(userData);
        console.log('✅ Restored user from localStorage:', userData.username);
      } catch (error) {
        console.error('❌ Error parsing stored user data:', error);
        this.clearAuthData();
      }
    }
  }

  login(username: string, password: string): Observable<AuthResponse> {
    console.log('🔐 Attempting login for user:', username);
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          console.log('✅ Login successful:', response.message);
          console.log('📝 Token received:', response.token ? 'Yes' : 'No');
          console.log('👤 User data:', response.user);
          
          this.setAuthData(response.token, response.user);
          this.router.navigate(['/dashboard']);
        }),
        catchError(error => {
          console.error('❌ Login error:', error);
          return throwError(() => error);
        })
      );
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => {
          console.log('✅ Registration successful');
          this.setAuthData(response.token, response.user);
          this.router.navigate(['/dashboard']);
        }),
        catchError(error => {
          console.error('❌ Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  private setAuthData(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
    
    console.log('💾 Auth data saved to localStorage');
    console.log('   Token length:', token.length);
    console.log('   User:', user.username);
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    console.log('🗑️ Auth data cleared from localStorage');
  }

  logout(): void {
    console.log('👋 Logging out user');
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token;
    console.log('🔍 Login check - Logged in:', isLoggedIn);
    return isLoggedIn;
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    console.log('🔑 Token retrieval - Token exists:', !!token);
    return token;
  }

  // Debug method to check auth status
  debugAuthStatus(): void {
    console.log('🐛 DEBUG AUTH STATUS:');
    console.log('   localStorage token:', localStorage.getItem('token'));
    console.log('   localStorage user:', localStorage.getItem('user'));
    console.log('   Current user subject:', this.currentUserSubject.value);
    console.log('   Is logged in:', this.isLoggedIn());
  }
}