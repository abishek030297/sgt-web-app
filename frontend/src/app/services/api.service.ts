import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  id_type: string;
  id_number: string;
  created_at: string;
}

export interface AssayReport {
  id: number;
  customer_id: number;
  customer_name: string;
  metal_type: string;
  fineness: number;
  weight: string;
  serial_no: string;
  assay_date: string;
  notes: string;
  created_at: string;
}

export interface DashboardStats {
  totalReports: number;
  totalCustomers: number;
  recentReports: AssayReport[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    // Customer methods
    getCustomers(): Observable<Customer[]> {
        return this.http.get<Customer[]>(`${this.apiUrl}/customers`);
    }

    createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Observable<any> {
        return this.http.post(`${this.apiUrl}/customers`, customer);
    }

    // Assay Report methods
    getReports(): Observable<AssayReport[]> {
        return this.http.get<AssayReport[]>(`${this.apiUrl}/reports`);
    }

    getReportById(id: number): Observable<AssayReport> {
        return this.http.get<AssayReport>(`${this.apiUrl}/reports/${id}`);
    }

    createReport(report: Omit<AssayReport, 'id' | 'created_at' | 'customer_name'>): Observable<any> {
        return this.http.post(`${this.apiUrl}/reports`, report);
    }

    // Dashboard methods
    getDashboardStats(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
    }

    // Customer methods
    getCustomerById(id: number): Observable<Customer> {
        return this.http.get<Customer>(`${this.apiUrl}/customers/${id}`);
    }

    updateCustomer(id: number, customer: Partial<Customer>): Observable<any> {
        return this.http.put(`${this.apiUrl}/customers/${id}`, customer);
    }

    deleteCustomer(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/customers/${id}`);
    }

    updateReport(id: number, report: Partial<AssayReport>): Observable<any> {
        return this.http.put(`${this.apiUrl}/reports/${id}`, report);
    }

    deleteReport(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/reports/${id}`);
    }
}