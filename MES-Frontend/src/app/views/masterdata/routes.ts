import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Master Data',
    },
    children: [
      {
        path: 'product',
        loadComponent: () =>
          import('./product/product.component').then((m) => m.ProductComponent),
        data: {
          title: 'Products',
        },
      },
    ],
  },
];
