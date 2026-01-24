export interface Note {
  _id: string;
  workspaceId: string;
  parentId?: string;
  title: string;
  content: string;
  createdBy: string;
  updatedBy: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteVersion {
  _id: string;
  noteId: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: Date;
}

export interface NoteComment {
  _id: string;
  noteId: string;
  userId: string;
  content: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteCollaborator {
  _id: string;
  noteId: string;
  userId: string;
  permission: 'read' | 'write' | 'admin';
  createdAt: Date;
}
