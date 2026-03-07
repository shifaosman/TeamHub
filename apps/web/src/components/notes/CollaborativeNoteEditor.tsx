import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Collaboration from '@tiptap/extension-collaboration';
import * as Y from 'yjs';
import { useNote, useUpdateNote } from '@/hooks/useNotes';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';
import { NoteSyncProvider } from '@/lib/noteSyncProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Users,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLLAB_FRAGMENT_NAME = 'note-content';

interface CollaborativeNoteEditorProps {
  noteId: string;
  onPresenceCount?: (count: number) => void;
}

export function CollaborativeNoteEditor({ noteId, onPresenceCount }: CollaborativeNoteEditorProps) {
  const { data: note, isLoading } = useNote(noteId);
  const updateNote = useUpdateNote();
  const socket = useSocket();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [presenceCount, setPresenceCount] = useState(0);
  const providerRef = useRef<NoteSyncProvider | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialContentSetRef = useRef(false);

  const userId = user?._id ?? '';

  const ydoc = useMemo(() => new Y.Doc(), []);

  const persistContent = useCallback(async () => {
    if (!noteId || !note) return;
    const editor = editorRef.current;
    if (!editor) return;
    const html = editor.getHTML();
    if (html === '<p></p>' && !note.content) return;
    setSaving(true);
    try {
      await updateNote.mutateAsync({ noteId, content: html });
    } finally {
      setSaving(false);
    }
  }, [noteId, note, updateNote]);

  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
      Collaboration.configure({
        document: ydoc,
        field: COLLAB_FRAGMENT_NAME,
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-[320px] px-4 py-5 focus:outline-none',
      },
    },
    onTransaction: () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(persistContent, 2000);
    },
    onCreate: ({ editor }) => {
      editorRef.current = editor;
    },
    onDestroy: () => {
      editorRef.current = null;
    },
  });

  // Set initial content from REST when fragment is empty (first load)
  useEffect(() => {
    if (!editor || !note || initialContentSetRef.current) return;
    const fragment = ydoc.getXmlFragment(COLLAB_FRAGMENT_NAME);
    if (fragment.length > 0) return; // Already has content from sync
    const content = note.content?.trim();
    if (content) {
      initialContentSetRef.current = true;
      editor.commands.setContent(content, false);
    }
  }, [editor, note, ydoc]);

  // Socket provider: connect when we have socket, noteId, and ydoc
  useEffect(() => {
    if (!socket || !noteId || !userId) return;
    const provider = new NoteSyncProvider(socket, noteId, userId, ydoc);
    providerRef.current = provider;
    provider.connect();

    const handlePresence = () => {
      // Optional: track how many are in the room via a separate event; for now we don't have that
      setPresenceCount((c) => Math.max(1, c));
    };
    socket.on('note:updated', handlePresence);

    return () => {
      provider.disconnect();
      providerRef.current = null;
      socket.off('note:updated', handlePresence);
    };
  }, [socket, noteId, userId, ydoc]);

  useEffect(() => {
    onPresenceCount?.(presenceCount);
  }, [presenceCount, onPresenceCount]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Skeleton className="h-12 w-3/4 rounded-lg mb-4 mx-4 mt-4" />
        <Skeleton className="flex-1 rounded-lg mx-4 mb-4 min-h-[200px]" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
        Note not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-3 py-2">
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor?.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor?.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive('bulletList')}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive('orderedList')}
          title="Ordered list"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3" />
          <span>Collaborative</span>
          {saving && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving…
            </span>
          )}
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'h-8 w-8 rounded-lg',
        active && 'bg-muted text-foreground'
      )}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
    >
      {children}
    </Button>
  );
}
