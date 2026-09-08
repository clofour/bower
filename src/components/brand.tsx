export function Brand({ light = false }: { light?: boolean }) {
  const stroke = light ? '#d7eee7' : '#0f766e'
  const fill = light ? '#73c5b4' : '#10201c'
  return (
    <span className="brand" aria-label="Bower">
      <svg className="brand-mark" viewBox="0 0 32 32" role="img" aria-hidden="true">
        <path d="M6.5 23.5V13.1L16 7l9.5 6.1v10.4" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.2 25V16.4L16 12.7l5.8 3.7V25" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity=".68" />
        <path d="M6 25.5h20" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="16" cy="7" r="2.25" fill={fill} />
      </svg>
      <span className="brand-word">bower</span>
    </span>
  )
}
