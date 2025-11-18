import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../services/payment.service';

interface PurchaseRecord {
  id: string;
  paymentId?: string;
  reportId?: number;
  customerId?: number;
  customerName?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'razorpay';
  description?: string;
  createdAt: string;
  refundId?: string;
  refundedAmount?: number;
}

@Component({
  selector: 'app-purchase-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-history.html',
  styleUrls: ['./purchase-history.css']
})
export class PurchaseHistoryComponent implements OnInit {
  private paymentService = inject(PaymentService);

  purchaseHistory: PurchaseRecord[] = [];
  filteredHistory: PurchaseRecord[] = [];
  loading = false;
  error = '';
  successMessage = '';

  filterStatus: 'all' | 'succeeded' | 'failed' | 'pending' | 'refunded' = 'all';
  filterMethod: 'all' | 'stripe' | 'razorpay' = 'all';
  searchQuery = '';

  totalRevenue = 0;
  totalRefunded = 0;
  successfulPayments = 0;
  failedPayments = 0;

  ngOnInit(): void {
    this.loadPurchaseHistory();
  }

  loadPurchaseHistory(): void {
    this.loading = true;
    this.error = '';

    this.paymentService.getPaymentHistory().subscribe({
      next: (payments: any[]) => {
        this.purchaseHistory = payments.map(p => ({
          id: p.id || p.paymentId || '',
          paymentId: p.paymentId || p.id,
          reportId: p.reportId,
          customerId: p.customerId,
          customerName: p.customerName || 'Unknown',
          amount: p.amount,
          currency: p.currency || 'USD',
          status: p.status || 'pending',
          paymentMethod: p.paymentMethod || p.gateway || 'stripe',
          description: p.description,
          createdAt: p.createdAt,
          refundId: p.refundId,
          refundedAmount: p.refundedAmount || 0
        }));

        this.calculateStats();
        this.applyFilters();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading purchase history:', error);
        this.error = 'Failed to load purchase history. Please try again.';
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.totalRevenue = this.purchaseHistory
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount, 0);

    this.totalRefunded = this.purchaseHistory
      .filter(p => p.status === 'refunded')
      .reduce((sum, p) => sum + (p.refundedAmount || 0), 0);

    this.successfulPayments = this.purchaseHistory.filter(p => p.status === 'succeeded').length;
    this.failedPayments = this.purchaseHistory.filter(p => p.status === 'failed').length;
  }

  applyFilters(): void {
    this.filteredHistory = this.purchaseHistory.filter(record => {
      if (this.filterStatus !== 'all' && record.status !== this.filterStatus) {
        return false;
      }

      if (this.filterMethod !== 'all' && record.paymentMethod !== this.filterMethod) {
        return false;
      }

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        return (
          record.customerName?.toLowerCase().includes(query) ||
          record.paymentId?.toLowerCase().includes(query)
        );
      }

      return true;
    });

    this.filteredHistory.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'succeeded':
        return 'badge-success';
      case 'failed':
        return 'badge-danger';
      case 'refunded':
        return 'badge-warning';
      case 'pending':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'succeeded':
        return 'fa-check-circle';
      case 'failed':
        return 'fa-times-circle';
      case 'refunded':
        return 'fa-undo';
      case 'pending':
        return 'fa-hourglass-half';
      default:
        return 'fa-circle';
    }
  }

  getMethodBadge(method: string): string {
    return method === 'stripe' ? 'badge-primary' : 'badge-danger';
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  }

  refundPayment(payment: PurchaseRecord): void {
    if (payment.status === 'refunded') {
      alert('This payment has already been refunded');
      return;
    }

    if (confirm(`Refund ${this.formatCurrency(payment.amount, payment.currency)}?`)) {
      this.paymentService.refundPayment(payment.id).subscribe({
        next: () => {
          this.successMessage = 'Refund processed successfully!';
          this.loadPurchaseHistory();
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error: any) => {
          console.error('Refund error:', error);
          this.error = 'Failed to process refund. Please try again.';
        }
      });
    }
  }
}
