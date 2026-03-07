import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-y-auto">
        <EmailVerificationBanner />
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
