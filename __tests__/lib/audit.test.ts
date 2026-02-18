import { isBot, formatActor } from '@/lib/audit';

describe('audit utilities', () => {
  describe('isBot', () => {
    it('detects Googlebot', () => {
      expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true);
    });

    it('detects Bingbot', () => {
      expect(isBot('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)')).toBe(true);
    });

    it('detects curl', () => {
      expect(isBot('curl/7.68.0')).toBe(true);
    });

    it('detects wget', () => {
      expect(isBot('Wget/1.21')).toBe(true);
    });

    it('detects Python requests', () => {
      expect(isBot('python-requests/2.28.0')).toBe(true);
    });

    it('does not flag Chrome browser', () => {
      expect(isBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36')).toBe(false);
    });

    it('does not flag Firefox', () => {
      expect(isBot('Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/121.0')).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isBot(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isBot('')).toBe(false);
    });
  });

  describe('formatActor', () => {
    it('formats user with name and unit', () => {
      expect(formatActor({
        userName: 'John Doe',
        unitNumber: '101',
        action: 'test',
        success: true,
      })).toBe('John Doe (Unit: 101)');
    });

    it('uses userName when no unit', () => {
      expect(formatActor({
        userName: 'John Doe',
        action: 'test',
        success: true,
      })).toBe('John Doe');
    });

    it('falls back to email', () => {
      expect(formatActor({
        userEmail: 'john@example.com',
        action: 'test',
        success: true,
      })).toBe('john@example.com');
    });

    it('returns anonymous when no user info', () => {
      expect(formatActor({
        action: 'test',
        success: true,
      })).toBe('anonymous');
    });
  });
});
