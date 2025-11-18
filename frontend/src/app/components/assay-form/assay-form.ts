import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService, Customer } from '../../services/api.service';
import { PaymentComponent } from '../payment/payment';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-assay-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaymentComponent],
  templateUrl: './assay-form.html',
  styleUrls: ['./assay-form.css']
})
export class AssayFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  assayForm: FormGroup;
  customers: Customer[] = [];
  loading = false;
  successMessage = '';
  qrCodeUrl: string = '';
  generatedReportId: number | null = null;
  showPayment = false;
  paymentAmount = 0;
  selectedCustomerId: number | null = null;

  constructor() {
    this.assayForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.setDefaultDate();

    // Check if we're editing an existing report
    this.route.queryParams.subscribe(params => {
      if (params['edit']) {
        this.loadReportForEdit(params['edit']);
      }
    });
  }

  loadReportForEdit(reportId: number): void {
    this.apiService.getReportById(reportId).subscribe({
      next: (report) => {
        this.assayForm.patchValue({
          customer_id: report.customer_id,
          metal_type: report.metal_type,
          fineness: report.fineness,
          weight: report.weight,
          serial_no: report.serial_no,
          assay_date: report.assay_date,
          notes: report.notes
        });
        this.generatedReportId = report.id;
        this.successMessage = 'Editing existing report';
      },
      error: (error) => {
        console.error('Error loading report for edit:', error);
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      customer_id: ['', Validators.required],
      metal_type: ['Gold', Validators.required],
      fineness: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      weight: ['', Validators.required],
      serial_no: ['', Validators.required],
      assay_date: ['', Validators.required],
      notes: ['']
    });
  }

  loadCustomers(): void {
    this.apiService.getCustomers().subscribe({
      next: (customers: Customer[]) => {
        this.customers = customers;
      },
      error: (error: any) => {
        console.error('Error loading customers:', error);
      }
    });
  }

  setDefaultDate(): void {
    const today = new Date().toISOString().split('T')[0];
    this.assayForm.patchValue({ assay_date: today });
  }

  // Update onSubmit to handle both create and update
  onSubmit(): void {
    if (this.assayForm.valid) {
      this.loading = true;
      
      const formData = this.assayForm.value;
      
      const apiCall = this.generatedReportId
        ? this.apiService.updateReport(this.generatedReportId, formData)
        : this.apiService.createReport(formData);

      apiCall.subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = response.message;
          this.generatedReportId = response.report.id;
          this.selectedCustomerId = formData.customer_id;
          this.generateQRCode(response.report.id);
          
          // Show payment component after successful report creation
          this.showPayment = true;
          // Set payment amount (you can customize this based on your pricing)
          this.paymentAmount = 50; // $50 or ₹50 for assay service
          
          if (!this.generatedReportId) {
            // Clear form after successful creation (not edit)
            this.assayForm.reset();
            this.setDefaultDate();
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error saving report:', error);
          this.successMessage = 'Error saving report. Please try again.';
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  async generateQRCode(reportId: number): Promise<void> {
    try {
      const reportUrl = `${window.location.origin}/report-view/${reportId}`;
      this.qrCodeUrl = await QRCode.toDataURL(reportUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }) as any;
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }

  generateSerialNo(): void {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    const serialNo = `GA-${timestamp}-${random}`;
    this.assayForm.patchValue({ serial_no: serialNo });
  }

  getCustomerName(customerId: number): string {
    const customer = this.customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Customer';
  }

  markFormGroupTouched(): void {
    Object.keys(this.assayForm.controls).forEach(key => {
      const control = this.assayForm.get(key);
      control?.markAsTouched();
    });
  }

  downloadQRCode(): void {
    if (this.qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `assay-report-${this.generatedReportId}-qrcode.png`;
      link.href = this.qrCodeUrl;
      link.click();
    }
  }

  printReport(): void {
    window.print();
  }

  resetForm(): void {
    this.assayForm.reset();
    this.setDefaultDate();
    this.assayForm.patchValue({ metal_type: 'Gold' });
    this.qrCodeUrl = '';
    this.successMessage = '';
    this.generatedReportId = null;
    this.showPayment = false;
  }

  onPaymentSuccess(): void {
    console.log('Payment completed successfully for report:', this.generatedReportId);
    // Handle post-payment actions here
    // You can navigate, show confirmation, etc.
  }
}