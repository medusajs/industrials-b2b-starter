interface ProLiftMarkProps {
  className?: string
  /** Color of the icon paths. Defaults to currentColor so it inherits from parent text color. */
  color?: string
  /** Background color of the rounded square container. Pass null to omit the background. */
  bg?: string | null
  /** Size of the container in px. Defaults to 40. */
  size?: number
}

function ForkliftPaths({ color, bg }: { color: string; bg: string }) {
  return (
    <g transform="translate(44, 0)">
      {/* Body */}
      <rect x="160" y="230" width="200" height="110" rx="12" fill={color} />
      {/* Cab */}
      <rect x="290" y="170" width="70" height="70" rx="10" fill={color} />
      {/* Cab window */}
      <rect x="302" y="182" width="46" height="46" rx="6" fill={bg} />
      {/* Counterweight */}
      <rect x="340" y="270" width="30" height="50" rx="8" fill={color} opacity="0.7" />
      {/* Mast uprights */}
      <rect x="112" y="110" width="22" height="220" rx="5" fill={color} />
      <rect x="152" y="110" width="22" height="220" rx="5" fill={color} />
      {/* Carriage cross-bar */}
      <rect x="108" y="195" width="70" height="18" rx="4" fill={color} opacity="0.7" />
      {/* Fork tines */}
      <rect x="54" y="325" width="112" height="16" rx="4" fill={color} />
      <rect x="54" y="355" width="112" height="16" rx="4" fill={color} />
      {/* Front wheel */}
      <circle cx="210" cy="360" r="38" fill={bg} stroke={color} strokeWidth="14" />
      <circle cx="210" cy="360" r="12" fill={color} />
      {/* Rear wheel */}
      <circle cx="330" cy="360" r="28" fill={bg} stroke={color} strokeWidth="12" />
      <circle cx="330" cy="360" r="9" fill={color} />
    </g>
  )
}

/**
 * ProLift icon mark — forklift side-profile SVG used as a logo badge.
 * Renders a rounded-square container (like an app icon) with the mark inside.
 * Use `bg={null}` to render the raw SVG without a container.
 */
export function ProLiftMark({ className, color = "#0d9488", bg = "#0f172a", size = 40 }: ProLiftMarkProps) {
  const resolvedBg = bg ?? "#0f172a"

  if (bg === null) {
    return (
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <ForkliftPaths color={color} bg="#0f172a" />
      </svg>
    )
  }

  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size, background: resolvedBg, borderRadius: Math.round(size * 0.2) }}
    >
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "80%", height: "80%" }}
        aria-hidden="true"
      >
        <ForkliftPaths color={color} bg={resolvedBg} />
      </svg>
    </div>
  )
}
