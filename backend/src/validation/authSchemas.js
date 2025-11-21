import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2).max(40).optional(),
  email: z.email(),
  password: z.string().min(6).max(50)
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1)
});
