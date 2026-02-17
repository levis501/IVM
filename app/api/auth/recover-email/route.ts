import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const { unitNumber } = await request.json();

    if (!unitNumber || typeof unitNumber !== 'string') {
      return NextResponse.json(
        { error: 'Unit number is required' },
        { status: 400 }
      );
    }

    // Find all verified users in this unit
    const users = await prisma.user.findMany({
      where: {
        unitNumber: unitNumber.trim(),
        verificationStatus: 'verified',
      },
    });

    if (users.length === 0) {
      // Don't reveal whether unit exists or not (security)
      // Log the attempt
      await logAuditEvent({
        action: 'EMAIL_RECOVERY_REQUEST',
        success: false,
        details: { unitNumber, reason: 'no_verified_users' },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      // Return success message anyway to prevent user enumeration
      return NextResponse.json(
        { message: 'If verified users exist for this unit, an email has been sent.' },
        { status: 200 }
      );
    }

    // Send email reminder to each verified user in the unit
    for (const user of users) {
      const emailBody = `Hello ${user.firstName} ${user.lastName},

You (or someone else) requested a reminder of your registered email address for the Indian Village Manor community portal.

Your registered email address is: ${user.email}

Unit Number: ${user.unitNumber}

If you did not request this, please ignore this email. Your account remains secure.

To sign in, visit: ${process.env.NEXTAUTH_URL}/auth/login

Best regards,
Indian Village Manor`;

      try {
        await sendEmail({
          to: user.email,
          subject: 'Indian Village Manor - Email Address Reminder',
          text: emailBody,
          html: emailBody.replace(/\n/g, '<br>'),
        });

        // Log successful email recovery
        await logAuditEvent({
          userId: user.id,
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`,
          action: 'EMAIL_RECOVERY_SENT',
          success: true,
          details: { unitNumber },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        });
      } catch (emailError) {
        console.error(`Failed to send email recovery to ${user.email}:`, emailError);
        // Continue with other users
      }
    }

    return NextResponse.json(
      { message: 'Email reminder sent successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email recovery error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
