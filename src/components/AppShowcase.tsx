import { motion, useScroll, useTransform } from 'framer-motion'
import { Bell, ChevronLeft, Heart, Home, Plus, Search, ShoppingBag, SlidersHorizontal, Star, Tag } from 'lucide-react'
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { CATEGORIES, IMAGES, PRODUCTS } from '../data'
import { cn, img, money } from '../lib/utils'
import { useStore } from '../store'
import { InstallApp } from './InstallApp'
import { Glow, Reveal, SectionHeading, Toggle } from './ui'

function Phone({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative w-[260px] shrink-0 rounded-[44px] border border-white/15 bg-coal-2/80 p-2.5 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:w-[280px]',
        className,
      )}
    >
      <div className="relative h-[540px] overflow-hidden rounded-[36px] bg-gradient-to-b from-coal-3 to-coal sm:h-[580px]">
        <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold">
          <span>9:41</span>
          <span className="h-5 w-20 rounded-full bg-black" />
          <span>100%</span>
        </div>
        {children}
      </div>
    </div>
  )
}

const popular = PRODUCTS.filter((p) => ['ember-classic', 'spicy-chicken', 'double-smash'].includes(p.id))

function HomeScreen() {
  return (
    <div className="px-4 pt-3 text-[12px]">
      <div className="flex items-center justify-between">
        <span className="grid size-8 place-items-center rounded-full bg-white/[0.08]">
          <Bell className="size-3.5" />
        </span>
        <img src={img('1500648767791-00dcc994a43e', 80, 80)} alt="" className="size-8 rounded-full object-cover" />
      </div>
      <p className="mt-3 text-smoke">Ciao, Marco 👋</p>
      <p className="font-display text-[22px] leading-[1.05] font-semibold">
        Fire-grilled
        <br />
        <span className="text-flame-gradient">feel-good food!</span>
      </p>
      <div className="mt-3 flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 text-ash">
        <Search className="size-3.5" /> <span className="flex-1">Search dishes</span>
        <SlidersHorizontal className="size-3.5" />
      </div>
      <div className="mt-3 flex gap-1.5">
        {CATEGORIES.map((c, i) => (
          <span
            key={c.id}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[9px]',
              i === 0 ? 'bg-flame/20 ring-1 ring-flame/50' : 'bg-white/[0.05]',
            )}
          >
            <span className="text-base leading-none">{c.emoji}</span>
            {c.label}
          </span>
        ))}
      </div>
      <div className="relative mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-flame/30 to-white/[0.04] p-3">
        <span className="text-[9px] font-semibold text-amber">⚡ Today only</span>
        <p className="font-display text-[15px] leading-tight font-semibold">
          Spicy
          <br />
          <span className="text-amber">Combo</span>
        </p>
        <span className="btn-flame mt-2 inline-block rounded-full px-2.5 py-1 text-[9px] font-bold">Order now</span>
        <img src={img('1594212699903-ec8a3eca50f5', 200, 200)} alt="" className="absolute top-2 -right-3 size-[92px] rounded-full object-cover" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-semibold">Popular now</span>
        <span className="text-[10px] text-ash">View all</span>
      </div>
      <div className="mt-2 flex gap-2">
        {popular.map((p) => (
          <div key={p.id} className="w-[104px] shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5">
            <img src={img(p.image, 200, 160)} alt="" className="h-16 w-full rounded-xl object-cover" />
            <p className="mt-1 truncate text-[10px] font-semibold">{p.name}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber">{money(p.price)}</span>
              <span className="btn-flame grid size-4 place-items-center rounded-md">
                <Plus className="size-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-3 bottom-3 flex justify-around rounded-2xl border border-white/10 bg-white/[0.06] py-2 text-[8px] text-ash backdrop-blur">
        {[
          [Home, 'Home'],
          [Tag, 'Deals'],
          [ShoppingBag, 'Orders'],
          [Heart, 'Saved'],
        ].map(([Icon, l], i) => {
          const I = Icon as typeof Home
          return (
            <span key={l as string} className={cn('flex flex-col items-center gap-0.5', i === 0 && 'text-flame')}>
              <I className="size-3.5" />
              {l as string}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function DetailScreen() {
  const [cheese, setCheese] = useState(true)
  const [patty, setPatty] = useState(false)
  const [bacon, setBacon] = useState(true)
  const [size, setSize] = useState(0)
  const price = 11.9 + [0, 2.5, 4.5][size] + (cheese ? 1.5 : 0) + (patty ? 4 : 0) + (bacon ? 2 : 0)
  return (
    <div className="text-[12px]">
      <div className="relative h-[210px]">
        <img src={img(IMAGES.detail, 600, 440)} alt="" className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-coal-3 to-transparent" />
        <div className="absolute inset-x-3 top-2 flex justify-between">
          <span className="grid size-7 place-items-center rounded-full bg-coal/60 backdrop-blur">
            <ChevronLeft className="size-4" />
          </span>
          <span className="grid size-7 place-items-center rounded-full bg-chili">
            <Heart className="size-3.5 fill-white" />
          </span>
        </div>
      </div>
      <div className="-mt-6 px-4">
        <span className="rounded-full bg-chili px-2 py-0.5 text-[9px] font-bold">Spicy</span>
        <div className="mt-1.5 flex items-start justify-between">
          <p className="font-display text-[15px] leading-tight font-semibold">Spicy Chicken</p>
          <span className="font-bold text-amber">{money(price)}</span>
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-ash">
          <Star className="size-3 fill-amber text-amber" /> 4.8 (972)
        </p>
        <p className="mt-3 text-[11px] font-semibold">Customise</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-smoke">Size</span>
          <div className="flex gap-1">
            {['Reg', 'Lrg', 'XL'].map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(i)}
                className={cn('rounded-full px-2 py-1 text-[9px] font-bold', size === i ? 'btn-flame' : 'bg-white/[0.07] text-smoke')}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {[
          ['Double cheese', cheese, setCheese],
          ['Extra patty', patty, setPatty],
          ['Bacon', bacon, setBacon],
        ].map(([l, v, set]) => (
          <div key={l as string} className="mt-2 flex items-center justify-between">
            <span className="text-smoke">{l as string}</span>
            <span className="origin-right scale-[0.72]">
              <Toggle checked={v as boolean} onChange={set as (b: boolean) => void} label={l as string} />
            </span>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-2 backdrop-blur">
        <span className="flex items-center gap-2 px-1 font-semibold">− 1 +</span>
        <span className="btn-flame flex-1 rounded-xl py-2 text-center text-[11px] font-bold">Add to cart · {money(price)}</span>
      </div>
    </div>
  )
}

export function AppShowcase() {
  const { notify } = useStore()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y1 = useTransform(scrollYProgress, [0, 1], [60, -60])
  const y2 = useTransform(scrollYProgress, [0, 1], [-30, 50])
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 8 || digits.length > 15) {
      setError('Enter a full number, e.g. +39 333 123 4567')
      return
    }
    setError('')
    setPhone('')
    notify({ title: 'Link sent', text: 'Check your SMS for the download link' })
  }

  return (
    <section id="app" className="relative overflow-hidden py-20 md:py-28">
      <Glow className="top-1/3 right-0 size-[560px] bg-flame/15" />
      <div className="container-x grid items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="The EMBER app"
            title={
              <>
                Your favourite burger <span className="text-flame-gradient">in two taps</span>
              </>
            }
            text="Install EMBER straight from this site — no app store, no download wait. Save your perfect builds, track your rider live and collect embers: every 7th burger is on the house."
          />
          <Reveal delay={0.1}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {['Re-order in one tap', 'Live rider tracking on the map', 'Up to 10% back in embers', 'A secret menu for regulars'].map((t) => (
                <li key={t} className="flex items-center gap-3 text-[15px]">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-flame/15 text-amber">
                    <Star className="size-3 fill-current" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-9">
              <InstallApp />
            </div>
            <form onSubmit={submit} noValidate className="mt-8 max-w-md">
              <label htmlFor="sms-phone" className="text-sm font-semibold">
                Or text the link to your phone
              </label>
              <div className={cn('glass mt-2 flex h-14 items-center gap-2 rounded-full pr-1.5 pl-5', error && 'border-chili/60')}>
                <input
                  id="sms-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 333 123 4567"
                  aria-invalid={!!error}
                  aria-describedby="sms-error"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ash"
                />
                <button type="submit" className="btn-flame h-11 rounded-full px-5 text-sm font-bold">
                  Send link
                </button>
              </div>
              <p id="sms-error" role="alert" className="mt-2 min-h-5 text-sm text-chili">
                {error}
              </p>
            </form>
          </Reveal>
        </div>

        <div ref={ref} className="relative flex justify-center gap-5 sm:gap-8">
          <div className="absolute inset-0 m-auto size-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,138,31,0.25),transparent_65%)]" />
          <motion.div style={{ y: y1 }}>
            <Phone className="-rotate-3">
              <HomeScreen />
            </Phone>
          </motion.div>
          <motion.div style={{ y: y2 }} className="hidden sm:block">
            <Phone className="mt-16 rotate-3">
              <DetailScreen />
            </Phone>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
