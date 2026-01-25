import { useEffect } from 'react';
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
    return <div className="text-sm text-gray-500">Loading workspaces...</div>;
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No workspaces found. Create one to get started!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Workspaces
      </h3>
      {workspaces.map((workspace) => (
        <Button
          key={workspace._id}
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
