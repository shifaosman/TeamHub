import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { useCreateWorkspaceInviteLink } from '@/hooks/useWorkspaces';

interface InviteMembersDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMembersDialog({ workspaceId, open, onOpenChange }: InviteMembersDialogProps) {
  const { toast } = useToast();
  const createInvite = useCreateWorkspaceInviteLink();

  const [expiresInDays, setExpiresInDays] = useState(7);
  const [maxUses, setMaxUses] = useState(1);
  const [role, setRole] = useState('member');

  const [invite, setInvite] = useState<any | null>(null);
  const joinUrl = useMemo(() => {
    if (!invite?.code) return '';
    return `${window.location.origin}/join?code=${encodeURIComponent(invite.code)}`;
  }, [invite?.code]);

  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!open) {
      setInvite(null);
      setQrDataUrl('');
    }
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    async function gen() {
      if (!joinUrl) return;
      try {
        const url = await QRCode.toDataURL(joinUrl, { margin: 1, width: 256 });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        // ignore
      }
    }
    gen();
    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

  async function onGenerate() {
    try {
      const created = await createInvite.mutateAsync({
        workspaceId,
        role,
        expiresInDays,
        maxUses,
      });
      setInvite(created);
      toast({ title: 'Invite created', description: 'Share the code or QR to let someone join.', variant: 'success' });
    } catch (e: any) {
      toast({
        title: 'Failed to create invite',
        description: e?.response?.data?.message || e?.message || 'Please try again.',
        variant: 'error',
      });
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied', description: 'Copied to clipboard.', variant: 'success' });
    } catch {
      toast({ title: 'Copy failed', description: 'Please copy manually.', variant: 'error' });
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-lg rounded-lg border border-border bg-card text-card-foreground shadow-lg">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Invite members</div>
            <div className="text-sm text-muted-foreground">Generate a code or QR link to join this workspace.</div>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Role</div>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="member">member</option>
                <option value="guest">guest</option>
                <option value="admin">admin</option>
                <option value="owner">owner</option>
              </select>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Expires (days)</div>
              <input
                type="number"
                min={1}
                max={30}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Max uses</div>
              <input
                type="number"
                min={1}
                max={100}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onGenerate} disabled={createInvite.isPending}>
              {createInvite.isPending ? 'Generating…' : 'Generate invite'}
            </Button>
          </div>

          {invite?.code ? (
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Invite code</div>
                <div className="flex gap-2">
                  <input
                    readOnly
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={invite.code}
                  />
                  <Button variant="outline" onClick={() => copy(invite.code)}>
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Join link</div>
                <div className="flex gap-2">
                  <input
                    readOnly
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={joinUrl}
                  />
                  <Button variant="outline" onClick={() => copy(joinUrl)}>
                    Copy
                  </Button>
                </div>
              </div>

              {qrDataUrl ? (
                <div className="pt-2">
                  <div className="text-sm font-medium mb-2">QR code</div>
                  <img src={qrDataUrl} alt="Join workspace QR" className="w-40 h-40 rounded-md border border-border bg-background" />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

