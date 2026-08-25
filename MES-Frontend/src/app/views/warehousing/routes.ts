import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Warehousing',
    },
    children: [
      {
        path: '',
        redirectTo: 'inventory-list',
        pathMatch: 'full',
      },
      {
        path: 'inventory-list',
        loadComponent: () =>
          import('./inventory/inventory-list.component').then(
            (m) => m.inventoryListComponent
          ),
        data: {
          title: 'Stock Point Inventory',
        },
      },
      {
        path: 'warehouses',
        loadComponent: () =>
          import('./warehouses/warehouses.component').then(
            (m) => m.WarehousesComponent
          ),
        data: {
          title: 'Warehouses',
        },
      },
    ],
  },
];