import NextAuth from "next-auth"

// Stub configuration for M01 - no actual authentication
// Will be replaced with real configuration in M03
const handler = NextAuth({
  providers: [],
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async session() {
      // Always return null session for M01
      return null as any;
    },
  },
})

export { handler as GET, handler as POST }
