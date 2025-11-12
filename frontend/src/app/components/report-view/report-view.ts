import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService, AssayReport } from '../../services/api.service';

@Component({
  selector: 'app-report-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-view.html',
  styleUrls: ['./report-view.css']
})
export class ReportViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  
  report: AssayReport | null = null;
  loading = true;
  error = '';

  ngOnInit(): void {
    const reportId = this.route.snapshot.paramMap.get('id');
    if (reportId) {
      this.loadReport(parseInt(reportId));
    } else {
      this.error = 'Report ID not provided';
      this.loading = false;
    }
  }

  loadReport(id: number): void {
    this.apiService.getReportById(id).subscribe({
      next: (report: AssayReport) => {
        this.report = report;
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Report not found or access denied';
        this.loading = false;
      }
    });
  }

  printReport(): void {
    window.print();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB').replace(/\//g, '.');
  }
}