import { useAuth } from '@/contexts/AuthContext';
import { useResendVerification } from '@/hooks/useAuthActions';
import { Button } from '@/components/ui/button';
import { Mail, X } from 'lucide-react';
import { useState } from 'react';

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const resendVerification = useResendVerification();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!user || user.isEmailVerified || isDismissed) {
    return null;
  }

  const handleResend = async () => {
    if (user.email) {
      await resendVerification.mutateAsync(user.email);
    }
  };

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/30">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Please verify your email address
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                We sent a verification email to {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResend}
              disabled={resendVerification.isPending}
            >
              {resendVerification.isPending ? 'Sending...' : 'Resend Email'}
            </Button>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
