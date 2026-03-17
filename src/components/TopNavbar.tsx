"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Session } from "next-auth";
import { LogoutButton } from "@/components/AuthButtons";

export default function TopNavbar({ session }: { session: Session | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'customers';

  if (pathname === "/login" || pathname.startsWith("/super-admin") || pathname.startsWith("/v2")) {
    return null;
  }

  return (
    <header className="top-navbar">
      <nav className="top-nav-tabs">
        <Link 
          href="/?tab=customers" 
          className={`tab ${currentTab === 'customers' ? 'active' : ''}`}
        >
          Customers
        </Link>
        <Link 
          href="/?tab=agents" 
          className={`tab ${currentTab === 'agents' ? 'active' : ''}`}
        >
          Agents
        </Link>
        <Link 
          href="/?tab=internal" 
          className={`tab ${currentTab === 'internal' ? 'active' : ''}`}
        >
          Multi location
        </Link>
        <Link 
          href="/?tab=internal" 
          className={`tab ${currentTab === 'internal' ? 'active' : ''}`}
        >
          Executive
        </Link>
        {session?.user?.role === "super_admin" && (
          <Link href="/super-admin" className={`tab ${pathname === "/super-admin" ? "active" : ""}`}>
            Super Admin
          </Link>
        )}
      </nav>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12, paddingRight: 16 }}>
        {session && (
          <>
            <span style={{ color: "#dbe7f3", fontSize: 13 }}>
              {session.user?.name}
            </span>
            <LogoutButton />
          </>
        )}
      </div>
    </header>
  );
}
