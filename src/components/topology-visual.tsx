export function TopologyVisual() {
  return (
    <figure className="relative mx-auto w-full max-w-lg" aria-labelledby="topology-caption">
      <svg viewBox="0 0 520 300" role="img" aria-label="A deployment moving through Bower into a healthy Trellis cluster" className="w-full text-primary">
        <defs><linearGradient id="topology" x1="0" x2="1"><stop stopColor="currentColor"/><stop offset="1" stopColor="#52bd8a"/></linearGradient></defs>
        <g fill="none" stroke="url(#topology)" strokeWidth="2" className="topology-line">
          <path d="M76 150H190M230 150h70M340 150h70M320 150l90-74M320 150l90 74" />
        </g>
        <g className="topology-node">
          <rect x="24" y="118" width="108" height="64" rx="12" fill="var(--nav-active)" stroke="var(--nav-border)"/><text x="78" y="145" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">BOWER</text><text x="78" y="165" textAnchor="middle" fill="var(--nav-muted)" fontSize="10">control plane</text>
        </g>
        <g className="topology-node">
          <circle cx="210" cy="150" r="24" fill="var(--accent)"/><path d="m200 150 7 7 14-16" fill="none" stroke="white" strokeWidth="3"/>
        </g>
        <g fill="var(--nav-active)" stroke="#52bd8a" strokeWidth="2">
          <rect className="topology-node" x="408" y="48" width="88" height="56" rx="10"/><rect className="topology-node" x="408" y="122" width="88" height="56" rx="10"/><rect className="topology-node" x="408" y="196" width="88" height="56" rx="10"/>
        </g>
        <g fill="white" fontSize="10" textAnchor="middle"><text x="452" y="81">node 01</text><text x="452" y="155">node 02</text><text x="452" y="229">node 03</text></g>
        <text x="320" y="137" fill="var(--nav-muted)" textAnchor="middle" fontSize="10">scheduled</text><text x="320" y="166" fill="#52bd8a" textAnchor="middle" fontSize="11" fontWeight="600">healthy</text>
      </svg>
      <figcaption id="topology-caption" className="mt-5 text-center text-xs leading-5 text-sidebar-muted">Declarative changes flow through one calm control plane and settle safely across Trellis.</figcaption>
    </figure>
  )
}
