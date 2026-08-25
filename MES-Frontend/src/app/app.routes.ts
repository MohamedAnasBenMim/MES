import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './layout';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  {
    path: '',
    component: DefaultLayoutComponent,
    data: {
      title: 'Home',
    },
    children: [
{
  path: 'dashboard',
  loadComponent: () =>
    import('./views/dashboard-operator/dashboard.component').then(
      (m) => m.DashboardComponent
    ),
  data: {
    title: 'Operator Dashboard',
  },
},

      {
        path: 'admin_dashboard',
        loadChildren: () =>
          import('./views/dashboard-admin/routes').then((m) => m.routes),
      },

      {
        path: 'quality_dashboard',
        loadChildren: () =>
          import('./views/dashboard-quality/routes').then((m) => m.routes),
      },

      {
        path: 'supervisor_dashboard',
        loadChildren: () =>
          import('./views/dashboard-supervisor/routes').then((m) => m.routes),
      },

      {
        path: 'manufacturing',
        loadChildren: () =>
          import('./views/manufacturing/routes').then((m) => m.routes),
      },

      {
        path: 'non-conformance',
        loadChildren: () =>
          import('./views/non-conformance/routes').then((m) => m.routes),
      },

      {
        path: 'warehousing',
        loadChildren: () =>
          import('./views/warehousing/routes').then((m) => m.routes),
      },

      {
        path: 'masterdata',
        loadChildren: () =>
          import('./views/masterdata/routes').then((m) => m.routes),
      },

      {
        path: 'pages',
        loadChildren: () =>
          import('./views/pages/routes').then((m) => m.routes),
      },

      {
        path: 'admin',
        loadChildren: () =>
          import('./views/admin/routes').then((m) => m.routes),
      },


      {
        path: 'settings',
        loadComponent: () =>
          import('./views/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
        data: { title: 'Settings' },
      },

      {
        path: 'edit_profile',
        loadComponent: () =>
          import('./views/pages/edit_profile/edit_profile.component').then(
            (m) => m.edit_profileComponent
          ),
        data: {
          title: 'Edit profile',
        },
      },
    ],
  },

  {
    path: '404',
    loadComponent: () =>
      import('./views/pages/page404/page404.component').then(
        (m) => m.Page404Component
      ),
    data: {
      title: 'Page 404',
    },
  },

  {
    path: '500',
    loadComponent: () =>
      import('./views/pages/page500/page500.component').then(
        (m) => m.Page500Component
      ),
    data: {
      title: 'Page 500',
    },
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./views/pages/login/login.component').then(
        (m) => m.LoginComponent
      ),
    data: {
      title: 'Login Page',
    },
  },

  {
    path: 'forget-password',
    loadComponent: () =>
      import('./views/pages/forget-password/forget-password.component').then(
        (m) => m.ForgetPasswordComponent
      ),
    data: {
      title: 'Forget Password',
    },
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./views/pages/register/register.component').then(
        (m) => m.RegisterComponent
      ),
    data: {
      title: 'Register Page',
    },
  },

  {
    path: '**',
    redirectTo: '404',
  },
];