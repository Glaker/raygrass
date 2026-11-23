export function Logo({ className = 'size-9' }: { className?: string }) {
  return <img src="/favicon.svg" alt="" className={className} />
}

export function Marca() {
  return (
    <div className="flex items-center gap-2.5">
      <Logo />
      <span className="font-display text-[1.6rem] font-bold tracking-tight">RayGrass</span>
    </div>
  )
}
