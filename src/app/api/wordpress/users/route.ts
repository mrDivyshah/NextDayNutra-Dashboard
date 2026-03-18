import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { response } = await requireApiSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const roles = searchParams.get('roles') || 'customer,account_manager';

  const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  const wpUser = process.env.WORDPRESS_API_USER;
  const wpPass = process.env.WORDPRESS_API_PASSWORD;

  if (!wpUrl) {
    return NextResponse.json({ error: "WordPress URL not configured" }, { status: 500 });
  }

  const authHeader = `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString('base64')}`;

  try {
    // Try the custom NDN endpoint first
    const customRes = await fetch(`${wpUrl}/wp-json/ndn/v1/all_users-by-roles?roles=${roles}`, {
      headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (customRes.ok) {
      const users = await customRes.json();
      return NextResponse.json(users);
    }

    console.warn(`[WP API] Custom endpoint not available (${customRes.status}), falling back to standard WP REST API`);

    // Fallback: use standard WP REST API — fetch users for each role
    const roleList = roles.split(',').map(r => r.trim()).filter(Boolean);
    const allUsers: any[] = [];
    const seenIds = new Set<number>();

    for (const role of roleList) {
      // Map custom role names to WP role slugs
      const wpRole = role === 'customer-agent' ? 'customer_agent' : role;
      let page = 1;

      while (true) {
        const res = await fetch(
          `${wpUrl}/wp-json/wp/v2/users?roles=${wpRole}&per_page=100&page=${page}&context=edit`,
          {
            headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
            cache: 'no-store'
          }
        );

        if (!res.ok) {
          console.warn(`[WP API] Role "${wpRole}" returned ${res.status}`);
          break;
        }

        const users: any[] = await res.json();
        if (!Array.isArray(users) || users.length === 0) break;

        for (const u of users) {
          if (!seenIds.has(u.id)) {
            seenIds.add(u.id);
            allUsers.push({
              id: u.id,
              name: u.name,
              display_name: u.name,
              user_email: u.email || '',
              email: u.email || '',
              roles: u.roles || [wpRole],
              client_data: null,
            });
          }
        }

        const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10);
        if (page >= totalPages) break;
        page++;
      }
    }

    if (allUsers.length > 0) {
      return NextResponse.json(allUsers);
    }

    // Return empty array — frontend will fall back to MOCK_CUSTOMERS
    return NextResponse.json([]);
  } catch (error: any) {
    console.error("[WP API Proxy Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
