import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Quality',
    },
    children: [
      {
        path: 'nc-list',
        redirectTo: 'nc-list',
        pathMatch: 'full',
      },
      {
        path: 'nc-list',
        loadComponent: () =>
          import('./dashboard/non-conformance.component').then(
            (m) => m.NonConformanceComponent,
          ),
        data: {
          title: 'Non Conformances list',
        },
      },
      {
        path: 'raise-nc',
        loadComponent: () =>
          import('./raise-nc/raise-nc.component').then(
            (m) => m.RaiseNcComponent,
          ),
        data: {
          title: 'Raise Non Conformance',
        },
      },
    ],
  },
];
