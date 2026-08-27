import { ICustomNavData } from './custom-nav'; // or adjust path

export const navItems: ICustomNavData[] = [
  {
    name: 'Operator Dashboard',
    url: '/dashboard',
    iconComponent: { name: 'cil-speedometer' },
    roles: ['operator'],
  },

  {
    name: 'Admin Dashboard',
    url: '/admin_dashboard',
    iconComponent: { name: 'cil-speedometer' },
    roles: ['admin'],
  },
  {
    name: 'Quality Dashboard',
    url: '/quality_dashboard',
    iconComponent: { name: 'cil-speedometer' },
    roles: ['quality'],
  },
  {
    name: 'Supervisor Dashboard',
    url: '/supervisor_dashboard',
    iconComponent: { name: 'cil-speedometer' },
    roles: ['supervisor'],
  },

  {
    title: true,
    name: 'Production',
    roles: ['supervisor'],
  },
  {
    name: 'Assignment Operators',
    url: '/manufacturing/supervisor-assignment-operators',
    iconComponent: { name: 'cil-people' },
    roles: ['supervisor'],
  },

  {
    title: true,
    name: 'Manufacturing',
    roles: ['operator'],
  },
  {
    name: 'Dispatch List',
    url: '/manufacturing/dispatch-list',
    iconComponent: { name: 'cil-puzzle' },
    roles: ['operator'],
  },
  {
    name: 'Active List',
    url: '/manufacturing/active-list',
    iconComponent: { name: 'cil-cursor' },
    roles: ['operator'],
  },
  {
    name: 'Quality',
    title: true,
    roles: ['supervisor', 'operator', 'quality'],
  },
  {
    name: 'Non Conformances list',
    url: '/non-conformance/nc-list',
    icon: 'nav-icon-bullet',
    roles: ['supervisor', 'operator', 'quality'],
  },
  {
    name: 'Raise Non-Conformance',
    url: '/non-conformance/raise-nc',
    iconComponent: { name: 'cil-description' },
    roles: ['supervisor', 'operator', 'quality'],
  },
  {
    title: true,
    name: 'Warehousing',
    class: 'mt-auto',
    roles: ['supervisor', 'operator'],
  },
  {
    name: 'Stock Point Inventory',
    url: '/warehousing/inventory-list',
    icon: 'nav-icon-bullet',
    roles: ['supervisor', 'operator'],
  },
  {
    name: 'Warehouses',
    url: '/warehousing/warehouses',
    iconComponent: { name: 'cil-storage' },
    roles: ['supervisor', 'operator'],
  },
  {
    title: true,
    name: 'masterdata',
    class: 'mt-auto',
    roles: ['supervisor', 'operator', 'quality'],
  },
  {
    name: 'Product',
    url: '/masterdata/product',
    iconComponent: { name: 'cil-description' },
    roles: ['supervisor', 'operator', 'quality'],
  },

  {
    title: true,
    name: 'System',
    class: 'mt-auto',
    roles: ['admin'],
  },
  {
    name: 'Config',
    url: '/admin/config',
    iconComponent: { name: 'cil-description' },
    roles: ['admin'],
  },
  {
    name: 'IDM Configuration',
    url: '/admin/idm-configuration',
    iconComponent: { name: 'cil-description' },
    roles: ['admin'],
  },

  {
    name: 'Log',
    url: '/admin/log',
    iconComponent: { name: 'cil-description' },
    roles: ['admin'],
  },

  {
    name: 'MES Devices',
    url: '/admin/mes-devices',
    iconComponent: { name: 'cil-description' },
    roles: ['admin'],
  },

  {
    title: true,
    name: 'Users',
    class: 'mt-auto',
    roles: ['admin'],
  },
  {
    name: 'Users',
    url: '/admin/users',
    iconComponent: { name: 'cil-description' },
    roles: ['admin'],
  },
  // {
  //   name: 'Register',
  //   url: '/register',
  //   icon: 'nav-icon-bullet',
  //   roles: ['admin'],
  // },
  {
    name: 'Roles',
    url: '/admin/roles',
    iconComponent: { name: 'cil-description' },
    roles: ['admin'],
  },

  {
    title: true,
    name: 'Help',
    class: 'mt-auto',
    roles: ['admin', 'operator', 'supervisor', 'quality'],
  },
  {
    name: 'Documentation',
    // url: '/admin/documentation',
    // url: 'https://coreui.io/angular/docs/getting-started/introduction/',
    url: 'https://rtd-tutorial-ghadi2.readthedocs.io/en/latest/#',
    iconComponent: { name: 'cil-description' },
    attributes: { target: '_blank' },
    roles: ['admin', 'operator', 'supervisor', 'quality'],
  },
];
