import * as Y from 'yjs';
import type { Socket } from 'socket.io-client';

/**
 * Syncs a Yjs document with other collaborators via Socket.io.
 * Sends local updates to the server; receives and applies remote updates.
 */
export class NoteSyncProvider {
  private socket: Socket;
  private noteId: string;
  private userId: string;
  private doc: Y.Doc;
  private connected = false;
  private updateHandler = (update: Uint8Array, origin: unknown) => {
    if (origin === this) return;
    this.socket.emit('note:ydoc_sync', {
      noteId: this.noteId,
      update: this.encodeUpdate(update),
      userId: this.userId,
    });
  };

  constructor(socket: Socket, noteId: string, userId: string, doc: Y.Doc) {
    this.socket = socket;
    this.noteId = noteId;
    this.userId = userId;
    this.doc = doc;
  }

  connect() {
    if (this.connected) return;
    this.socket.emit('note:join', { noteId: this.noteId });
    this.socket.on('note:ydoc_sync', this.handleRemoteUpdate);
    this.doc.on('update', this.updateHandler);
    this.connected = true;
  }

  disconnect() {
    if (!this.connected) return;
    this.doc.off('update', this.updateHandler);
    this.socket.off('note:ydoc_sync', this.handleRemoteUpdate);
    this.socket.emit('note:leave', { noteId: this.noteId });
    this.connected = false;
  }

  private handleRemoteUpdate = (payload: { noteId: string; update: string; userId: string }) => {
    if (payload.noteId !== this.noteId || payload.userId === this.userId) return;
    try {
      const update = this.decodeUpdate(payload.update);
      Y.applyUpdate(this.doc, update, this);
    } catch (e) {
      console.error('Failed to apply remote Yjs update:', e);
    }
  };

  private encodeUpdate(update: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < update.length; i++) {
      binary += String.fromCharCode(update[i]);
    }
    return typeof btoa !== 'undefined' ? btoa(binary) : '';
  }

  private decodeUpdate(encoded: string): Uint8Array {
    const binary = typeof atob !== 'undefined' ? atob(encoded) : '';
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
