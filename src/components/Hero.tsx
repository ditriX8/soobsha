import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, Bike, Plus, Rotate3d, Search, SlidersHorizontal, Star } from 'lucide-react'
import { useState, type FormEvent, type MouseEvent } from 'react'
import { CATEGORIES, OPTIONS, PRODUCTS } from '../data'
import { EASE, img, money, scrollToId } from '../lib/utils'
import { DepthPhoto } from './DepthPhoto'

const HERO_IMG = `${import.meta.env.BASE_URL}img/hero-burger.jpg`
const HERO_DEPTH = `${import.meta.env.BASE_URL}img/hero-burger-depth.png`
import { useStore } from '../store'
import { Embers, Glow, Rating } from './ui'

const featured = PRODUCTS.find((p) => p.id === 'spicy-chicken')!

const lineAnim = {
  hidden: { y: '110%' },
  show: (i: number) => ({ y: '0%', transition: { duration: 1, ease: EASE, delay: 0.25 + i * 0.12 } }),
}

export function Hero() {
  const { setQuery, setFilter, addItem, notify, openProduct } = useStore()
  const [search, setSearch] = useState('')
  const [touched, setTouched] = useState(false)

  // mouse parallax for the burger
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 80, damping: 18 })
  const sy = useSpring(my, { stiffness: 80, damping: 18 })
  const cardX = useTransform(sx, (v) => v * -14)
  const cardY = useTransform(sy, (v) => v * -10)

  const onMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setFilter('all')
    setQuery(search.trim())
    scrollToId('menu')
  }

  const quickAdd = () => {
    const size = OPTIONS.burgers.sizes[0]
    addItem({
      key: `${featured.id}|${size.id}|`,
      productId: featured.id,
      name: featured.name,
      image: featured.image,
      unitPrice: featured.price,
      note: size.label,
    })
    notify({ title: 'Added to cart', text: featured.name, image: featured.image })
  }

  return (
    <section
      id="top"
      onMouseMove={onMove}
      className="relative isolate overflow-hidden pt-28 pb-16 md:pt-36 lg:min-h-[100svh] lg:pb-24"
    >
      <Glow className="top-[-10%] right-[-10%] size-[640px] bg-flame/25" />
      <Glow className="bottom-[-20%] left-[-15%] size-[520px] bg-amber/10" />
      <Embers count={22} />

      <div className="container-x relative grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        {/* Copy */}
        <div className="relative z-10 min-w-0">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pr-4 pl-1.5 text-sm text-smoke"
          >
            <span className="rounded-full bg-flame/15 px-2.5 py-0.5 text-xs font-bold text-amber">Aperto</span>
            <span className="hidden sm:inline">Ciao! 👋</span> Grilling in Milan until 1 am
          </motion.p>

          <h1 className="font-display text-[clamp(2.3rem,6.4vw,5.4rem)] leading-[1.02] font-semibold tracking-[-0.04em]">
            {['Fire-grilled,', 'feel-good', 'food.'].map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  custom={i}
                  variants={lineAnim}
                  initial="hidden"
                  animate="show"
                  className={i === 1 ? 'text-flame-gradient inline-block' : 'inline-block'}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.65 }}
            className="mt-6 max-w-[34rem] text-base leading-relaxed text-smoke md:text-lg"
          >
            Piedmontese beef burgers on live charcoal, crispy chicken and Neapolitan pizza — made to order in the heart of
            Milan. Delivered hot in&nbsp;30&nbsp;minutes, or your next one is on us.
          </motion.p>

          {/* Search */}
          <motion.form
            onSubmit={submit}
            role="search"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.75 }}
            className="glass mt-8 flex h-16 max-w-xl items-center gap-2 rounded-full pr-2 pl-5 focus-within:border-flame/50"
          >
            <Search className="size-5 shrink-0 text-smoke" />
            <label htmlFor="hero-search" className="sr-only">
              Search the menu
            </label>
            <input
              id="hero-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find your favourite dish…"
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ash"
            />
            <button
              type="button"
              aria-label="Menu filters"
              onClick={() => scrollToId('menu')}
              className="hidden size-11 place-items-center rounded-full text-smoke transition hover:bg-white/10 hover:text-cream sm:grid"
            >
              <SlidersHorizontal className="size-[18px]" />
            </button>
            <button type="submit" className="btn-flame h-12 rounded-full px-5 text-sm font-bold transition hover:brightness-110">
              Search
            </button>
          </motion.form>

          {/* Category tiles */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.85 } } }}
            className="no-scrollbar -mx-5 mt-6 flex gap-2.5 overflow-x-auto px-5 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
          >
            {CATEGORIES.map((c) => (
              <motion.button
                key={c.id}
                type="button"
                variants={{ hidden: { opacity: 0, y: 14, scale: 0.9 }, show: { opacity: 1, y: 0, scale: 1 } }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setQuery('')
                  setFilter(c.id)
                  scrollToId('menu')
                }}
                className="glass flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors hover:border-flame/40"
              >
                <span className="text-lg leading-none">{c.emoji}</span>
                {c.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/[0.08] pt-6"
          >
            {[
              { k: '4.9', v: '12,400 reviews', icon: true },
              { k: '27 min', v: 'average delivery' },
              { k: '€0', v: 'delivery over €30' },
            ].map((s) => (
              <div key={s.v}>
                <dt className="flex items-center gap-1.5 font-display text-xl font-semibold md:text-2xl">
                  {s.icon && <Star className="size-5 fill-amber text-amber" />}
                  {s.k}
                </dt>
                <dd className="mt-1 text-xs text-ash md:text-sm">{s.v}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Visual */}
        <div className="relative mx-auto aspect-square w-full min-w-0 max-w-[600px]">
          {/* rotating badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: EASE, delay: 0.9 }}
            className="absolute top-[2%] left-[2%] z-30 size-24 md:size-28"
          >
            <button
              type="button"
              onClick={() => scrollToId('offer')}
              className="group relative grid size-full place-items-center"
              aria-label="See today’s combo deal"
            >
              <svg viewBox="0 0 100 100" className="spin-slow absolute inset-0 size-full">
                <defs>
                  <path id="circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
                </defs>
                <text className="fill-cream font-display text-[8.5px] font-semibold uppercase">
                  <textPath href="#circle" textLength="236" lengthAdjust="spacing">
                    Hot • off the fire • juicy •
                  </textPath>
                </text>
              </svg>
              <span className="btn-flame grid size-11 place-items-center rounded-full transition-transform group-hover:scale-110">
                <ArrowRight className="size-5 -rotate-45" />
              </span>
            </button>
          </motion.div>

          {/* plate rings */}
          <div className="absolute inset-[6%] rounded-full border border-white/[0.06]" />
          <div className="absolute inset-[16%] rounded-full border border-white/[0.05] bg-[radial-gradient(circle,rgba(255,138,31,0.22),transparent_65%)]" />

          {/* real photo with depth — turns with the cursor / finger */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: EASE, delay: 0.3 }}
            className="absolute inset-[1%] z-10"
          >
            <DepthPhoto
              src={HERO_IMG}
              depth={HERO_DEPTH}
              alt="Juicy burger with a beef patty, cheese and fresh vegetables"
              mask
              strength={0.065}
              focus={0.6}
              turn={11}
              onInteract={() => setTouched(true)}
              className="size-full"
            />
          </motion.div>

          {/* drag hint */}
          <AnimatePresence>
            {!touched && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: 1.6, duration: 0.6 }}
                className="pointer-events-none absolute top-[6%] left-1/2 z-20 -translate-x-1/2"
              >
                <span className="glass flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-cream">
                  <motion.span animate={{ x: [-4, 4, -4] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
                    <Rotate3d className="size-4 text-amber" />
                  </motion.span>
                  Drag me — I’m 3D
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* floating product card — mirrors an app card */}
          <motion.div
            style={{ x: cardX, y: cardY }}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 1 }}
            className="absolute right-0 -bottom-[3%] z-20 md:right-[-2%]"
          >
            <div className="glass-strong flex w-[250px] items-center gap-3 rounded-3xl p-2.5 pr-3">
              <button
                type="button"
                onClick={() => openProduct(featured)}
                className="shrink-0 overflow-hidden rounded-2xl"
                aria-label={`More about ${featured.name}`}
              >
                <img src={img(featured.image, 160, 160)} alt="" className="size-14 object-cover transition hover:scale-110" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{featured.name}</p>
                <Rating value={featured.rating} className="mt-0.5 text-xs" />
                <p className="mt-0.5 text-sm font-bold text-amber">{money(featured.price)}</p>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.85 }}
                onClick={quickAdd}
                aria-label={`Add ${featured.name} to cart`}
                className="btn-flame grid size-9 shrink-0 place-items-center rounded-xl"
              >
                <Plus className="size-5" />
              </motion.button>
            </div>
          </motion.div>

          {/* delivery tracker card */}
          <motion.div
            style={{ x: cardX, y: cardY }}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 1.15 }}
            className="absolute -bottom-[8%] left-0 z-20 hidden sm:block md:-bottom-[6%]"
          >
            <div className="glass-strong w-[220px] rounded-3xl p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-leaf/15 text-leaf">
                  <Bike className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">Rider on the way</p>
                  <p className="text-xs text-ash">arriving in 12 min · Brera</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="btn-flame h-full rounded-full"
                  initial={{ width: '10%' }}
                  animate={{ width: ['10%', '78%'] }}
                  transition={{ duration: 3.5, delay: 1.4, ease: EASE }}
                />
              </div>
            </div>
          </motion.div>

          {/* discount sticker */}
          <motion.button
            type="button"
            onClick={() => scrollToId('offer')}
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 12 }}
            whileHover={{ rotate: 0, scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 1.25 }}
            className="absolute top-[12%] right-[4%] z-20 grid size-20 place-items-center rounded-full bg-cream text-coal shadow-2xl md:size-24"
            aria-label="20% off combos — details"
          >
            <span className="text-center leading-none">
              <span className="block font-display text-2xl font-bold md:text-[28px]">-20%</span>
              <span className="text-[10px] font-bold tracking-wider uppercase">combos</span>
            </span>
          </motion.button>
        </div>
      </div>
    </section>
  )
}
