import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Menu, Phone, ShoppingBag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CONTACTS, NAV } from '../data'
import { cn, EASE, scrollToId } from '../lib/utils'
import { useScrollLock, useStore } from '../store'
import { Logo } from './ui'


export function Navbar() {
  const { count, setCartOpen } = useStore()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')
  useScrollLock(open)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id))
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = (id: string) => {
    setOpen(false)
    // wait for the scroll lock to release before scrolling
    window.setTimeout(() => scrollToId(id), open ? 60 : 0)
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5">
        <motion.nav
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className={cn(
            'mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 rounded-full pr-2 pl-3 transition-all duration-500 md:pl-4',
            scrolled ? 'glass-strong' : 'border border-transparent',
          )}
          aria-label="Main navigation"
        >
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault()
              go('top')
            }}
            aria-label="EMBER — home"
          >
            <Logo />
          </a>

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    go(item.id)
                  }}
                  className={cn(
                    'relative rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    active === item.id ? 'text-cream' : 'text-smoke hover:text-cream',
                  )}
                >
                  {active === item.id && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/[0.08]"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <a
              href={CONTACTS.phoneHref}
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-smoke transition hover:text-cream xl:inline-flex"
            >
              <Phone className="size-4 text-flame" />
              {CONTACTS.phone}
            </a>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="group relative inline-flex h-12 items-center gap-2 rounded-full bg-white/[0.07] px-4 text-sm font-semibold transition hover:bg-white/[0.12]"
              aria-label={`Cart, ${count} items`}
            >
              <ShoppingBag className="size-[18px] transition-transform group-hover:-rotate-6" />
              <span className="hidden sm:inline">Cart</span>
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                    className="btn-flame grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              type="button"
              onClick={() => go('menu')}
              className="btn-flame hidden h-12 items-center gap-1.5 rounded-full px-5 text-sm font-bold transition hover:brightness-110 md:inline-flex"
            >
              Order now
              <ArrowUpRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid size-12 place-items-center rounded-full bg-white/[0.07] transition hover:bg-white/[0.12] lg:hidden"
              aria-label="Open menu"
              aria-expanded={open}
            >
              <Menu className="size-5" />
            </button>
          </div>
        </motion.nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 bg-coal/70 backdrop-blur-md" onClick={() => setOpen(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              initial={{ y: -30, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="glass-strong relative m-3 overflow-hidden rounded-[32px] p-6"
            >
              <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-flame/30 blur-3xl" />
              <div className="flex items-center justify-between">
                <Logo />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid size-12 place-items-center rounded-full bg-white/[0.08]"
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </button>
              </div>
              <ul className="mt-8 flex flex-col">
                {NAV.map((item, i) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, duration: 0.5, ease: EASE }}
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        go(item.id)
                      }}
                      className="flex items-center justify-between border-b border-white/[0.07] py-4 font-display text-2xl font-semibold tracking-tight"
                    >
                      {item.label}
                      <span className="text-sm font-sans font-medium text-ash">0{i + 1}</span>
                    </a>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-8 grid gap-3">
                <button
                  type="button"
                  onClick={() => go('menu')}
                  className="btn-flame h-14 rounded-full font-bold"
                >
                  Order delivery
                </button>
                <a
                  href={CONTACTS.phoneHref}
                  className="flex h-14 items-center justify-center gap-2 rounded-full bg-white/[0.07] font-semibold"
                >
                  <Phone className="size-4 text-flame" /> {CONTACTS.phone}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
