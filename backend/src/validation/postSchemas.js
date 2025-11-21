import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(3).max(200),
  summary: z.string().max(300).optional(),
  content: z.string(),
  tags: z.array(z.string().max(30)).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional()
});

export const updatePostSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  summary: z.string().max(300).optional(),
  content: z.string().optional(),
  tags: z.array(z.string().max(30)).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional()
});
