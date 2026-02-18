import { AuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import { sendEmail, replaceTemplateVariables } from './email';
import {
  logLoginAttempt,
  logMagicLinkRequest,
  logSessionCreated,
  checkRateLimit
} from './audit';

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      // Support both EMAIL_SERVER connection string and individual fields
      server: process.env.EMAIL_SERVER || {
        host: process.env.EMAIL_HOST!,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        auth: {
          user: process.env.EMAIL_USER!,
          pass: process.env.EMAIL_PASSWORD!,
        },
      },
      from: process.env.EMAIL_FROM!,
      maxAge: parseInt(process.env.MAGIC_LINK_EXPIRY_MINUTES || '15') * 60, // 15 minutes default
      async sendVerificationRequest({ identifier: email, url }) {
        // Check rate limit
        const rateLimitConfig = await prisma.systemConfig.findUnique({
          where: { key: 'rate_limit_magic_link_requests' },
        });
        const maxAttempts = parseInt(rateLimitConfig?.value || '3');

        const rateLimit = await checkRateLimit(email, 'magic-link', maxAttempts, 60);

        if (!rateLimit.allowed) {
          // Log failed attempt due to rate limit
          await logMagicLinkRequest(email, false, undefined, undefined, 'rate_limit_exceeded');
          throw new Error(
            `Too many magic link requests. Please try again after ${rateLimit.resetAt.toLocaleTimeString()}`
          );
        }

        // Fetch the magic-link email template from database
        const template = await prisma.emailTemplate.findUnique({
          where: { key: 'magic-link' },
        });

        if (!template) {
          throw new Error('Magic link email template not found');
        }

        // Get expiry time in minutes
        const expiryMinutes = parseInt(process.env.MAGIC_LINK_EXPIRY_MINUTES || '15');
        const expiresIn = `${expiryMinutes} minutes`;

        // Replace template variables
        const emailBody = replaceTemplateVariables(template.body, {
          email,
          link: url,
          expiresIn,
        });

        try {
          await sendEmail({
            to: email,
            subject: template.subject,
            text: emailBody,
            html: emailBody.replace(/\n/g, '<br>'),
          });

          // Log successful magic link request
          await logMagicLinkRequest(email, true);
        } catch (error) {
          // Log failed magic link request
          await logMagicLinkRequest(email, false, undefined, undefined, 'email_send_failed');
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 90 * 24 * 60 * 60, // 90 days (will be read from SystemConfig in callback)
  },
  callbacks: {
    async signIn({ user }) {
      // Get user from database to check verification status
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      // Check if user exists and is not pending
      if (!dbUser) {
        // User doesn't exist - block sign in
        await logLoginAttempt(user.email!, false, undefined, undefined, undefined, 'user_not_found');
        return false;
      }

      if (dbUser.verificationStatus === 'pending') {
        // Pending users cannot log in
        await logLoginAttempt(user.email!, false, undefined, undefined, dbUser.id, 'pending_verification');
        return `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/error?error=PendingVerification`;
      }

      if (dbUser.verificationStatus === 'denied') {
        // Denied users cannot log in
        await logLoginAttempt(user.email!, false, undefined, undefined, dbUser.id, 'verification_denied');
        return `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/error?error=VerificationDenied`;
      }

      // User is verified - allow sign in
      await logLoginAttempt(user.email!, true, undefined, undefined, dbUser.id);
      return true;
    },

    async jwt({ token, user }) {
      // Add user ID to token on first sign in
      if (user) {
        token.userId = user.id;
        token.email = user.email;

        // Log session created
        await logSessionCreated(user.id, user.email!, undefined, undefined);
      }

      return token;
    },

    async session({ session, token }) {
      // Get session timeout from SystemConfig
      const sessionConfig = await prisma.systemConfig.findUnique({
        where: { key: 'session_timeout_days' },
      });
      const sessionTimeoutDays = parseInt(sessionConfig?.value || '90');

      // Add custom fields to session
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.expires = new Date(Date.now() + sessionTimeoutDays * 24 * 60 * 60 * 1000).toISOString();

        // Fetch full user details including verification status and roles
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          include: {
            roles: true,
          },
        });

        if (dbUser) {
          session.user.verificationStatus = dbUser.verificationStatus;
          session.user.roles = dbUser.roles.map(r => r.name);
          session.user.firstName = dbUser.firstName;
          session.user.lastName = dbUser.lastName;
        }
      }

      return session;
    },
  },
  events: {
    async signOut({ token }) {
      // Log logout event
      if (token?.email) {
        const email = token.email as string;
        const userId = token.userId as string;
        // Don't await to avoid blocking the signout
        logLoginAttempt(email, true, undefined, undefined, userId, 'logout').catch(console.error);
      }
    },
  },
};
