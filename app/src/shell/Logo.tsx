const LOGO_SRC = '/praxis-logo.png'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-lg border border-praxis-hairline bg-praxis-glass-strong/80 shadow-float">
        <img
          src={LOGO_SRC}
          alt="Praxis"
          className="h-7 w-7 object-cover"
          draggable={false}
        />
      </span>
      <span className="praxis-display text-base font-semibold tracking-[0.06em]">Praxis</span>
    </div>
  )
}
