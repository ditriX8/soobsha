import { motion } from 'framer-motion'
import { Check, Copy, Sparkles, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { COMBO, FREE_DELIVERY_FROM } from '../data'
import { depthOf, img, money, scrollToId } from '../lib/utils'
import { DepthPhoto } from './DepthPhoto'
import { useStore } from '../store'
import { Glow, Reveal } from './ui'

function useCountdown() {
  const calc = () => {
    const now = new Date()
    const end = new Date(now)
    end.setHours(24, 0, 0, 0)
    return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))
  }
  const [left, setLeft] = useState(calc)
  useEffect(() => {
    const t = window.setInterval(() => setLeft(calc()), 1000)
    return () => window.clearInterval(t)
  }, [])
  return [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60]
}

export function Offer() {
  const { addItem, notify, setCartOpen } = useStore()
  const [h, m, s] = useCountdown()
  const [copied, setCopied] = useState(false)
  const save = Math.round((1 - COMBO.price / COMBO.oldPrice) * 100)

  const order = () => {
    addItem({
      key: `${COMBO.id}||`,
      productId: COMBO.id,
      name: COMBO.name,
      image: COMBO.image,
      unitPrice: COMBO.price,
      note: COMBO.items,
    })
    notify({ title: 'Combo added 🔥', text: COMBO.name, image: COMBO.image })
    setCartOpen(true)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText('FEELGOOD')
    } catch {
      /* clipboard can be blocked — the code is visible anyway */
    }
    setCopied(true)
    notify({ title: 'Promo code copied', text: 'FEELGOOD — paste it in your cart' })
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="offer" className="relative py-16 md:py-24">
      <div className="container-x">
        <Reveal>
          <div className="glass relative isolate overflow-hidden rounded-[36px] md:rounded-[44px]">
            <Glow className="-top-40 -left-20 size-[480px] bg-flame/35" />
            <Glow className="right-0 -bottom-40 size-[420px] bg-amber/15" />
            <div className="grid items-center gap-6 p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:p-14">
              <div className="relative z-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-flame/15 px-3.5 py-1.5 text-xs font-bold tracking-wide text-amber">
                  <Sparkles className="size-3.5" /> Today only
                </span>
                <h2 className="mt-5 font-display text-[clamp(2.2rem,5.5vw,4.4rem)] leading-[0.98] font-semibold tracking-[-0.04em]">
                  {COMBO.name.split(' ')[0]} <span className="text-flame-gradient">{COMBO.name.split(' ')[1]}</span>
                </h2>
                <p className="mt-4 max-w-md text-smoke md:text-lg">{COMBO.items}. The perfect pranzo when you are craving something fiery.</p>

                <div className="mt-6 flex items-end gap-4">
                  <span className="font-display text-4xl font-semibold md:text-5xl">{money(COMBO.price)}</span>
                  <span className="pb-1.5 text-lg text-ash line-through">{money(COMBO.oldPrice)}</span>
                </div>

                <div className="mt-7 flex items-center gap-2" aria-label="Time left on this deal">
                  {[
                    [h, 'hrs'],
                    [m, 'min'],
                    [s, 'sec'],
                  ].map(([v, l], i) => (
                    <div key={l} className="flex items-center gap-2">
                      <div className="grid w-16 place-items-center rounded-2xl border border-white/10 bg-coal/50 py-2.5 md:w-[74px]">
                        <motion.span key={v} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-2xl font-semibold tabular-nums md:text-3xl">
                          {String(v).padStart(2, '0')}
                        </motion.span>
                        <span className="text-[10px] tracking-widest text-ash uppercase">{l}</span>
                      </div>
                      {i < 2 && <span className="font-display text-xl text-ash">:</span>}
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={order}
                    className="btn-flame h-14 rounded-full px-8 font-bold transition hover:brightness-110"
                  >
                    Order the combo
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => scrollToId('menu')}
                    className="h-14 rounded-full border border-white/15 px-7 font-semibold transition hover:bg-white/[0.07]"
                  >
                    Full menu
                  </button>
                </div>
              </div>

              <div className="relative mx-auto aspect-square w-full max-w-[460px]">
                <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(255,138,31,0.35),transparent_68%)]" />
                <motion.div
                  initial={{ rotate: -10, scale: 0.9 }}
                  whileInView={{ rotate: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="relative size-full overflow-hidden rounded-full shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
                >
                  <DepthPhoto
                    src={img(COMBO.image, 900, 900)}
                    depth={depthOf(COMBO.image)}
                    alt="Combo: burger, fries and a drink"
                    strength={0.035}
                    focus={0.5}
                    turn={0}
                    zoom={1.1}
                    className="size-full"
                  />
                </motion.div>
                <motion.div
                  animate={{ rotate: [0, 6, 0, -6, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="btn-flame absolute top-[4%] right-[2%] grid size-24 place-items-center rounded-full md:size-28"
                >
                  <span className="text-center leading-none">
                    <span className="block font-display text-3xl font-bold">{save}%</span>
                    <span className="text-xs font-bold tracking-widest uppercase">saving</span>
                  </span>
                </motion.div>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Reveal delay={0.05}>
            <div className="glass flex h-full flex-wrap items-center justify-between gap-4 rounded-[28px] p-6">
              <div>
                <p className="text-sm text-smoke">Your first online order</p>
                <p className="mt-1 font-display text-xl font-semibold">15% off with a code</p>
              </div>
              <button
                type="button"
                onClick={copy}
                className="group flex h-12 items-center gap-3 rounded-2xl border border-dashed border-flame/60 bg-flame/10 px-4 font-display font-semibold tracking-wider text-amber transition hover:bg-flame/20"
                aria-label="Copy promo code FEELGOOD"
              >
                FEELGOOD
                {copied ? <Check className="size-4 text-leaf" /> : <Copy className="size-4 opacity-70 group-hover:opacity-100" />}
              </button>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="glass flex h-full items-center gap-4 rounded-[28px] p-6">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-leaf/15 text-leaf">
                <Truck className="size-6" />
              </span>
              <div>
                <p className="font-display text-xl font-semibold">Free delivery</p>
                <p className="mt-1 text-sm text-smoke">on orders over {money(FREE_DELIVERY_FROM)} anywhere in our Milan delivery zone</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
