import { UserRole } from '@/types/auth';

export const adminNavigationConfig = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    roles: [UserRole.ADMIN],
  },
  {
    label: 'Documents',
    href: '/documents',
    roles: [UserRole.ADMIN],
  },
  {
    label: 'RIDS',
    href: '/documents/rids',
    roles: [UserRole.ADMIN],
  },
  {
    label: 'Policy Control',
    href: '/policy',
    roles: [UserRole.ADMIN],
  },
  {
    label: 'Trainings',
    href: '/trainings?tab=upcoming',
    roles: [UserRole.ADMIN],
  },
  {
    label: 'Personnel',
    href: '/personnel',
    roles: [UserRole.ADMIN],
  },
  {
    label: 'Companies',
    href: '/companies',
    roles: [UserRole.ADMIN],
  },
  {
    label: 'Prescriptive Analytics',
    href: '/analytics/prescriptive',
    roles: [UserRole.ADMIN],
  }
]; 