import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setResendStatus('idle');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      // Use actual server message (don't replace with generic "Login failed" for auth errors)
      const raw = err.response?.data?.message;
      const message = Array.isArray(raw)
        ? raw.join('. ')
        : typeof raw === 'string'
          ? raw
          : err.message === 'Network Error' || !err.response
            ? 'Cannot reach server. Use the same Wi‑Fi or hotspot as this computer.'
            : 'Login failed';
      setError(message);
      // Show verification UI when server says email must be verified
      if (typeof message === 'string' && message.toLowerCase().includes('verify your email')) {
        setNeedsVerification(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    
    setResendStatus('sending');
    try {
      await api.post('/auth/resend-verification', { email });
      setResendStatus('sent');
    } catch (err: any) {
      setResendStatus('error');
      setError(err.response?.data?.message || 'Failed to resend verification email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="max-w-md w-full mx-4">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">TeamHub</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <div className="bg-card text-card-foreground rounded-2xl shadow-xl border border-border p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Alert */}
            {error && !needsVerification && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Verification Required Alert */}
            {needsVerification && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 px-4 py-4 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <Mail className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Email verification required</p>
                    <p className="text-sm mt-1 opacity-90">
                      Please check your inbox and click the verification link to activate your account.
                    </p>
                  </div>
                </div>
                
                {resendStatus === 'sent' ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm mt-3 bg-green-500/10 px-3 py-2 rounded">
                    <CheckCircle className="h-4 w-4" />
                    <span>Verification email sent! Check your inbox.</span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={handleResendVerification}
                    disabled={resendStatus === 'sending'}
                  >
                    {resendStatus === 'sending' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Resend verification email
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  data-testid="login-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 h-11"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  data-testid="login-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 h-11"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <Button 
                type="submit" 
                className="w-full h-11 text-base" 
                disabled={isLoading} 
                data-testid="login-submit"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-center text-sm">
                <Link to="/forgot-password" className="text-primary hover:underline">
                  Forgot your password?
                </Link>
              </div>
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
