import { ArrowUp, Mail, Phone } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { CATEGORIES, CONTACTS, NAV } from '../data'
import { cn, scrollToId } from '../lib/utils'
import { useStore } from '../store'
import { Embers, Logo } from './ui'

const YEAR = new Date().getFullYear()

export function Footer() {
  const { notify, setFilter, setQuery } = useStore()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const subscribe = (e: FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError('That email address looks off')
      return
    }
    setError('')
    setEmail('')
    notify({ title: 'You are subscribed 🔥', text: 'First to hear about new dishes and secret codes' })
  }

  return (
    <footer className="relative isolate overflow-hidden border-t border-white/[0.07] pt-20 pb-28 md:pb-10">
      <Embers count={10} />
      <div className="container-x relative">
        <div className="glass grid gap-8 rounded-[36px] p-7 md:grid-cols-[1.2fr_1fr] md:items-center md:p-10">
          <div>
            <h2 className="font-display text-[clamp(1.6rem,3.4vw,2.6rem)] leading-tight font-semibold tracking-[-0.03em]">
              New dishes & promo codes — <span className="text-flame-gradient">before anyone</span>
            </h2>
            <p className="mt-3 text-smoke">One email a week. No spam, only tasty things.</p>
          </div>
          <form onSubmit={subscribe} noValidate>
            <div className={cn('flex h-14 items-center gap-2 rounded-full border bg-coal/50 pr-1.5 pl-5', error ? 'border-chili/60' : 'border-white/10 focus-within:border-flame/50')}>
              <Mail className="size-4 shrink-0 text-ash" />
              <label htmlFor="newsletter" className="sr-only">
                Email
              </label>
              <input
                id="newsletter"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mail.ru"
                aria-invalid={!!error}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ash"
              />
              <button type="submit" className="btn-flame h-11 rounded-full px-5 text-sm font-bold">
                Subscribe
              </button>
            </div>
            <p role="alert" className="mt-2 min-h-5 pl-5 text-sm text-chili">
              {error}
            </p>
          </form>
        </div>

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-smoke">
              Fire-grilled burgers in the heart of Milan since 2019. Honest food, delivered fast.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {CONTACTS.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-smoke transition hover:border-flame/50 hover:text-cream"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-ash uppercase">Menu</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setFilter(c.id)
                      scrollToId('menu')
                    }}
                    className="text-smoke transition hover:text-cream"
                  >
                    {c.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-ash uppercase">Explore</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {NAV.map((n) => (
                <li key={n.id}>
                  <a
                    href={`#${n.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToId(n.id)
                    }}
                    className="text-smoke transition hover:text-cream"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-ash uppercase">Contact</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href={CONTACTS.phoneHref} className="flex items-center gap-2 font-semibold transition hover:text-amber">
                  <Phone className="size-4 text-flame" /> {CONTACTS.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACTS.email}`} className="flex items-center gap-2 text-smoke transition hover:text-cream">
                  <Mail className="size-4 text-flame" /> {CONTACTS.email}
                </a>
              </li>
              <li className="text-ash">Delivery daily 11:30 am – 1:00 am</li>
            </ul>
          </div>
        </div>

        <p aria-hidden className="pointer-events-none mt-16 text-center font-display text-[clamp(4rem,15vw,15rem)] leading-[0.8] font-bold tracking-[-0.06em] text-white/[0.03] select-none">
          EMBER
        </p>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-white/[0.07] pt-6 text-xs text-ash sm:flex-row">
          <p>© {YEAR} EMBER Milano · P.IVA 12345678901. All rights reserved.</p>
          <button
            type="button"
            onClick={() => scrollToId('top')}
            className="group flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 font-semibold text-smoke transition hover:border-flame/50 hover:text-cream"
          >
            Back to top <ArrowUp className="size-3.5 transition group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  )
}
