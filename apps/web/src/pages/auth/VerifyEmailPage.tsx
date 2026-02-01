import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email and try again.');
      return;
    }

    const verifyEmail = async () => {
      try {
        await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Failed to verify email. The link may have expired.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (status !== 'success') return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="max-w-md w-full mx-4">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">TeamHub</h1>
        </div>

        {/* Card */}
        <div className="bg-card text-card-foreground rounded-2xl shadow-xl border border-border overflow-hidden">
          {/* Status Header */}
          <div className={`p-6 ${
            status === 'loading' ? 'bg-primary/5' :
            status === 'success' ? 'bg-green-500/10' :
            'bg-destructive/10'
          }`}>
            <div className="flex items-center justify-center">
              {status === 'loading' && (
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              )}
              {status === 'success' && (
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                  <CheckCircle className="h-16 w-16 text-green-500 relative" />
                </div>
              )}
              {status === 'error' && (
                <XCircle className="h-16 w-16 text-destructive" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            {status === 'loading' && (
              <>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Verifying your email...
                </h2>
                <p className="text-muted-foreground">
                  Please wait while we verify your email address.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Email Verified!
                </h2>
                <p className="text-muted-foreground mb-6">
                  {message}
                </p>
                <div className="space-y-4">
                  <Button 
                    onClick={() => navigate('/login')} 
                    className="w-full h-12 text-lg"
                    size="lg"
                  >
                    Continue to Login
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Redirecting automatically in {countdown} seconds...
                  </p>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Verification Failed
                </h2>
                <p className="text-muted-foreground mb-6">
                  {message}
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate('/login')} 
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                  <Button 
                    onClick={() => navigate('/register')} 
                    variant="outline"
                    className="w-full"
                  >
                    Create New Account
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
