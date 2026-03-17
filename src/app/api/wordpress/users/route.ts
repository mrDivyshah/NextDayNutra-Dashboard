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

  try {
    const authHeader = `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString('base64')}`;
    
    // Using the custom endpoint added by the user in WordPress
    // This endpoint is more efficient and doesn't require "edit_users" permissions
    const response = await fetch(`${wpUrl}/wp-json/ndn/v1/all_users-by-roles?roles=${roles}`, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `WordPress fetch failed: ${errText}` }, { status: response.status });
    }

    const users = await response.json();
    return NextResponse.json(users);
  } catch (error: any) {
    console.error("WP API Proxy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
