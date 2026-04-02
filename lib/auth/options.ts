import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username }
        });

        if (!user || !user.status) {
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          uuid: user.uuid,
          username: user.username,
          role: user.role,
          name: user.realName
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = Number(user.id);
        token.uuid = String(user.uuid);
        token.username = String(user.username);
        token.role = user.role as "ADMIN" | "OPERATOR" | "VIEWER";
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as number,
        uuid: token.uuid as string,
        username: token.username as string,
        role: token.role as "ADMIN" | "OPERATOR" | "VIEWER",
        name: session.user?.name ?? ""
      };
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
