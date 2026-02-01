import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useToast } from '@/hooks/useToast';
import { useReorderTasksBulk } from '@/hooks/useTasks';
import { Task, TaskStatus } from '@/lib/projectsApi';
import { Column } from './Column';
import { TaskDetailsDrawer } from './TaskDetailsDrawer';

interface BoardProps {
  projectId: string;
  workspaceId: string;
  tasks: Task[];
  initialOpenTaskId?: string | null;
}

function sortByOrder(a: Task, b: Task) {
  return (a.order ?? 0) - (b.order ?? 0);
}

export function Board({ projectId, workspaceId, tasks, initialOpenTaskId }: BoardProps) {
  const { toast } = useToast();
  const reorderBulk = useReorderTasksBulk();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const openedFromQueryRef = useRef(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const initialGrouped = useMemo(() => {
    const by: Record<TaskStatus, Task[]> = { todo: [], 'in-progress': [], done: [] };
    for (const t of tasks) by[t.status]?.push(t);
    (Object.keys(by) as TaskStatus[]).forEach((s) => by[s].sort(sortByOrder));
    return by;
  }, [tasks]);

  const [grouped, setGrouped] = useState<Record<TaskStatus, Task[]>>(initialGrouped);
  const isDraggingRef = useRef(false);
  const originContainerRef = useRef<TaskStatus | null>(null);

  useEffect(() => {
    if (isDraggingRef.current) return;
    setGrouped(initialGrouped);
  }, [initialGrouped]);

  const selectedTask = useMemo(() => tasks.find((t) => t._id === selectedTaskId) || null, [tasks, selectedTaskId]);

  useEffect(() => {
    if (openedFromQueryRef.current) return;
    if (!initialOpenTaskId) return;
    const exists = tasks.some((t) => t._id === initialOpenTaskId);
    if (!exists) return;
    setSelectedTaskId(initialOpenTaskId);
    setDetailsOpen(true);
    openedFromQueryRef.current = true;
  }, [initialOpenTaskId, tasks]);

  function isStatusId(id: unknown): id is TaskStatus {
    return id === 'todo' || id === 'in-progress' || id === 'done';
  }

  function findContainer(id: string): TaskStatus | null {
    if (isStatusId(id)) return id;
    const statuses: TaskStatus[] = ['todo', 'in-progress', 'done'];
    for (const s of statuses) {
      if (grouped[s].some((t) => t._id === id)) return s;
    }
    return null;
  }

  function onDragStart(event: DragStartEvent) {
    isDraggingRef.current = true;
    originContainerRef.current = findContainer(String(event.active.id));
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) return;

    setGrouped((prev) => {
      const next: Record<TaskStatus, Task[]> = {
        todo: [...prev.todo],
        'in-progress': [...prev['in-progress']],
        done: [...prev.done],
      };

      const activeIndex = next[activeContainer].findIndex((t) => t._id === activeId);
      if (activeIndex < 0) return prev;

      const [moving] = next[activeContainer].splice(activeIndex, 1);
      const movingTask: Task = { ...moving, status: overContainer };

      const overIndex = next[overContainer].findIndex((t) => t._id === overId);

      // If hovering the column container itself (id === status), drop at end.
      if (isStatusId(overId) || overIndex < 0) {
        next[overContainer].push(movingTask);
        return next;
      }

      // Insert before/after the hovered item depending on pointer position.
      const activeRect = active.rect.current.translated ?? active.rect.current.initial;
      const overRect = over.rect;
      const isBelowOverItem =
        !!activeRect && !!overRect && activeRect.top > overRect.top + overRect.height / 2;
      const insertIndex = overIndex + (isBelowOverItem ? 1 : 0);
      next[overContainer].splice(insertIndex, 0, movingTask);

      return next;
    });
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    isDraggingRef.current = false;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const originContainer = originContainerRef.current ?? findContainer(activeId);
    const overContainer = findContainer(overId);
    originContainerRef.current = null;
    if (!originContainer || !overContainer) return;

    // Same column reorder
    if (originContainer === overContainer) {
      const fromIndex = grouped[originContainer].findIndex((t) => t._id === activeId);
      const toIndex = grouped[overContainer].findIndex((t) => t._id === overId);
      if (fromIndex < 0 || toIndex < 0) return;

      const ids = arrayMove(grouped[originContainer].map((t) => t._id), fromIndex, toIndex);
      const nextColumn = ids
        .map((id) => grouped[originContainer].find((t) => t._id === id)!)
        .filter(Boolean);

      const nextGrouped = {
        ...grouped,
        [originContainer]: nextColumn,
      } as Record<TaskStatus, Task[]>;
      setGrouped(nextGrouped);

      const items = nextGrouped[originContainer].map((t, index) => ({
        taskId: t._id,
        order: index,
        status: originContainer,
      }));

      try {
        await reorderBulk.mutateAsync({ projectId, workspaceId, items });
      } catch (e: any) {
        toast({
          title: 'Reorder failed',
          description: e?.response?.data?.message || e?.message || 'Please try again.',
          variant: 'error',
        });
      }
      return;
    }

    // Cross-column move: we already updated UI in onDragOver. Now persist ordering for BOTH columns.
    const nextGrouped = grouped;

    const items = [
      ...nextGrouped[originContainer].map((t, index) => ({
        taskId: t._id,
        order: index,
        status: originContainer,
      })),
      ...nextGrouped[overContainer].map((t, index) => ({
        taskId: t._id,
        order: index,
        status: overContainer,
      })),
    ];

    try {
      await reorderBulk.mutateAsync({ projectId, workspaceId, items });
    } catch (e: any) {
      toast({
        title: 'Move failed',
        description: e?.response?.data?.message || e?.message || 'Please try again.',
        variant: 'error',
      });
    }
  }

  function openDetails(task: Task) {
    setSelectedTaskId(task._id);
    setDetailsOpen(true);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        autoScroll
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="h-[calc(100vh-240px)] overflow-hidden">
          <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 h-full">
          <Column
            title="To do"
            status="todo"
            projectId={projectId}
            workspaceId={workspaceId}
            tasks={grouped.todo}
            onTaskClick={openDetails}
          />
          <Column
            title="In progress"
            status="in-progress"
            projectId={projectId}
            workspaceId={workspaceId}
            tasks={grouped['in-progress']}
            onTaskClick={openDetails}
          />
          <Column
            title="Done"
            status="done"
            projectId={projectId}
            workspaceId={workspaceId}
            tasks={grouped.done}
            onTaskClick={openDetails}
          />
          </div>
        </div>
      </DndContext>

      <TaskDetailsDrawer task={selectedTask} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </>
  );
}

