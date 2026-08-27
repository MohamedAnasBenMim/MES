import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./supervisor-dashboard.component').then(
        (m) => m.SupervisorDashboardComponent,
      ),
    data: {
      title: `Dashboard`,
    },
  },
];
