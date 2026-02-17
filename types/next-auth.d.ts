import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      verificationStatus: string;
      roles: string[];
      firstName: string;
      lastName: string;
    };
  }

  interface User {
    id: string;
    email: string;
    verificationStatus?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    email: string;
  }
}
