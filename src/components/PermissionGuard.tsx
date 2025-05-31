'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionGuardProps {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * A component that conditionally renders its children based on user permissions
 * @param permission The permission required to view the content
 * @param fallback Optional content to show if permission is denied (defaults to null)
 * @param children Content to show if permission is granted
 */
export default function PermissionGuard({ permission, fallback = null, children }: PermissionGuardProps) {
  const { hasSpecificPermission } = useAuth();
  
  if (hasSpecificPermission(permission)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

/**
 * Higher-order component that wraps a component with permission check
 * @param Component The component to wrap
 * @param permission The permission required to render the component
 * @param fallback Optional component to render if permission is denied
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  Fallback: React.ComponentType<P> | null = null
) {
  return function PermissionCheckedComponent(props: P) {
    const { hasSpecificPermission } = useAuth();
    
    if (hasSpecificPermission(permission)) {
      return <Component {...props} />;
    }
    
    if (Fallback) {
      return <Fallback {...props} />;
    }
    
    return null;
  };
} 