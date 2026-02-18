import { createHash, randomBytes } from 'crypto';
import { prisma } from './prisma';

/**
 * Generate a NextAuth-compatible one-time magic link for a given email.
 *
 * The token is stored in the VerificationToken table with the same hashing
 * algorithm NextAuth uses (SHA-256 of rawToken + NEXTAUTH_SECRET). When the
 * recipient clicks the link, NextAuth's email callback handler finds the record,
 * validates it, deletes it (one-time use), and signs the user in.
 *
 * @param email       The email address to authenticate
 * @param callbackUrl Where NextAuth should redirect after sign-in
 * @returns           The full magic link URL to embed in an email
 */
export async function createMagicLink(email: string, callbackUrl: string): Promise<string> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const secret = process.env.NEXTAUTH_SECRET!;
  const expiryMinutes = parseInt(process.env.MAGIC_LINK_EXPIRY_MINUTES || '15');

  // Generate a random token (same approach NextAuth uses)
  const rawToken = randomBytes(32).toString('hex');

  // Hash the token the same way NextAuth does: SHA-256(rawToken + secret)
  const hashedToken = createHash('sha256').update(`${rawToken}${secret}`).digest('hex');

  const expires = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // Store the hashed token in the VerificationToken table
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashedToken,
      expires,
    },
  });

  // Build the callback URL — NextAuth reads token + email from query params
  const params = new URLSearchParams({
    callbackUrl,
    token: rawToken,
    email,
  });

  return `${baseUrl}/api/auth/callback/email?${params}`;
}
