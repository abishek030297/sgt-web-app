import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService, PaymentResponse } from '../../services/payment.service';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-history.html',
  styleUrls: ['./payment-history.css']
})
export class PaymentHistoryComponent implements OnInit {
  private paymentService = inject(PaymentService);

  payments: PaymentResponse[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    this.loadPaymentHistory();
  }

  loadPaymentHistory(): void {
    this.loading = true;
    this.paymentService.getPaymentHistory().subscribe({
      next: (data: PaymentResponse[]) => {
        this.payments = data;
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load payment history: ' + error.message;
        this.loading = false;
      }
    });
  }

  refundPayment(paymentId: string, amount?: number): void {
    if (!confirm('Are you sure you want to refund this payment?')) {
      return;
    }

    this.paymentService.refundPayment(paymentId, amount).subscribe({
      next: () => {
        alert('Refund processed successfully');
        this.loadPaymentHistory();
      },
      error: (error: any) => {
        alert('Refund failed: ' + error.message);
      }
    });
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'refunded':
        return 'info';
      case 'failed':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
