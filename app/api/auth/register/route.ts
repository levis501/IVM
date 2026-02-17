import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registrationSchema } from '@/lib/validation';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const result = registrationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const validatedData = result.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please use a different email or try logging in.' },
        { status: 400 }
      );
    }

    // Get the resident and owner roles from the database
    const rolesToAssign: string[] = [];

    if (validatedData.isResident) {
      const residentRole = await prisma.role.findUnique({
        where: { name: 'resident' },
      });
      if (residentRole) {
        rolesToAssign.push(residentRole.id);
      }
    }

    if (validatedData.isOwner) {
      const ownerRole = await prisma.role.findUnique({
        where: { name: 'owner' },
      });
      if (ownerRole) {
        rolesToAssign.push(ownerRole.id);
      }
    }

    // Create the user with pending verification status
    const user = await prisma.user.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        unitNumber: validatedData.unitNumber.toUpperCase(), // Normalize to uppercase
        verificationStatus: 'pending',
        roles: {
          connect: rolesToAssign.map(id => ({ id })),
        },
      },
      include: {
        roles: true,
      },
    });

    // Log the registration event
    await logAuditEvent({
      userId: user.id,
      action: 'user_registered',
      entityType: 'User',
      entityId: user.id,
      details: {
        email: user.email,
        unitNumber: user.unitNumber,
        roles: user.roles.map(r => r.name),
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Your account is pending verification.',
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Registration error:', err);

    // Handle other errors
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
