import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAcceptWorkspaceInvite } from '@/hooks/useWorkspaces';
import { useToast } from '@/hooks/useToast';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';

export function JoinWorkspacePage() {
  const [params] = useSearchParams();
  const codeFromUrl = params.get('code') || params.get('token') || '';
  const accept = useAcceptWorkspaceInvite();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState('');
  const [autoHandled, setAutoHandled] = useState(false);

  async function handleJoin(code: string) {
    if (!code.trim()) return;
    try {
      await accept.mutateAsync(code.trim());
      toast({ title: 'Joined workspace', description: 'You can now access the workspace.', variant: 'success' });
      navigate('/dashboard', { replace: true });
    } catch (e: any) {
      toast({
        title: 'Join failed',
        description: e?.response?.data?.message || e?.message || 'Invalid or expired invite.',
        variant: 'error',
      });
    }
  }

  useEffect(() => {
    if (!codeFromUrl || autoHandled) return;
    setAutoHandled(true);
    handleJoin(codeFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeFromUrl]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleJoin(manualCode);
  }

  return (
    <MainLayout>
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="w-full max-w-md bg-card text-card-foreground rounded-lg border border-border shadow-sm p-8">
          <h1 className="text-xl font-semibold mb-1">Join a Workspace</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter an invite code to join an existing workspace.
          </p>

          {codeFromUrl && accept.isPending ? (
            <div className="text-center py-4">
              <div className="text-sm text-muted-foreground">Processing invite...</div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="invite-code" className="block text-sm font-medium mb-1.5">
                  Invite Code
                </label>
                <input
                  id="invite-code"
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. ab12-cd34"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!manualCode.trim() || accept.isPending}
              >
                {accept.isPending ? 'Joining...' : 'Join Workspace'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
