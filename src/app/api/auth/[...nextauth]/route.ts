import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const allowedUsers = process.env.ALLOWED_USERS?.split(',').map(email => email.trim());

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }
      
      if (allowedUsers && allowedUsers.includes(user.email)) {
        return true;
      } else {
        // You can return a URL to redirect to a custom "unauthorized" page
        // For now, returning false will show a generic error message.
        return false;
      }
    }
  }
})

export { handler as GET, handler as POST } 