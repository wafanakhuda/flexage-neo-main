"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('student' | 'configurator' | 'admin')[];
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles = ['student', 'configurator', 'admin'],
  redirectTo = '/login'
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      if (user && !allowedRoles.includes(user.role)) {
        // Redirect based on role
        if (user.role === 'student') {
          router.push('/student/dashboard');
        } else if (user.role === 'configurator' || user.role === 'admin') {
          router.push('/configure/flexagecomps');
        }
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, router, allowedRoles, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};

// Hook for checking authentication status in components
export const useAuthGuard = (allowedRoles?: ('student' | 'configurator' | 'admin')[]) => {
  const { user, isAuthenticated } = useAuth();
  
  const hasAccess = isAuthenticated && 
    (!allowedRoles || (user && allowedRoles.includes(user.role)));
  
  return {
    user,
    isAuthenticated,
    hasAccess,
  };
};
