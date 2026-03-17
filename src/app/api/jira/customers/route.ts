import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/api-auth';

const CH_JIRA_EMAIL = process.env.JIRA_EMAIL;
const CH_JIRA_TOKEN = process.env.JIRA_TOKEN;
const CH_JIRA_HOST = process.env.JIRA_HOST;

if (!CH_JIRA_EMAIL || !CH_JIRA_TOKEN || !CH_JIRA_HOST) {
  throw new Error('Jira credentials not configured');
}

export async function GET(request: NextRequest) {
  const { response } = await requireApiSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'customer';

  // Determine JQL based on requested type
  const activeJql = type === 'agent' ? 'project = AGENT AND status = Active' : 'project = CUS AND status = Active';
  
    const fields = ['summary', 'customfield_11573']; 
    const authHeader = `Basic ${Buffer.from(`${CH_JIRA_EMAIL}:${CH_JIRA_TOKEN}`).toString('base64')}`;
    const result: any[] = [];
    let startAt = 0;

    try {
    while (true) {
      const response = await fetch(`${CH_JIRA_HOST}/rest/api/3/search/jql`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ jql: activeJql, startAt, maxResults: 100, fields }),
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({ error: `Jira request failed: ${errorText}` }, { status: response.status });
      }
      const data = await response.json();
      for (const issue of (data.issues || [])) {
        const name = issue.fields?.summary?.trim();
        if (!name) continue;
        
        let agent = 'Unassigned';
        if (type === 'customer') {
          const af = issue.fields.customfield_11573;
          if (typeof af === 'string') agent = af;
          else if (af && typeof af === 'object') agent = af.value || af.displayName || af.name || 'Unassigned';
        }
        
        result.push(type === 'agent' ? name : { name, agent });
      }

      if (data.total > startAt + 100) startAt += 100;
      else break;
    }

    if (type === 'agent') {
      return NextResponse.json(Array.from(new Set(result)).sort());
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Jira Customer Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
