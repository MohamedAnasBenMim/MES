import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./quality-dashboard.component').then(
        (m) => m.QualityDashboardComponent
      ),
    data: {
      title: `Dashboard`,
    },
  },
];
