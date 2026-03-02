'use client'

import { ExternalLink } from 'lucide-react'

interface JiraLinkProps {
  href: string
}

export function JiraLink({ href }: JiraLinkProps) {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/6a666826-67e0-4db2-b6d6-650a30f83504',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'jira-link.tsx:render',message:'JiraLink rendering anchor tag',data:{href},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2'})}).catch(()=>{});
  // #endregion
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
    >
      <ExternalLink className="h-3 w-3" />
      View in Jira
    </a>
  )
}
