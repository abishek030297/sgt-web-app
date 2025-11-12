import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, AssayReport } from '../../services/api.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-report-list',
  standalone: true,
  templateUrl: './report-list.html',
  styleUrls: ['./report-list.css'],
  imports: [DatePipe] 
})
export class ReportListComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  
  reports: AssayReport[] = [];
  loading = true;
  message = '';
  messageType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.apiService.getReports().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        this.loading = false;
      }
    });
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
            </style>
          </head>
          <body>
            <div class="header">
              <h2>SGT</h2>
              <p>On</p>
              <p>Sat</p>
              <h3>Gold Testing</h3>
              <p>R.C Street, Marchandam.</p>
              <h3>ASSAYING REPORT</h3>
            </div>
            <hr>
            <table>
              <thead>
                <tr>
                  <th>Metal</th>
                  <th>Name</th>
                  <th>Fineness%</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${report.metal_type}</td>
                  <td>${report.customer_name}</td>
                  <td>${report.fineness}</td>
                  <td>${report.weight}</td>
                </tr>
              </tbody>
            </table>
            <hr>
            <div style="display: flex; justify-content: space-between;">
              <div><strong>SL No.:</strong> ${report.serial_no}</div>
              <div><strong>Date:</strong> ${new Date(report.assay_date).toLocaleDateString()}</div>
            </div>
            <div class="footer">
              <p>Our Method is Five Assay method as per International Standard.</p>
              <p>Note: We are not responsible for any error in Assaying Results.</p>
            </div>
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