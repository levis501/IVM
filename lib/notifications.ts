import { prisma } from './prisma';
import { sendEmail, replaceTemplateVariables } from './email';
import { logAuditEvent } from './audit';

export interface NewUserDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  unitNumber: string;
  roles: string[];
}

/**
 * Send email notification to all verifiers when a new user registers.
 * If any verifier email fails, notify all dbadmin users.
 */
export async function sendVerifierNotification(newUser: NewUserDetails): Promise<void> {
  // Fetch verifier notification email template
  const template = await prisma.emailTemplate.findUnique({
    where: { key: 'verifier-notification' },
  });

  if (!template) {
    console.error('❌ verifier-notification email template not found');
    return;
  }

  // Find all users with verifier role
  const verifiers = await prisma.user.findMany({
    where: {
      verificationStatus: 'verified',
      roles: {
        some: { name: 'verifier' },
      },
    },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  if (verifiers.length === 0) {
    console.warn('⚠️ No verifiers found to notify of new registration');
    await logAuditEvent({
      action: 'verifier_notification_skipped',
      entityType: 'User',
      entityId: newUser.id,
      success: true,
      details: { reason: 'no_verifiers_found', newUserEmail: newUser.email },
    });
    return;
  }

  const isResident = newUser.roles.includes('resident') ? 'Yes' : 'No';
  const isOwner = newUser.roles.includes('owner') ? 'Yes' : 'No';
  const verificationLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/verify`;

  const failedVerifiers: string[] = [];

  for (const verifier of verifiers) {
    const emailBody = replaceTemplateVariables(template.body, {
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      phone: newUser.phone,
      unit: newUser.unitNumber,
      isResident,
      isOwner,
      verificationLink,
    });

    try {
      await sendEmail({
        to: verifier.email,
        subject: template.subject,
        text: emailBody,
        html: emailBody.replace(/\n/g, '<br>'),
      });

      await logAuditEvent({
        action: 'verifier_notification_sent',
        entityType: 'User',
        entityId: newUser.id,
        success: true,
        details: {
          verifierEmail: verifier.email,
          newUserEmail: newUser.email,
        },
      });
    } catch (error) {
      console.error(`❌ Failed to send verifier notification to ${verifier.email}:`, error);
      failedVerifiers.push(verifier.email);

      await logAuditEvent({
        action: 'verifier_notification_failed',
        entityType: 'User',
        entityId: newUser.id,
        success: false,
        details: {
          verifierEmail: verifier.email,
          newUserEmail: newUser.email,
          error: error instanceof Error ? error.message : 'unknown_error',
        },
      });
    }
  }

  // If any verifier notifications failed, alert dbadmin users
  if (failedVerifiers.length > 0) {
    await notifyDbAdminOfEmailFailure(newUser, failedVerifiers);
  }
}

/**
 * Notify all dbadmin users when verifier email notifications fail.
 */
async function notifyDbAdminOfEmailFailure(
  newUser: NewUserDetails,
  failedVerifiers: string[]
): Promise<void> {
  const dbAdmins = await prisma.user.findMany({
    where: {
      verificationStatus: 'verified',
      roles: {
        some: { name: 'dbadmin' },
      },
    },
    select: { email: true },
  });

  if (dbAdmins.length === 0) {
    console.error('❌ No dbadmin users found to notify of email failure');
    return;
  }

  const subject = 'IVM Alert: Verifier Notification Email Failed';
  const body = `An email notification to one or more verifiers failed during a new user registration.

New User: ${newUser.firstName} ${newUser.lastName} (${newUser.email})
Unit: ${newUser.unitNumber}

Failed verifier emails:
${failedVerifiers.join('\n')}

Please manually notify these verifiers and check the email configuration.

Verification page: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/verify`;

  for (const admin of dbAdmins) {
    try {
      await sendEmail({
        to: admin.email,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
      });
    } catch (error) {
      console.error(`❌ Failed to notify dbadmin ${admin.email} of email failure:`, error);
    }
  }
}
