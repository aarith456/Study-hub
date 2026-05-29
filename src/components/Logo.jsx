/** Minimal ember mark — open book + spark */
export default function Logo({ size = 36, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="48" height="48" rx="14" fill="#141414" stroke="#2a2a2a" strokeWidth="1" />
      <path
        d="M14 34V18l10-6 10 6v16"
        stroke="#ff6b00"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 12v22M14 18l10 6 10-6"
        stroke="#ff6b00"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="33" cy="13" r="4" fill="#ff6b00" />
      <path
        d="M33 9v8M29 13h8"
        stroke="#0a0a0a"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
