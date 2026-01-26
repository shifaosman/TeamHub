import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <EmailVerificationBanner />
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
