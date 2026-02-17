import { z } from 'zod';

/**
 * Registration schema for new user sign-ups
 * Note: Uses role-based system (resident/owner roles) instead of boolean fields
 */
export const registrationSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters'),

  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters'),

  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase(),

  phone: z.string()
    .min(1, 'Phone number is required')
    .regex(/^[\d\s\-\(\)\+\.]+$/, 'Invalid phone number format'),

  unitNumber: z.string()
    .min(1, 'Unit number is required')
    .max(6, 'Unit number must be 6 characters or less')
    .regex(/^[a-zA-Z0-9]+$/, 'Unit number must be alphanumeric only'),

  isResident: z.boolean().default(false),

  isOwner: z.boolean().default(false),
}).refine(data => data.isResident || data.isOwner, {
  message: 'You must select at least one: Resident or Owner',
  path: ['isResident'],
});

export type RegistrationData = z.infer<typeof registrationSchema>;
