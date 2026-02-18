import { registrationSchema } from '@/lib/validation';

describe('validation schemas', () => {
  describe('registrationSchema', () => {
    const validData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-123-4567',
      unitNumber: '101A',
      isResident: true,
      isOwner: false,
    };

    it('accepts valid registration data', () => {
      const result = registrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('lowercases email', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        email: 'John@Example.COM',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('rejects missing first name', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        firstName: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing last name', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        lastName: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('rejects unit number longer than 6 chars', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        unitNumber: '1234567',
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-alphanumeric unit number', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        unitNumber: '10-A',
      });
      expect(result.success).toBe(false);
    });

    it('requires at least one of resident or owner', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        isResident: false,
        isOwner: false,
      });
      expect(result.success).toBe(false);
    });

    it('accepts owner only', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        isResident: false,
        isOwner: true,
      });
      expect(result.success).toBe(true);
    });

    it('accepts both resident and owner', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        isResident: true,
        isOwner: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid phone format', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        phone: 'abc-def-ghij',
      });
      expect(result.success).toBe(false);
    });

    it('accepts various phone formats', () => {
      const phones = ['555-123-4567', '(555) 123-4567', '+1 555.123.4567', '5551234567'];
      for (const phone of phones) {
        const result = registrationSchema.safeParse({ ...validData, phone });
        expect(result.success).toBe(true);
      }
    });
  });
});
