import { motion, type HTMLMotionProps } from 'framer-motion'
import { Minus, Plus, Star } from 'lucide-react'
import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { cn, EASE } from '../lib/utils'

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  ...rest
}: { children: ReactNode; delay?: number; y?: number } & HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-amber uppercase',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-flame shadow-[0_0_10px_2px_rgba(255,138,31,0.7)]" />
      {children}
    </span>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  align = 'left',
  aside,
}: {
  eyebrow: string
  title: ReactNode
  text?: string
  align?: 'left' | 'center'
  aside?: ReactNode
}) {
  return (
    <div
      className={cn(
        'mb-10 flex flex-col gap-6 md:mb-14',
        align === 'center' ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between',
      )}
    >
      <Reveal className={cn('max-w-2xl', align === 'center' && 'flex flex-col items-center')}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-5 font-display text-[clamp(1.9rem,4.2vw,3.4rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance">
          {title}
        </h2>
        {text && <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-smoke md:text-base">{text}</p>}
      </Reveal>
      {aside && <Reveal delay={0.1}>{aside}</Reveal>}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-300',
        checked ? 'bg-flame shadow-[0_0_18px_-2px_rgba(255,138,31,0.7)]' : 'bg-white/12',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 34 }}
        className={cn('size-5 rounded-full bg-white shadow-md', checked && 'ml-auto')}
      />
    </button>
  )
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md'
}) {
  const btn = size === 'sm' ? 'size-7' : 'size-10'
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] p-1">
      <button
        type="button"
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={cn(btn, 'grid place-items-center rounded-full transition hover:bg-white/10 disabled:opacity-30')}
      >
        <Minus className="size-4" />
      </button>
      <motion.span
        key={value}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn('text-center font-semibold tabular-nums', size === 'sm' ? 'w-6 text-sm' : 'w-8')}
      >
        {value}
      </motion.span>
      <button
        type="button"
        aria-label="Increase"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={cn(btn, 'grid place-items-center rounded-full transition hover:bg-white/10 disabled:opacity-30')}
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  layoutId,
}: {
  options: { id: T; label: string; hint?: string }[]
  value: T
  onChange: (v: T) => void
  layoutId: string
}) {
  return (
    <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1" role="radiogroup">
      {options.map((o) => {
        const active = o.id === value
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={cn(
              'relative flex-1 rounded-full px-3 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors',
              active ? 'text-coal' : 'text-smoke hover:text-cream',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="btn-flame absolute inset-0 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{o.label}</span>
            {o.hint && <span className={cn('relative ml-1 text-[11px]', active ? 'text-coal/70' : 'text-ash')}>{o.hint}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-[13px] font-semibold', className)}>
      <Star className="size-3.5 fill-amber text-amber" />
      {value.toFixed(1)}
      {count !== undefined && <span className="font-normal text-ash">({count})</span>}
    </span>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 64 64" className="size-9" aria-hidden>
        <defs>
          <linearGradient id="logo-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFB547" />
            <stop offset="1" stopColor="#FF6A1A" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="18" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
        <path
          d="M32 12c2 8 12 12 12 24a12 12 0 0 1-24 0c0-6 3-9 5-12 1 4 3 6 5 6-2-6 0-12 2-18z"
          fill="url(#logo-g)"
        />
      </svg>
      <span className="font-display text-lg font-bold tracking-[0.08em]">EMBER</span>
    </span>
  )
}

/** Warm blurred light blobs used as section backdrops (bokeh from the reference). */
export function Glow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute rounded-full bg-flame/30 blur-[120px]', className)}
    />
  )
}

export function Embers({ count = 18 }: { count?: number }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r = (n: number) => ((Math.sin(i * 9301 + n * 49297) + 1) / 2) // deterministic pseudo-random
        return {
          left: `${r(1) * 100}%`,
          size: 2 + r(2) * 5,
          duration: 7 + r(3) * 9,
          delay: r(4) * -16,
          drift: `${(r(5) - 0.5) * 160}px`,
        }
      }),
    [count],
  )
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d, i) => (
        <span
          key={i}
          className="ember-dot"
          style={
            {
              left: d.left,
              width: d.size,
              height: d.size,
              animationDuration: `${d.duration}s`,
              animationDelay: `${d.delay}s`,
              '--drift': d.drift,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
