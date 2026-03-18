import "./globals.css";
import { getAuthSession } from "@/lib/auth";
import { Inter } from "next/font/google";

export const metadata = {
  title: "NDN Admin Dashboard",
  description: "Next Day Nutra Admin Dashboard",
};

import TopNavbar from "@/components/TopNavbar";
import { Suspense } from "react";

const inter = Inter({
  subsets: ["latin"],
  weight: ["100","200","300","400","500","600","700","800","900"],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <div className="layout-container">
          {children}
        </div>
      </body>
    </html>
  );
}
