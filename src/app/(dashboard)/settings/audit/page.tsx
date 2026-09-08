import { PageHeader, Panel, formatDate } from '@/components/primitives'
import { requireContext } from '@/lib/actions/shared'
import { getAuditLog } from '@/lib/queries'

export default async function AuditPage() {
  const context = await requireContext()
  const entries = await getAuditLog(context.org.id, 100)

  return (
    <>
      <PageHeader
        eyebrow="Organization"
        title="Audit log"
        description="A durable record of Bower mutations: who changed what, when, and with which before/after context."
      />

      <Panel>
        {entries.length ? (
          <div>
            {entries.map((row) => (
              <details className="disclosure" key={row.entry.id}>
                <summary>
                  <div className="truncate">
                    <span className="strong">{row.entry.action.replaceAll('.', ' ')}</span>
                    <span className="muted small"> · {row.entry.resourceType}</span>
                  </div>
                  <span className="small muted">{row.userName || 'system'} · {formatDate(row.entry.createdAt)}</span>
                </summary>
                <div className="disclosure-body">
                  <div className="key-value"><div className="key-label">Resource</div><div className="mono small">{row.entry.resourceId}</div></div>
                  <div className="key-value"><div className="key-label">Actor</div><div>{row.userName || 'System / automation'}</div></div>
                  <div className="key-value"><div className="key-label">Timestamp</div><div>{formatDate(row.entry.createdAt)}</div></div>
                  <div style={{ marginTop: 12 }}>
                    <pre className="code-panel">{JSON.stringify(row.entry.details || {}, null, 2)}</pre>
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : <div className="empty"><div className="empty-title">No audit entries</div><div>Mutations will be recorded here as the organization uses Bower.</div></div>}
      </Panel>
    </>
  )
}
