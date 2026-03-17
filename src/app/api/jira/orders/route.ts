import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/api-auth';

const CH_JIRA_EMAIL = process.env.JIRA_EMAIL;
const CH_JIRA_TOKEN = process.env.JIRA_TOKEN;
const CH_JIRA_HOST = process.env.JIRA_HOST;

if (!CH_JIRA_EMAIL || !CH_JIRA_TOKEN || !CH_JIRA_HOST) {
  throw new Error('Jira credentials not configured');
}

// In-memory cache representing static key datasets
const jiraApiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 3; // 3 Minutes caching buffer limit


function extractAdfText(node: any, output: string[] = []) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'text' && node.text) {
    output.push(node.text);
  }
  if (node.type === 'hardBreak') {
    output.push('\n');
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      extractAdfText(child, output);
    }
  }
}

export async function GET(request: NextRequest) {
  const { response } = await requireApiSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'client';
  const customerName = searchParams.get('customerName');
  const agentName = searchParams.get('agentName');

  // Build Cache Key from relevant parameters
  const cacheKey = `${view}_${customerName || 'all'}_${agentName || 'all'}`;
  const now = Date.now();
  const cached = jiraApiCache.get(cacheKey);

  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    console.log(`[Cache Hit] Serving from memory for key: ${cacheKey}`);
    return NextResponse.json(cached.data);
  }

  console.log(`[Cache Miss] Fetching fresh Jira inputs for key: ${cacheKey}`);


  let jql = '';
  let fields = [
    'summary', 'status', 'parent', 'issuetype', 'subtasks',
    'customfield_10113', // Sales Order #
    'customfield_10115', // Product Name
    'customfield_10073', // Quantity Ordered
    'customfield_10536', // EST Ship Date
    'customfield_10534', // Notes (ADF)
    'customfield_10140', // Quantity Delivered
    'customfield_10897', // Order Health / Status Value
    'customfield_10930', // Days in Production
    'customfield_10768', // Design Order Date
    'customfield_10767', // Design Delivery Date
    'customfield_10545', // Brand Type / Branding
    'customfield_10501', // Label Size
    'customfield_10544', // Remaining Inventory (Quantity Remaining)
    'customfield_10015', // Start Date
    'customfield_10699', // Initial Inventory
    'customfield_10038', // Customer (Dropdown/Value)
    'customfield_11648', // Unit Price
    'customfield_11574', // Commission %
    'customfield_11575', // Commission Amount
    'customfield_11567', // Order Total
    'customfield_11612', // Final Payment Complete ($)
    'customfield_10051', // Customer Final Payment Received (Date)
    'customfield_10039', // Deposit Received (Date)
    'issuelinks',
    'comment'
  ];

  let customerToAgentMap: Record<string, string> = {};
  const authHeader = `Basic ${Buffer.from(`${CH_JIRA_EMAIL}:${CH_JIRA_TOKEN}`).toString('base64')}`;

  if (view === 'agent' || view === 'internal') {
    let startAt = 0;
    while (true) {
      const cusJql = `project = CUS AND issuetype = Customer AND status = Active`;
      try {
        const cusRes = await fetch(`${CH_JIRA_HOST}/rest/api/3/search/jql`, {
          method: 'POST',
          headers: { 'Authorization': authHeader, 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ jql: cusJql, startAt, maxResults: 100, fields: ['summary', 'customfield_11573'] }),
          cache: 'no-store'
        });
        if (cusRes.ok) {
          const cusData = await cusRes.json();
          for (const issue of (cusData.issues || [])) {
            const rawName = issue.fields.summary || '';
            const cName = rawName.trim();
            const agentField = issue.fields.customfield_11573;
            let agent = 'Unassigned';
            
            if (typeof agentField === 'string') agent = agentField;
            else if (agentField && typeof agentField === 'object') {
              agent = agentField.value || agentField.displayName || agentField.name || 'Unassigned';
            }

            if (agent !== 'Unassigned') {
              customerToAgentMap[cName] = agent;
            }
          }
          if (cusData.total > startAt + 100) {
            startAt += 100;
          } else {
            break;
          }
        } else {
          break;
        }
      } catch (e) {
        console.error("Failed to fetch customer-agent map:", e);
        break;
      }
    }
  }

  if (view === 'internal') {
    jql = 'project=CM';
  } else if (view === 'agent') {
    if (agentName && agentName !== 'All Agents') {
      const filteredNames = Object.entries(customerToAgentMap)
        .filter(([_, agent]) => agent === agentName)
        .map(([name, _]) => `"${name.replace(/"/g, '\\"')}"`);
      
      if (filteredNames.length === 0) {
        return NextResponse.json({ activeOrders: [], completedOrders: [] });
      }
      jql = `project = CM AND issuetype = "Order" AND "Customer" IN (${filteredNames.join(',')}) ORDER BY created DESC`;
    } else {
      const allNames = Object.keys(customerToAgentMap).map(name => `"${name.replace(/"/g, '\\"')}"`);
      if (allNames.length === 0) {
        // If no assigned customers, return empty if we don't want unassigned
        return NextResponse.json({ activeOrders: [], completedOrders: [] });
      } else {
        jql = `project = CM AND issuetype = "Order" AND "Customer" IN (${allNames.join(',')}) ORDER BY created DESC`;
      }
    }
  } else {
    if (!customerName) {
      return NextResponse.json({ error: "customerName is required for client view" }, { status: 400 });
    }
    const cleanName = customerName.trim().replace(/"/g, '\\"');
    jql = `(cf[10038] = "${cleanName}" OR "Customer[Dropdown]" = "${cleanName}")`;
  }

  try {
    let allIssues: any[] = [];
    let nextPageToken: string | undefined = undefined;
    
    while (true) {
      const payload: any = { jql, maxResults: 100, fields };
      if (nextPageToken) payload.nextPageToken = nextPageToken;

      const response = await fetch(`${CH_JIRA_HOST}/rest/api/3/search/jql`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({ error: `Jira request failed: ${errorText}` }, { status: response.status });
      }

      const data = await response.json();
      allIssues = allIssues.concat(data.issues || []);
      if (data.nextPageToken) nextPageToken = data.nextPageToken;
      else break;
    }

    const orderKeys = allIssues.filter(i => i.fields.issuetype?.name === 'Order').map(i => i.key);
    let linkedMap: Record<string, any[]> = {};

    if (orderKeys.length > 0) {
      // Fetch AGENT issues linked to these orders for accurate commission payment tracking
      const linkQueries = orderKeys.map(key => `issue IN linkedIssues(${key})`);
      const linkJql = `(${linkQueries.join(' OR ')}) AND project = AGENT`;
      const linkFields = ['summary', 'status', 'issuelinks', 'customfield_11575', 'customfield_11578'];
      
      const linkRes = await fetch(`${CH_JIRA_HOST}/rest/api/3/search/jql`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ jql: linkJql, maxResults: 100, fields: linkFields }),
        cache: 'no-store'
      });

      if (linkRes.ok) {
        const linkData = await linkRes.json();
        for (const li of (linkData.issues || [])) {
          const status = li.fields.status?.name || 'N/A';
          const amount = parseFloat(li.fields.customfield_11575) || 0;
          const paidDate = li.fields.customfield_11578 || 'N/A';
          const links = li.fields.issuelinks || [];

          for (const link of links) {
            const targetKey = link.inwardIssue?.key || link.outwardIssue?.key;
            if (targetKey && orderKeys.includes(targetKey)) {
              if (!linkedMap[targetKey]) linkedMap[targetKey] = [];
              linkedMap[targetKey].push({ status, amount, paidDate });
            }
          }
        }
      }
    }

    const keyMap: Record<string, any> = {};
    for (const issue of allIssues) if (issue.key) keyMap[issue.key] = issue;

    const groupedOrders: Record<string, { order: any; children: any[] }> = {};

    for (const issue of allIssues) {
      const f = issue.fields || {};
      const key = issue.key || '';
      const type = f.issuetype?.name || '';
      let so = f.customfield_10113;
      if (Array.isArray(so)) so = so.join(', ');
      
      if (['Order', 'Partial Order Info'].includes(type) || type.includes('Order')) {
        const bucket = so || `No-SO-${key}`;
        if (!groupedOrders[bucket]) {
           groupedOrders[bucket] = { order: { ...f, key, so }, children: [] };
        } else {
           groupedOrders[bucket].order = { ...groupedOrders[bucket].order, ...f, key, so }; 
        }
      }
    }

    for (const issue of allIssues) {
      const f = issue.fields || {};
      const parentKey = f.parent?.key;
      if (parentKey && keyMap[parentKey] && f.issuetype?.name === 'Design Order') {
        const parent = keyMap[parentKey];
        const pf = parent.fields || {};
        let so = pf.customfield_10113;
        if (Array.isArray(so)) so = so.join(', ');
        const bucket = so || `No-SO-${parent.key}`;
        if (!groupedOrders[bucket]) {
          groupedOrders[bucket] = { order: { ...pf, key: parent.key, so }, children: [] };
        }
        groupedOrders[bucket].children.push(issue);
      }
    }

    const activeOrders: any[] = [];
    const completedOrders: any[] = [];
    let idCounter = 1;

    for (const [soKey, group] of Object.entries(groupedOrders)) {
      const o = group.order || {};
      const soVal = o.so || soKey;
      const cmKey = o.key || '';
      
      const qtyOrdered = parseFloat(o.customfield_10073) || 0;
      const unitPrice = parseFloat(o.customfield_11648) || 0;
      const commPer = (parseFloat(o.customfield_11574) || 0) / 100;
      const initialInv = parseFloat(o.customfield_10699) || 0;
      const deliveredInv = parseFloat(o.customfield_10140) || 0;
      const remainingInv = parseFloat(o.customfield_10544) || 0;
      const finalPaymentVal = o.customfield_11612;

      let totalCommission = 0;
      if (initialInv === 0) {
        totalCommission = (qtyOrdered * unitPrice) * commPer;
      } else {
        totalCommission = (initialInv * unitPrice) * commPer;
      }

      const linkedComms = linkedMap[cmKey] || [];
      let commPaid = 0;
      let commDue = 0;
      let commissionPaymentHistory: { amount: number, date: string }[] = [];
      
      for (const comm of linkedComms) {
        if (comm.status === 'Paid') {
          commPaid += comm.amount;
          commissionPaymentHistory.push({ amount: comm.amount, date: comm.paidDate });
        } else {
          commDue += comm.amount;
        }
      }
      
      if (commissionPaymentHistory.length > 12) {
        commissionPaymentHistory = commissionPaymentHistory.slice(-12);
      }
      const balanceOwed = Math.max(0, totalCommission - (commPaid + commDue));

      const statusValueRaw = o.customfield_10897;
      const statusValue = statusValueRaw?.value || (typeof statusValueRaw === 'string' ? statusValueRaw : 'White Label Order');
      const workflowStatus = o.status?.name || '-';
      const productName = o.customfield_10115 || 'Unnamed Product';
      
      let customerName = '-';
      const custField = o.customfield_10038;
      if (typeof custField === 'object' && custField !== null) {
         customerName = custField.displayName || custField.name || custField.value || custField.key || '-';
      } else if (typeof custField === 'string') {
         customerName = custField;
      }

      const agent = customerToAgentMap[customerName];
      if (!agent && view === 'agent') continue; // Hide if not in assigned agent list

      const finalPaymentDate = o.customfield_10051;
      const depositDate = o.customfield_10039;
      let paymentStatus = 'UnPaid';
      if (!finalPaymentDate && !depositDate) paymentStatus = 'UnPaid';
      else if (!finalPaymentDate && depositDate) paymentStatus = 'Deposit Paid';
      else if (finalPaymentDate && depositDate) paymentStatus = 'Paid In Full';

      const stLower = statusValue.toLowerCase();
      const wfLower = workflowStatus.toLowerCase();
      const isComplete = stLower === 'white label order' || wfLower === 'final product shipped' || wfLower === 'cancelled';

      const formatDate = (ds: string) => {
        if (!ds) return '-';
        try { return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
        catch { return '-'; }
      };

      const notes: string[] = [];
      const adf = o.customfield_10534;
      if (adf && typeof adf === 'object') {
        const texts: string[] = [];
        extractAdfText(adf, texts);
        const fullText = texts.join('');
        const lines = fullText.split(/\n+/);
        for (let line of lines) { if (line.trim()) notes.push(line.trim()); }
      }

      const lorRequests = (group.children || []).map((child: any) => {
        const cf = child.fields || {};
        return {
          id: child.id,
          date: formatDate(cf.customfield_10768),
          brandType: cf.customfield_10545 || '-',
          status: cf.status?.name || '-',
          qtyOrdered: parseFloat(cf.customfield_10073) || 0,
          qtyDelivered: parseFloat(cf.customfield_10140) || 0,
          deliveryDate: formatDate(cf.customfield_10767),
          labelSize: cf.customfield_10501?.value || '-',
        };
      });

      let healthColor = 'status-pill';
      let icon = 'clock';
      if (stLower.includes('track')) { healthColor = 'status-track'; icon = 'check'; }
      else if (stLower.includes('risk') || stLower.includes('hold')) { healthColor = 'status-hold'; icon = 'alert'; }
      else if (stLower.includes('pending')) { healthColor = 'status-pending'; icon = 'clock'; }
      else if (isComplete || stLower.includes('complete')) { healthColor = 'status-complete'; icon = 'check'; }

      const ord = {
        id: idCounter++,
        highlight: stLower.includes('track') || stLower.includes('risk'),
        health: statusValue,
        healthColor,
        icon,
        so: soVal,
        cmKey,
        product: productName,
        customer: customerName,
        customerNew: 0,
        status: workflowStatus,
        qty: qtyOrdered,
        start: formatDate(o.customfield_10015),
        est: formatDate(o.customfield_10536),
        days: o.customfield_10930 || '-',
        notes,
        initialInv,
        deliveredInv,
        remainingInv,
        lorRequests,
        agentName: agent,
        commissionPercent: (commPer * 100),
        commissionTotal: totalCommission,
        commissionPaid: commPaid,
        commissionDue: commDue,
        commissionBalanceOwed: balanceOwed,
        customerPaymentStatus: paymentStatus,
        quotedOrderTotal: qtyOrdered * unitPrice,
        finalOrderTotal: initialInv * unitPrice,
        unitPrice: unitPrice,
        commissionPaymentHistory
      };

      if (isComplete) completedOrders.push(ord);
      else activeOrders.push(ord);
    }

    const resultData = { activeOrders, completedOrders };
    jiraApiCache.set(cacheKey, { data: resultData, timestamp: Date.now() });

    return NextResponse.json(resultData);

  } catch (error: any) {
    console.error("Jira API Error: ", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
