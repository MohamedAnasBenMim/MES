// import { Routes } from '@angular/router';

// export const routes: Routes = [
//   {
//     path: '',
//     data: {
//       title: 'admin',
//     },
//     children: [
//       {
//         path: 'config',
//         loadComponent: () =>
//           import('./config/config.component').then((m) => m.ConfigComponent),
//         data: {
//           title: 'config',
//         },
//       },
//       {
//         path: 'users',
//         loadComponent: () =>
//           import('./users/users.component').then((m) => m.UsersComponent),
//         data: {
//           title: 'users',
//         },
//       },
//     ],
//   },
// ];
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'admin',
    },
    children: [
      {
        path: 'config',
        loadComponent: () =>
          import('./config/config.component').then((m) => m.ConfigComponent),
        data: { title: 'Config' },
      },

      {
        path: 'idm-configuration',
        loadComponent: () =>
          import('./idm-configuration/idm-configuration.component').then((m) => m.IdmConfigurationComponent),
        data: { title: 'IDM Configuration' },
      },


      {
        path: 'log',
        loadComponent: () =>
          import('./log/log.component').then((m) => m.LogComponent),
        data: { title: 'Log' },
      },


      {
        path: 'mes-devices',
        loadComponent: () =>
          import('./mes-devices/mes-devices.component').then(
            (m) => m.MesDevicesComponent
          ),
        data: { title: 'MES Devices' },
      },



      {
        path: 'users',
        loadComponent: () =>
          import('./users/users.component').then((m) => m.UsersComponent),
        data: { title: 'Users' },
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./register/register.component').then(
            (m) => m.RegisterComponent
          ),
        data: { title: 'Register' },
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./roles/roles.component').then((m) => m.RolesComponent),
        data: { title: 'Roles' },
      },
      {
        path: 'documentation',
        loadComponent: () =>
          import('./documentation/documentation.component').then(
            (m) => m.DocumentationComponent
          ),
        data: { title: 'Documentation' },
      },
    ],
  },
];
