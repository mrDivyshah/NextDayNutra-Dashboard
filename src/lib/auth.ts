import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { roles, users } from "@/db/schema";
import type { AppRole } from "@/lib/roles";


const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  rememberMe: z.union([z.boolean(), z.string()]).optional(),
});

export type AppUser = {
  id: number;
  email: string;
  name: string;
  role: AppRole;
  jiraId?: string | null;
  companyName?: string | null;
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember me", type: "text" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.trim().toLowerCase();
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user || !user.isActive) {
          return null;
        }

        const [roleRecord] = await db.select().from(roles).where(eq(roles.key, user.role)).limit(1);
        if (!roleRecord) {
          return null;
        }

        const isValid = await compare(parsed.data.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        const rememberMe =
          parsed.data.rememberMe === true ||
          parsed.data.rememberMe === "true" ||
          parsed.data.rememberMe === "on";

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: roleRecord.key,
          jiraId: user.jiraId,
          companyName: user.companyName,
          rememberMe,
        } as NextAuthUser & { role: AppUser["role"]; jiraId?: string | null; companyName?: string | null };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = Number(user.id);
        token.role = user.role;
        token.jiraId = user.jiraId;
        token.companyName = user.companyName;
        token.rememberMe = !!user.rememberMe;
        token.exp = Math.floor(Date.now() / 1000) + (user.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 12);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = Number(token.id);
        session.user.role = token.role as AppRole;
        session.user.jiraId = token.jiraId;
        session.user.companyName = token.companyName as string | null | undefined;
        session.user.rememberMe = !!token.rememberMe;
      }
      return session;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
