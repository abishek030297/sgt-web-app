import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  customerId: number;
  reportId?: number;
  paymentMethod: 'stripe' | 'razorpay';
}

export interface PaymentResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customerId: number;
  reportId?: number;
  createdAt: string;
}

export interface StripeIntent {
  clientSecret: string;
  paymentIntentId: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Initialize Stripe Payment Intent
  createStripePaymentIntent(request: PaymentRequest): Observable<StripeIntent> {
    return this.http.post<StripeIntent>(
      `${this.apiUrl}/payments/stripe/create-intent`,
      request
    );
  }

  // Confirm Stripe Payment
  confirmStripePayment(paymentIntentId: string, paymentMethodId: string): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(
      `${this.apiUrl}/payments/stripe/confirm`,
      { paymentIntentId, paymentMethodId }
    );
  }

  // Create Razorpay Order
  createRazorpayOrder(request: PaymentRequest): Observable<RazorpayOrder> {
    return this.http.post<RazorpayOrder>(
      `${this.apiUrl}/payments/razorpay/create-order`,
      request
    );
  }

  // Verify Razorpay Payment
  verifyRazorpayPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(
      `${this.apiUrl}/payments/razorpay/verify`,
      { orderId, paymentId, signature }
    );
  }

  // Get Payment History
  getPaymentHistory(): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.apiUrl}/payments/history`);
  }

  // Get Payment by ID
  getPayment(paymentId: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.apiUrl}/payments/${paymentId}`);
  }

  // Get Stripe Public Key
  getStripePublicKey(): Observable<{ publicKey: string }> {
    return this.http.get<{ publicKey: string }>(`${this.apiUrl}/payments/stripe/public-key`);
  }

  // Get Razorpay Key ID
  getRazorpayKeyId(): Observable<{ keyId: string }> {
    return this.http.get<{ keyId: string }>(`${this.apiUrl}/payments/razorpay/key-id`);
  }

  // Refund Payment
  refundPayment(paymentId: string, amount?: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/payments/${paymentId}/refund`,
      { amount }
    );
  }
}
