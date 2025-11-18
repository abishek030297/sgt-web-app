import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, AssayReport } from '../../services/api.service';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-report-list',
  standalone: true,
  templateUrl: './report-list.html',
  styleUrls: ['./report-list.css'],
  imports: [DatePipe, UpperCasePipe, FormsModule] 
})
export class ReportListComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  
  reports: AssayReport[] = [];
  filteredReports: AssayReport[] = [];
  loading = true;
  message = '';
  messageType: 'success' | 'error' = 'success';

  // Filter properties
  searchQuery = '';
  sortBy: 'serial_no' | 'customer_name' | 'metal_type' | 'fineness' | 'weight' | 'assay_date' = 'assay_date';
  sortOrder: 'asc' | 'desc' = 'desc';

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.apiService.getReports(this.searchQuery, this.sortBy, this.sortOrder).subscribe({
      next: (reports) => {
        this.reports = reports;
        this.applyFiltersAndSort();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        this.loading = false;
      }
    });
  }

  applyFiltersAndSort(): void {
    // Server-side filtering and sorting already applied
    // Just use the data directly
    this.filteredReports = [...this.reports];
  }

  onSearchChange(): void {
    this.loadReports();
  }

  onSortChange(): void {
    this.loadReports();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.loadReports();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.sortBy = 'assay_date';
    this.sortOrder = 'desc';
    this.loadReports();
  }

  editReport(report: AssayReport): void {
    // Navigate to assay form with the report ID for editing
    this.router.navigate(['/assay-form'], { 
      queryParams: { edit: report.id } 
    });
  }

  deleteReport(reportId: number): void {
    if (confirm('Are you sure you want to delete this assay report? This action cannot be undone.')) {
      this.apiService.deleteReport(reportId).subscribe({
        next: (response) => {
          this.showMessage(response.message, 'success');
          this.loadReports();
        },
        error: (error) => {
          console.error('Error deleting report:', error);
          this.showMessage(error.error?.error || 'Error deleting report', 'error');
        }
      });
    }
  }

  printReport(report: AssayReport): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Assay Report - ${report.serial_no}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              .footer { margin-top: 50px; font-size: 12px; }
              .d-flex { display: flex; }
              .justify-content-center { justify-content: center; }
              .align-items-center { align-items: center; }
              .flex-column { flex-direction: column; }
              .flex-fill { flex: 1; }
              .text-muted { color: #6c757d; }
              .small { font-size: 0.875em; }
              .text-center { text-align: center; }
              .report-header { padding: 10px 20px; }
              .company-logo { height: 40px; margin-right: 8px; scale: 1.5; }
            </style>
          </head>
          <body>
            <table class="table table-sm table-bordered">
              <thead>
                <tr>
                  <th colspan="4">
                    <div class="d-flex justify-content-center align-items-center report-header">
                      <img src="../../../../../assets/sgt_logo.png" alt="SGT Logo" class="company-logo">
                      <div class="d-flex flex-column flex-fill text-center">
                        <span>Om Sai Gold Testing</span>
                        <span class="text-muted small">RC street, Marthandam</span>
                      </div>
                      <div class="d-flex flex-column">
                        <span>9597699733</span>
                        <span>9487318600</span>
                      </div>
                    </div>
                  </th>
                </tr>
                <tr>
                  <th colspan="4" class="text-center">
                    <span><strong>ASSAYING REPORT</strong></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Metal</strong></td>
                  <td>${report.metal_type}</td>
                  <td><strong>SL No.:</strong></td>
                  <td>${report.serial_no}</td>
                </tr>
                <tr>
                  <td><strong>Name</strong></td>
                  <td>${report.customer_name}</td>
                  <td><strong>Date:</strong></td>
                  <td>${new Date(report.assay_date).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td><strong>Fineness%</strong></td>
                  <td>${report.fineness}</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td><strong>Weight</strong></td>
                  <td>${report.weight}</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td colspan="4" class="small text-muted text-center">Our method is Fire Assay Method as per international standard. Note: We are not responsible forany error in Assaying Results.</td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
}