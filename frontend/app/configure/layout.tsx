"use client";

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ConfigureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated && user?.role === 'student') {
      router.push('/student');
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role === 'student') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">FlexAGE Configuration</h1>
            <p className="text-sm text-slate-600">
              Welcome, {user.full_name || user.username} ({user.role})
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <nav>
              <ul className="flex space-x-4">
                <li>
                  <Link 
                    href="/configure/flexagecomps" 
                    className={`text-slate-600 hover:text-slate-900 ${
                      pathname.startsWith('/configure/flexagecomps') ? 'font-semibold text-slate-900' : ''
                    }`}
                  >
                    Components
                  </Link>
                </li>
                {user.role === 'admin' && (
                  <li>
                    <Link 
                      href="/configure/users" 
                      className={`text-slate-600 hover:text-slate-900 ${
                        pathname.startsWith('/configure/users') ? 'font-semibold text-slate-900' : ''
                      }`}
                    >
                      Users
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
            <Button 
              variant="outline" 
              onClick={logout}
              className="text-slate-600 hover:text-slate-900"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
