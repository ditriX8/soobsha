import { Flame } from 'lucide-react'

const WORDS = ['Juicy', 'Fire-grilled', 'Fatto a Milano', 'In 30 minutes', 'Made to order', 'Con amore', 'Feel-good food']

function Row({ reverse = false, className }: { reverse?: boolean; className: string }) {
  const items = [...WORDS, ...WORDS]
  return (
    <div className={`flex overflow-hidden py-4 ${className}`}>
      <div className={`marquee-track flex w-max shrink-0 items-center ${reverse ? 'reverse' : ''}`}>
        {[...items, ...items].map((w, i) => (
          <span key={i} className="flex items-center gap-6 pr-6 font-display text-xl font-semibold tracking-tight whitespace-nowrap md:text-3xl">
            {w}
            <Flame className="size-5 md:size-6" />
          </span>
        ))}
      </div>
    </div>
  )
}

export function Marquee() {
  return (
    <div aria-hidden className="relative z-10 -my-4 overflow-hidden py-10">
      <Row className="btn-flame relative z-10 -rotate-2 text-coal" />
      <Row reverse className="absolute inset-x-0 top-1/2 -translate-y-1/2 rotate-2 bg-coal-3 text-smoke/60" />
    </div>
  )
}
