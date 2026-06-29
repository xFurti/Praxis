const LOGO_SRC = '/praxis-logo.png'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg">
        <img
          src={LOGO_SRC}
          alt="Praxis"
          className="h-9 w-9 object-cover"
          draggable={false}
        />
      </span>
      <span className="praxis-display text-lg font-semibold tracking-wide">Praxis</span>
    </div>
  )
}
