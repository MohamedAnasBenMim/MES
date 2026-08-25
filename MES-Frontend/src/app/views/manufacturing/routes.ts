// import { Routes } from '@angular/router';

// export const routes: Routes = [
//   {
//     path: '',
//     data: {
//       title: 'Manufacturing',
//     },
//     children: [
//       // {
//       //   path: 'dipatch-list',
//       //   redirectTo: 'dispatch-list',
//       //   pathMatch: 'full',
//       // },
//       {
//         path: 'dispatch-list', // fixed from 'dipatch-list'
//         redirectTo: 'dispatch-list',
//         pathMatch: 'full',
//       },

//       {
//         path: 'dispatch-list',
//         loadComponent: () =>
//           import('./dispatch-list/dispatch-list.component').then(
//             (m) => m.DispatchListComponent
//           ),
//         data: {
//           title: 'Dispatch List',
//         },
//       },
//       {
//         path: 'active-list',
//         loadComponent: () =>
//           import('./active-list/active-list.component').then(
//             (m) => m.ActiveListComponent
//           ),
//         data: {
//           title: 'Active List',
//         },
//       },

//       {
//         path: 'operation-execution',
//         loadComponent: () =>
//           import('./operation-execution/operation-execution.component').then(
//             (m) => m.OperationExecutionComponent
//           ),
//         data: {
//           title: 'Operation Execution',
//         },
//       },
//     ],
//   },
// ];
console.log('Loaded Manufacturing routes');

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Manufacturing',
    },
    children: [
      {
        path: 'dispatch-list',
        loadComponent: () =>
          import('./dispatch-list/dispatch-list.component').then(
            (m) => m.DispatchListComponent
          ),
        data: {
          title: 'Dispatch List',
        },
      },
      {
        path: 'active-list',
        loadComponent: () =>
          import('./active-list/active-list.component').then(
            (m) => m.ActiveListComponent
          ),
        data: {
          title: 'Active List',
        },
      },
      {
        path: 'operation-execution',
        loadComponent: () =>
          import('./operation-execution/operation-execution.component').then(
            (m) => m.OperationExecutionComponent
          ),
        data: {
          title: 'Operation Execution',
        },
      },
      {
        path: 'supervisor-assignment-operators',
        loadComponent: () =>
          import('./supervisor-assignment-operators/supervisor-assignment-operators.component').then(
            (m) => m.SupervisorAssignmentOperatorsComponent
          ),
        data: {
          title: 'Supervisor Assignment Operators',
        },
      },
    ],
  },
];
