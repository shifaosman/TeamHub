import { useState, useEffect, useRef } from 'react';
import { useNote, useUpdateNote } from '@/hooks/useNotes';
import { useSocket } from '@/hooks/useSocket';
import { Input } from '@/components/ui/input';

interface NoteEditorProps {
  noteId: string;
}

export function NoteEditor({ noteId }: NoteEditorProps) {
  const { data: note, isLoading } = useNote(noteId);
  const updateNote = useUpdateNote();
  const socket = useSocket();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [presenceCount, setPresenceCount] = useState(1);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note]);

  useEffect(() => {
    if (socket && noteId) {
      socket.emit('note:join', { noteId });

      const handleNoteUpdate = (data: any) => {
        if (data.noteId === noteId && !isEditing) {
          if (data.title !== undefined) setTitle(data.title);
          if (data.content !== undefined) setContent(data.content);
        }
      };
      const handlePresence = (payload: { noteId: string; count: number }) => {
        if (payload.noteId !== noteId) return;
        // Clamp to at least 1 so local user is always counted
        setPresenceCount(Math.max(1, payload.count));
      };

      socket.on('note:updated', handleNoteUpdate);
      socket.on('note:presence', handlePresence);

      return () => {
        socket.emit('note:leave', { noteId });
        socket.off('note:updated', handleNoteUpdate);
        socket.off('note:presence', handlePresence);
      };
    }
  }, [socket, noteId, isEditing]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsEditing(true);
    debouncedSave();
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsEditing(true);
    debouncedSave();
  };

  const debouncedSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 1000); // Save after 1 second of inactivity
  };

  const handleSave = async () => {
    if (!note) return;

    try {
      await updateNote.mutateAsync({
        noteId,
        title,
        content,
      });

      // Broadcast update via socket
      if (socket) {
        socket.emit('note:update', {
          noteId,
          title,
          content,
        });
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading note...</div>;
  }

  if (!note) {
    return <div className="p-4 text-sm text-muted-foreground">Note not found</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Input
            value={title}
            onChange={handleTitleChange}
            placeholder="Note title..."
            className="text-xl font-semibold border-none focus-visible:ring-0 p-0 bg-transparent"
          />
          {isEditing && (
            <p className="text-xs text-muted-foreground mt-1">Saving...</p>
          )}
        </div>
        <div className="shrink-0 text-xs text-muted-foreground">
          {presenceCount > 1 ? `${presenceCount} people here` : 'Just you here'}
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing..."
          className="w-full h-full resize-none border-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  );
}
