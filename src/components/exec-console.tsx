'use client'

import { FormEvent, useState, useTransition } from 'react'
import { execAllocationAction } from '@/lib/actions/services'

export function ExecConsole({
  serviceId,
  allocationId,
  tasks,
}: {
  serviceId: string
  allocationId: string
  tasks: string[]
}) {
  const [output, setOutput] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [pending, startTransition] = useTransition()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const task = String(formData.get('task') ?? '')
    const raw = String(formData.get('command') ?? '').trim()
    if (!task || !raw) return
    const command = raw.split(/\s+/).filter(Boolean)
    setError('')
    startTransition(async () => {
      try {
        const result = await execAllocationAction(serviceId, allocationId, task, command)
        setOutput(
          [
            result.stdout ? result.stdout : '',
            result.stderr ? result.stderr : '',
            'exit ' + result.exit_code,
          ].filter(Boolean).join('\n'),
        )
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Exec failed.')
      }
    })
  }

  return (
    <div className="stack">
      <form className="row" onSubmit={submit}>
        <select className="select" name="task" defaultValue={tasks[0] ?? ''} style={{ maxWidth: 190 }}>
          {tasks.map((task) => <option key={task} value={task}>{task}</option>)}
        </select>
        <input className="input mono" name="command" placeholder="sh -lc env" required style={{ flex: 1, minWidth: 210 }} />
        <button className="button button-primary" type="submit" disabled={pending || tasks.length === 0}>{pending ? 'Running…' : 'Run'}</button>
      </form>
      {error ? <div className="callout danger">{error}</div> : null}
      {output ? <pre className="code-panel">{output}</pre> : null}
    </div>
  )
}
