import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { DashboardComponent } from './components/dashboard/dashboard';
import { CustomerListComponent } from './components/customer-list/customer-list';
import { AssayFormComponent } from './components/assay-form/assay-form';
import { ReportListComponent } from './components/report-list/report-list';
import { ReportViewComponent } from './components/report-view/report-view';
import { PurchaseHistoryComponent } from './components/purchase-history/purchase-history';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'customers', component: CustomerListComponent, canActivate: [AuthGuard] },
  { path: 'assay-form', component: AssayFormComponent, canActivate: [AuthGuard] },
  { path: 'reports', component: ReportListComponent, canActivate: [AuthGuard] },
  { path: 'purchase-history', component: PurchaseHistoryComponent, canActivate: [AuthGuard] },
  { path: 'report-view/:id', component: ReportViewComponent },
  { path: '**', redirectTo: '/dashboard' }
];