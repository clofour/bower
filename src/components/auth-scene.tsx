export function AuthScene() {
  return (
    <div className="auth-scene" aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="none">
        <path className="auth-path" pathLength="1" d="M-40 735 C 150 625, 295 790, 445 662 S 760 560, 920 664 S 1215 774, 1490 588" />
        <path className="auth-path secondary" pathLength="1" d="M-80 192 C 145 338, 282 165, 470 286 S 790 354, 947 236 S 1238 132, 1510 282" />
        <path className="auth-path" pathLength="1" d="M196 920 C 250 748, 384 739, 480 610 S 600 420, 735 468 S 900 606, 1070 501 S 1245 288, 1450 326" />
        <circle className="auth-node" cx="445" cy="662" r="4.5" />
        <circle className="auth-node alt" cx="920" cy="664" r="4" />
        <circle className="auth-node" cx="470" cy="286" r="4.5" />
        <circle className="auth-node alt" cx="947" cy="236" r="4" />
        <circle className="auth-node" cx="735" cy="468" r="5" />
        <circle className="auth-node alt" cx="1070" cy="501" r="3.8" />
        <rect className="auth-node" x="244" y="728" width="7" height="7" rx="2" />
        <rect className="auth-node alt" x="1227" y="401" width="7" height="7" rx="2" />
      </svg>
    </div>
  )
}
