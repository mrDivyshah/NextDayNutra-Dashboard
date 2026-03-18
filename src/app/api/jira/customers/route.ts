import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

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
  const activeJql = type === 'agent' 
    ? 'project = AGENT AND issuetype = Agent AND status = Active' 
    : 'project = CUS AND issuetype = Customer AND status = Active';
  console.log(`[Jira API] Using JQL: ${activeJql}`);

    const jfields = ['summary', 'customfield_11573'];
    const authHeader = `Basic ${Buffer.from(`${CH_JIRA_EMAIL}:${CH_JIRA_TOKEN}`).toString('base64')}`;
    const result: any[] = [];
    let nextPageToken: string | undefined = undefined;

    try {
    while (true) {
      console.log(`[Jira API] Fetching batch${nextPageToken ? ' with token' : ''}...`);
      const payload: any = { jql: activeJql, maxResults: 100, fields: jfields };
      if (nextPageToken) payload.nextPageToken = nextPageToken;
      console.log('jita payload' + JSON.stringify(payload));
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

        const item = { 
          name, 
          jiraId: issue.key || '',
          agent: agent || 'Unassigned'
        };
        result.push(item);
      }

      if (data.nextPageToken) {
        nextPageToken = data.nextPageToken;
      } else {
        break;
      }
    }

    const finalArray = Array.isArray(result) ? result : [];
    console.log(`[Jira API] Final ${type} result length: ${finalArray.length}`);
    
    if (type === 'agent') {
      const seen = new Set<string>();
      const unique = finalArray.filter((a: any) => {
        if (!a.name || seen.has(a.name)) return false;
        seen.add(a.name);
        return true;
      }).sort((a: any, b: any) => a.name.localeCompare(b.name));
      console.log(`[Jira API] Unique agents: ${unique.length}`);
      return NextResponse.json(unique);
    }

    return NextResponse.json(finalArray);
  } catch (error: any) {
    console.error("[Jira API] Customer Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
