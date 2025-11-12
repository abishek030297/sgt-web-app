// src/app/services/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('🚨🚨🚨 AUTH INTERCEPTOR IS BEING CALLED! 🚨🚨🚨');
  console.log('📡 Intercepting request to:', req.url);
  
  const authService = inject(AuthService);
  const authToken = authService.getToken();
  console.log('🔑 Token available:', !!authToken);

  if (authToken) {
    console.log('✅ Adding Authorization header with token');
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log('📋 Final headers:', authReq.headers.keys());
    return next(authReq);
  }

  console.log('❌ No token available, proceeding without Authorization header');
  return next(req);
};