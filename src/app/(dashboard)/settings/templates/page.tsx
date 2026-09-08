import { Box, Plus, Trash2 } from 'lucide-react'
import { PageHeader, Panel, Pill, formatDate } from '@/components/primitives'
import { requireContext } from '@/lib/actions/shared'
import { createTemplateAction, deleteTemplateAction } from '@/lib/actions/operations'
import { getTemplates } from '@/lib/queries'

export default async function TemplatesPage() {
  const context = await requireContext()
  const templates = await getTemplates(context.org.id)
  const canEdit = context.role !== 'member'

  return (
    <>
      <PageHeader
        eyebrow="Service creation"
        title="Templates"
        description="Reusable starting points for Bower services. Templates set defaults; they never lock the resulting configuration."
      />

      <div className="grid grid-2">
        {templates.map((template) => (
          <Panel
            key={template.id}
            title={<span className="row"><Box size={15} />{template.name}{template.isBuiltin ? <Pill tone="accent">built in</Pill> : <Pill>organization</Pill>}</span>}
            subtitle={template.description || template.type}
            action={canEdit && !template.isBuiltin && template.orgId ? (
              <form action={deleteTemplateAction.bind(null, template.id)}>
                <button className="button button-danger button-sm" type="submit"><Trash2 size={12} />Delete</button>
              </form>
            ) : undefined}
          >
            <div className="key-value"><div className="key-label">Service type</div><div style={{ textTransform: 'capitalize' }}>{template.type}</div></div>
            <div className="key-value"><div className="key-label">Created</div><div>{formatDate(template.createdAt)}</div></div>
            <details className="disclosure" style={{ margin: '12px -18px -18px' }}>
              <summary>Template configuration</summary>
              <div className="disclosure-body"><pre className="code-panel">{JSON.stringify(template.config, null, 2)}</pre></div>
            </details>
          </Panel>
        ))}
      </div>

      {canEdit ? (
        <div style={{ marginTop: 16 }}>
          <Panel title={<span className="row"><Plus size={15} />Create organization template</span>} subtitle="Useful for common images and deployment conventions unique to your team.">
            <form action={createTemplateAction} className="form-grid">
              <div className="field">
                <label>Name</label>
                <input className="input" name="name" placeholder="Internal API" required />
              </div>
              <div className="field">
                <label>Type</label>
                <select className="select" name="type" defaultValue="web">
                  <option value="web">Web</option>
                  <option value="worker">Worker</option>
                  <option value="cron">Cron</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="field form-span">
                <label>Description</label>
                <input className="input" name="description" placeholder="Our standard internal HTTP service" />
              </div>
              <div className="field form-span">
                <label>Default image</label>
                <input className="input mono" name="image" placeholder="ghcr.io/acme/base:latest" />
              </div>
              <div className="field">
                <label>Port</label>
                <input className="input" name="port" type="number" min="1" max="65535" defaultValue="8080" />
              </div>
              <div className="field">
                <label>Replicas</label>
                <input className="input" name="replicas" type="number" min="0" defaultValue="1" />
              </div>
              <div className="field form-span">
                <label>Additional configuration · JSON</label>
                <textarea className="textarea mono" name="config" placeholder={'{\n  "deploymentStrategy": "rolling",\n  "healthCheckPath": "/health"\n}'} />
              </div>
              <div className="form-actions">
                <button className="button button-primary" type="submit">Create template</button>
              </div>
            </form>
          </Panel>
        </div>
      ) : null}
    </>
  )
}
