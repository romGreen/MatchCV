import { z } from 'zod';

// Profile validation schema
export const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s]+$/, 'Name can only contain letters, numbers, and spaces'),
  bio: z
    .string()
    .min(10, 'Bio must be at least 10 characters')
    .max(200, 'Bio must be less than 200 characters'),
  hobbies: z
    .array(z.string())
    .min(1, 'Select at least one hobby')
    .max(10, 'Select at most 10 hobbies'),
  useLocation: z.boolean(),
});

// Hobby validation
export const hobbySchema = z.object({
  name: z.string().min(1, 'Hobby name is required').max(30, 'Hobby name too long'),
  category: z.string().optional(),
});

// Location validation
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// User profile type from schema
export type ProfileFormData = z.infer<typeof profileSchema>;
export type HobbyFormData = z.infer<typeof hobbySchema>;
export type LocationData = z.infer<typeof locationSchema>;
