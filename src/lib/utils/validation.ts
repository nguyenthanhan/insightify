import { z } from 'zod';

export const messageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  type: z.enum(['text', 'chart', 'table', 'insight', 'error']),
  timestamp: z.string().datetime(),
  feedback: z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
  }).optional(),
});

export const userInputSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(500, 'Message too long'),
});

export type UserInput = z.infer<typeof userInputSchema>;
