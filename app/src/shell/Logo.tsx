export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-tech-magic shadow-glow">
        <span className="font-display text-lg font-bold text-praxis-navy">P</span>
      </span>
      <span className="praxis-display text-lg font-semibold tracking-wide">Praxis</span>
    </div>
  )
}
