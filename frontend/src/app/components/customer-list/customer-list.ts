import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Customer } from '../../services/api.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-list.html',
  styleUrls: ['./customer-list.css']
})
export class CustomerListComponent implements OnInit {
  private apiService = inject(ApiService);
  
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  loading = true;
  showAddForm = false;
  newCustomer: any = {};
  editingCustomer: Customer | null = null;
  customerFormData: any = {};
  message = '';
  messageType: 'success' | 'error' = 'success';

  // Filter properties
  searchQuery = '';
  sortBy: 'name' | 'phone' | 'email' | 'date' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.apiService.getCustomers(this.searchQuery, this.sortBy, this.sortOrder).subscribe({
      next: (customers: Customer[]) => {
        this.customers = customers;
        this.applyFiltersAndSort();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading customers:', error);
        this.loading = false;
      }
    });
  }

  applyFiltersAndSort(): void {
    // Server-side filtering and sorting already applied
    // Just use the data directly
    this.filteredCustomers = [...this.customers];
  }

  onSearchChange(): void {
    this.loadCustomers();
  }

  onSortChange(): void {
    this.loadCustomers();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.loadCustomers();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.sortBy = 'name';
    this.sortOrder = 'asc';
    this.loadCustomers();
  }

  saveCustomer(): void {
    if (!this.customerFormData.name) {
      this.showMessage('Customer name is required', 'error');
      return;
    }

    const saveObservable = this.editingCustomer
      ? this.apiService.updateCustomer(this.editingCustomer.id, this.customerFormData)
      : this.apiService.createCustomer(this.customerFormData);

    saveObservable.subscribe({
      next: (response) => {
        this.showMessage(response.message, 'success');
        this.loadCustomers();
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error saving customer:', error);
        this.showMessage(error.error?.error || 'Error saving customer', 'error');
      }
    });
  }

  editCustomer(customer: Customer): void {
    this.editingCustomer = customer;
    this.customerFormData = { ...customer };
    this.showAddForm = false;
  }

  deleteCustomer(customerId: number): void {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      this.apiService.deleteCustomer(customerId).subscribe({
        next: (response) => {
          this.showMessage(response.message, 'success');
          this.loadCustomers();
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.showMessage(error.error?.error || 'Error deleting customer', 'error');
        }
      });
    }
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.newCustomer = {};
    }
  }

  cancelEdit(): void {
    this.showAddForm = false;
    this.editingCustomer = null;
    this.customerFormData = {};
    this.message = '';
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
}