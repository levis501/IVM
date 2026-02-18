/**
 * Input sanitization utilities for XSS prevention.
 * Used to sanitize user-provided text before storage/display.
 */

// HTML entities to escape
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

/**
 * Escape HTML special characters to prevent XSS.
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Sanitize a string by trimming whitespace and removing null bytes.
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/\0/g, '') // Remove null bytes
    .trim();
}

/**
 * Sanitize filename: remove path traversal, special chars, normalize.
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\0/g, '')           // Remove null bytes
    .replace(/\.\./g, '')          // Remove path traversal
    .replace(/[/\\]/g, '')         // Remove path separators
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_')       // Collapse multiple underscores
    .replace(/^\.+/, '')           // Remove leading dots
    .trim();
}

/**
 * Validate and sanitize an email address.
 */
export function sanitizeEmail(email: string): string {
  return email
    .replace(/\0/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Check for common SQL injection patterns (defense-in-depth).
 * Prisma parameterized queries already prevent SQL injection,
 * but this adds an extra layer of detection for logging.
 */
export function hasSqlInjectionPatterns(input: string): boolean {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION)\b.*\b(FROM|INTO|TABLE|SET|WHERE)\b)/i,
    /('.*(--))/,
    /(;\s*(DROP|ALTER|DELETE|INSERT|UPDATE))/i,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,
  ];
  return patterns.some(pattern => pattern.test(input));
}
