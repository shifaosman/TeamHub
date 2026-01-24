import { z } from 'zod';

export const createMessageSchema = z.object({
  channelId: z.string().min(1),
  content: z.string().min(1).max(10000),
  threadId: z.string().optional(),
  replyToId: z.string().optional(),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1).max(10000),
});

export const searchMessagesSchema = z.object({
  workspaceId: z.string().min(1),
  query: z.string().min(1),
  channelId: z.string().optional(),
  userId: z.string().optional(),
  hasFile: z.boolean().optional(),
  hasLink: z.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type SearchMessagesInput = z.infer<typeof searchMessagesSchema>;
