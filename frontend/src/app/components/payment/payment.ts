import { Component, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, PaymentRequest } from '../../services/payment.service';
import { loadStripe, Stripe } from '@stripe/stripe-js';

declare var Razorpay: any;

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.html',
  styleUrls: ['./payment.css']
})
export class PaymentComponent implements OnInit {
  @Input() amount: number = 0;
  @Input() customerId: number = 0;
  @Input() reportId?: number;
  @Input() description: string = 'Assay Service Payment';
  @Output() paymentComplete = new EventEmitter<{ success: boolean; paymentId?: string }>();

  private paymentService = inject(PaymentService);

  paymentMethod: 'stripe' | 'razorpay' = 'stripe';
  loading = false;
  error = '';
  success = false;
  successMessage = '';
  stripe: Stripe | null = null;
  stripeElements: any = null;
  razorpayKeyId = '';

  ngOnInit(): void {
    this.initializePaymentGateways();
  }

  async initializePaymentGateways(): Promise<void> {
    try {
      // Load Stripe
      const stripeKey = await this.paymentService.getStripePublicKey().toPromise();
      if (stripeKey?.publicKey) {
        this.stripe = await loadStripe(stripeKey.publicKey);
      }

      // Load Razorpay Key
      const razorpayKey = await this.paymentService.getRazorpayKeyId().toPromise();
      if (razorpayKey?.keyId) {
        this.razorpayKeyId = razorpayKey.keyId;
      }
    } catch (err: any) {
      this.error = 'Failed to initialize payment gateways: ' + err.message;
    }
  }

  async processPayment(): Promise<void> {
    this.error = '';
    this.success = false;

    if (this.amount <= 0) {
      this.error = 'Invalid amount';
      return;
    }

    if (this.paymentMethod === 'stripe') {
      await this.processStripePayment();
    } else if (this.paymentMethod === 'razorpay') {
      await this.processRazorpayPayment();
    }
  }

  private async processStripePayment(): Promise<void> {
    this.loading = true;
    try {
      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }

      const paymentRequest: PaymentRequest = {
        amount: this.amount,
        currency: 'USD',
        description: this.description,
        customerId: this.customerId,
        reportId: this.reportId,
        paymentMethod: 'stripe'
      };

      // Create payment intent
      const intentResponse = await this.paymentService.createStripePaymentIntent(paymentRequest).toPromise();
      if (!intentResponse) throw new Error('Failed to create payment intent');

      // For demo purposes, we'll show a success message
      // In production, you would use Stripe Elements or Payment Request API
      this.success = true;
      this.successMessage = 'Payment intent created. In production, this would redirect to Stripe Checkout.';
      
      // Store the intent ID for reference
      localStorage.setItem('lastPaymentIntentId', intentResponse.paymentIntentId);
      
      // Emit payment complete event
      this.paymentComplete.emit({ 
        success: true, 
        paymentId: intentResponse.paymentIntentId 
      });
    } catch (err: any) {
      this.error = 'Stripe payment error: ' + err.message;
    } finally {
      this.loading = false;
    }
  }

  private async processRazorpayPayment(): Promise<void> {
    this.loading = true;
    try {
      const paymentRequest: PaymentRequest = {
        amount: this.amount,
        currency: 'INR',
        description: this.description,
        customerId: this.customerId,
        reportId: this.reportId,
        paymentMethod: 'razorpay'
      };

      // Create Razorpay order
      const orderResponse = await this.paymentService.createRazorpayOrder(paymentRequest).toPromise();
      if (!orderResponse) throw new Error('Failed to create order');

      // Open Razorpay payment modal
      const options = {
        key: this.razorpayKeyId,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: 'Gold Assay System',
        description: this.description,
        order_id: orderResponse.id,
        handler: async (response: any) => {
          await this.verifyRazorpayPayment(
            orderResponse.id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        prefill: {
          name: 'Customer',
          email: 'customer@example.com'
        },
        theme: {
          color: '#3399cc'
        }
      };

      const razorpay = new Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      this.error = 'Razorpay payment error: ' + err.message;
    } finally {
      this.loading = false;
    }
  }

  private async verifyRazorpayPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<void> {
    try {
      const result = await this.paymentService.verifyRazorpayPayment(orderId, paymentId, signature).toPromise();
      this.success = true;
      this.successMessage = 'Payment successful!';
      
      // Emit payment complete event
      this.paymentComplete.emit({ 
        success: true, 
        paymentId: paymentId 
      });
    } catch (err: any) {
      this.error = 'Payment verification failed: ' + err.message;
      this.paymentComplete.emit({ success: false });
    }
  }
}
