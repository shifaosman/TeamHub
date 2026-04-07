import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/button';

export function WorkspaceSelector() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();

  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !currentWorkspace) {
      setCurrentWorkspace(workspaces[0]);
    }
  }, [workspaces, currentWorkspace, setCurrentWorkspace]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading workspaces...</div>;
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>No workspaces yet.</p>
        <Link
          to="/join"
          className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Join a workspace
        </Link>
        <Link
          to="/create-workspace"
          className="block rounded-md border border-border px-3 py-2 text-center text-sm font-medium text-foreground hover:bg-muted"
        >
          Create a workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="workspace-selector">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Workspaces
      </h3>
      {workspaces.map((workspace) => (
        <Button
          key={workspace._id}
          data-testid="workspace-item"
          variant={currentWorkspace?._id === workspace._id ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => setCurrentWorkspace(workspace)}
        >
          <span className="mr-2">#</span>
          {workspace.name}
        </Button>
      ))}
    </div>
  );
}
