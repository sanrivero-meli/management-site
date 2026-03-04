import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { JiraEpic } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const jiraHost = process.env.JIRA_HOST
  const jiraEmail = process.env.JIRA_EMAIL
  const jiraToken = process.env.JIRA_API_TOKEN

  if (!jiraHost || !jiraEmail || !jiraToken) {
    return NextResponse.json(
      { error: 'Jira configuration missing. Set JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN.' },
      { status: 500 }
    )
  }

  const jql = 'issuetype = Epic AND cf[15603] = 87086 AND NOT statusCategory = Done ORDER BY rank ASC'
  const apiUrl = `https://${jiraHost}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=summary,status,priority&maxResults=100`

  console.log('[JIRA ROUTE] URL:', apiUrl)

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64')}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    console.log('[JIRA ROUTE] Status:', res.status)

    if (!res.ok) {
      const errBody = await res.text()
      console.log('[JIRA ROUTE] Error:', errBody.slice(0, 200))
      return NextResponse.json(
        { error: `Jira API error: ${res.status}`, details: errBody },
        { status: res.status }
      )
    }

    const data = await res.json()

    const epics: JiraEpic[] = (data.issues || []).map((issue: Record<string, unknown>) => {
      const f = issue.fields as Record<string, unknown> | undefined
      const s = f?.status as Record<string, unknown> | undefined
      const p = f?.priority as Record<string, unknown> | undefined
      return {
        id: String(issue.id),
        key: String(issue.key),
        summary: String((f?.summary as string) || ''),
        status: String((s?.name as string) || 'Unknown'),
        priority: String((p?.name as string) || 'Medium'),
      }
    })

    console.log('[JIRA ROUTE] Fetched', epics.length, 'epics')
    return NextResponse.json({ epics })
  } catch (error) {
    console.log('[JIRA ROUTE] Catch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Jira', details: String(error) },
      { status: 500 }
    )
  }
}
