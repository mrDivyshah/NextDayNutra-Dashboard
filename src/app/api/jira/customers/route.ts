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

  console.log(`[Jira API] Fetching ${type} data...`);

  // Determine JQL based on requested type
  const activeJql = type === 'agent' ? 'project = AGENT AND status = Active' : 'project = CUS AND status = Active';
  console.log(`[Jira API] Using JQL: ${activeJql}`);

    const fields = ['summary', 'customfield_11573'];
    const authHeader = `Basic ${Buffer.from(`${CH_JIRA_EMAIL}:${CH_JIRA_TOKEN}`).toString('base64')}`;
    const result: any[] = [];
    let nextPageToken: string | undefined = undefined;

    try {
    while (true) {
      console.log(`[Jira API] Fetching batch${nextPageToken ? ` (token: ${nextPageToken})` : ' (first page)'}...`);
      const payload: any = { jql: activeJql, maxResults: 100, fields };
      if (nextPageToken) payload.nextPageToken = nextPageToken;

      const response = await fetch(`${CH_JIRA_HOST}/rest/api/3/search/jql`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Jira API] Request failed with status ${response.status}:`, errorText);
        return NextResponse.json({ error: `Jira request failed: ${errorText}` }, { status: response.status });
      }
      const data = await response.json();
      console.log(`[Jira API] Received ${data.issues?.length || 0} issues in this batch`);

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

      if (data.nextPageToken) nextPageToken = data.nextPageToken;
      else break;
    }

    console.log(`[Jira API] Total ${type} results: ${result.length}`);
    if (type === 'agent') {
      return NextResponse.json(Array.from(new Set(result)).sort());
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Jira API] Customer Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
