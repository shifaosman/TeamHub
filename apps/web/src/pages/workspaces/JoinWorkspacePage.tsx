import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAcceptWorkspaceInvite } from '@/hooks/useWorkspaces';
import { useToast } from '@/hooks/useToast';
import { MainLayout } from '@/components/layout/MainLayout';

export function JoinWorkspacePage() {
  const [params] = useSearchParams();
  const code = params.get('code') || params.get('token') || '';
  const accept = useAcceptWorkspaceInvite();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    (async () => {
      try {
        await accept.mutateAsync(code);
        if (cancelled) return;
        toast({ title: 'Joined workspace', description: 'You can now access the workspace.', variant: 'success' });
        navigate('/dashboard', { replace: true });
      } catch (e: any) {
        if (cancelled) return;
        toast({
          title: 'Join failed',
          description: e?.response?.data?.message || e?.message || 'Invalid or expired invite.',
          variant: 'error',
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, accept, navigate, toast]);

  return (
    <MainLayout>
      <div className="p-6">
        <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-8 text-center">
          <div className="text-lg font-semibold">Joining workspace…</div>
          <div className="text-sm text-muted-foreground mt-2">
            {code ? 'Please wait while we process the invite.' : 'Missing invite code.'}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

