export interface FileUpload {
  _id: string;
  workspaceId: string;
  channelId?: string;
  uploadedBy: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  storageUrl: string;
  isPublic: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
