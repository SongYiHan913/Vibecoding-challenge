import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  showHeader = true,
}) => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && (
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  {title || '온라인 면접 시스템'}
                </h1>
              </div>
              
              {isAuthenticated && user && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {user.name}님 ({user.role === 'admin' ? '관리자' : '지원자'})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                  >
                    로그아웃
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}; 