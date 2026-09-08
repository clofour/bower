import Link from 'next/link'
export function Brand({ light = false }: { light?: boolean }) { return <Link href="/dashboard" className="brand" style={light ? { color: 'white' } : undefined}><span className="brand-mark">◇</span><span>Bower</span></Link> }
