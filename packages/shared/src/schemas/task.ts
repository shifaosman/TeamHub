import { z } from "zod";

export const TaskStatusSchema = z.enum(["todo", "in-progress", "done"]);

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  status: TaskStatusSchema.optional(),
  assigneeId: z.string().optional().nullable(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: TaskStatusSchema.optional(),
  assigneeId: z.string().optional().nullable(),
});
