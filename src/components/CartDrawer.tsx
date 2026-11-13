import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Banknote,
  CircleCheck,
  CreditCard,
  LoaderCircle,
  Plus,
  ShoppingBag,
  Smartphone,
  Tag,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { FREE_DELIVERY_FROM, OPTIONS, PRODUCTS, PROMO_CODES } from '../data'
import { cn, EASE, img, money, plural, scrollToId } from '../lib/utils'
import { useScrollLock, useStore } from '../store'
import { Segmented, Stepper } from './ui'

type Step = 'cart' | 'checkout' | 'done'

export function CartDrawer() {
  const { cartOpen, setCartOpen } = useStore()
  const [step, setStep] = useState<Step>('cart')
  const [order, setOrder] = useState<{ id: string; eta: string; mode: 'delivery' | 'pickup' } | null>(null)
  useScrollLock(cartOpen)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCartOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCartOpen])

  const close = () => {
    setCartOpen(false)
    if (step === 'done') window.setTimeout(() => setStep('cart'), 400)
  }

  return (
    <AnimatePresence>
      {cartOpen && (
        <motion.div className="fixed inset-0 z-[80]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Cart"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.55, ease: EASE }}
            className="glass-strong absolute top-0 right-0 flex h-full w-full max-w-[480px] flex-col sm:top-3 sm:right-3 sm:h-[calc(100%-1.5rem)] sm:rounded-[32px]"
          >
            <AnimatePresence mode="wait" initial={false}>
              {step === 'cart' && <CartStep key="cart" onClose={close} onNext={() => setStep('checkout')} />}
              {step === 'checkout' && (
                <CheckoutStep
                  key="checkout"
                  onBack={() => setStep('cart')}
                  onDone={(o) => {
                    setOrder(o)
                    setStep('done')
                  }}
                />
              )}
              {step === 'done' && order && <DoneStep key="done" order={order} onClose={close} />}
            </AnimatePresence>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Pane({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="flex min-h-0 flex-1 flex-col"
    >
      {children}
    </motion.div>
  )
}

function Header({ title, onBack, onClose }: { title: string; onBack?: () => void; onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Back" className="grid size-10 place-items-center rounded-full bg-white/[0.07] hover:bg-white/[0.12]">
            <ArrowLeft className="size-4" />
          </button>
        )}
        <h2 className="font-display text-xl font-semibold">{title}</h2>
      </div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Close cart" className="grid size-10 place-items-center rounded-full bg-white/[0.07] hover:bg-white/[0.12]">
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

function Totals() {
  const { subtotal, discount, delivery, total, promo } = useStore()
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between text-smoke">
        <dt>Subtotal</dt>
        <dd className="tabular-nums">{money(subtotal)}</dd>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-leaf">
          <dt>Discount {promo}</dt>
          <dd className="tabular-nums">−{money(discount)}</dd>
        </div>
      )}
      <div className="flex justify-between text-smoke">
        <dt>Delivery</dt>
        <dd className="tabular-nums">{delivery ? money(delivery) : 'Free'}</dd>
      </div>
      <div className="flex justify-between pt-1 font-display text-lg font-semibold">
        <dt>Total</dt>
        <dd className="tabular-nums">{money(total)}</dd>
      </div>
    </dl>
  )
}

function CartStep({ onClose, onNext }: { onClose: () => void; onNext: () => void }) {
  const { cart, count, subtotal, setQty, removeItem, promo, applyPromo, removePromo, addItem, notify } = useStore()
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const left = Math.max(0, FREE_DELIVERY_FROM - subtotal)
  const pct = Math.min(100, (subtotal / FREE_DELIVERY_FROM) * 100)

  const upsell = PRODUCTS.filter((p) => (p.category === 'drinks' || p.category === 'fries') && !cart.some((c) => c.productId === p.id)).slice(0, 4)

  const submitCode = (e: FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    if (applyPromo(code)) {
      setCodeError('')
      setCode('')
      notify({ title: 'Promo code applied', text: `${Math.round((PROMO_CODES[code.trim().toUpperCase()] ?? 0) * 100)}% off` })
    } else setCodeError('That code doesn’t exist. Try FEELGOOD')
  }

  return (
    <Pane>
      <Header title={count ? `Cart · ${count} ${plural(count, 'item', 'items')}` : 'Cart'} onClose={onClose} />
      {cart.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-flame/10">
            <ShoppingBag className="size-9 text-flame" />
          </span>
          <p className="mt-5 font-display text-xl font-semibold">Your cart is empty</p>
          <p className="mt-2 text-sm text-smoke">The perfect moment to pick something hot off the grill.</p>
          <button
            type="button"
            onClick={() => {
              onClose()
              window.setTimeout(() => scrollToId('menu'), 80)
            }}
            className="btn-flame mt-6 h-12 rounded-full px-7 text-sm font-bold"
          >
            Browse the menu
          </button>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="flex items-center gap-2 text-sm">
                <Truck className="size-4 text-flame" />
                {left > 0 ? (
                  <span>
                    Add <b className="text-amber">{money(left)}</b> more for free delivery
                  </span>
                ) : (
                  <span className="font-semibold text-leaf">You’ve unlocked free delivery 🎉</span>
                )}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div className={cn('h-full rounded-full', left > 0 ? 'btn-flame' : 'bg-leaf')} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: EASE }} />
              </div>
            </div>

            <ul className="mt-2 divide-y divide-white/[0.07]">
              <AnimatePresence initial={false}>
                {cart.map((item) => (
                  <motion.li
                    key={item.key}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-4 py-4">
                      <img src={img(item.image, 160, 160)} alt="" className="size-20 shrink-0 rounded-2xl object-cover" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold">{item.name}</p>
                          <button type="button" onClick={() => removeItem(item.key)} aria-label={`Remove ${item.name}`} className="text-ash transition hover:text-chili">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-ash">{item.note}</p>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <Stepper size="sm" value={item.qty} min={0} onChange={(q) => setQty(item.key, q)} />
                          <span className="font-semibold tabular-nums">{money(item.unitPrice * item.qty)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            {upsell.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-bold">Complete your order?</p>
                <div className="no-scrollbar -mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6">
                  {upsell.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        const s = OPTIONS[p.category].sizes[0]
                        addItem({ key: `${p.id}|${s.id}|`, productId: p.id, name: p.name, image: p.image, unitPrice: p.price, note: s.label })
                      }}
                      className="group flex w-36 shrink-0 flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2 text-left transition hover:border-flame/40"
                    >
                      <img src={img(p.image, 240, 180)} alt="" className="h-20 w-full rounded-xl object-cover" />
                      <span className="mt-2 truncate text-xs font-semibold">{p.name}</span>
                      <span className="mt-1 flex items-center justify-between text-xs">
                        <span className="text-amber">{money(p.price)}</span>
                        <span className="btn-flame grid size-6 place-items-center rounded-lg transition group-hover:scale-110">
                          <Plus className="size-3.5" />
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 border-t border-white/[0.07] px-5 py-5 sm:px-6">
            {promo ? (
              <div className="flex items-center justify-between rounded-2xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm">
                <span className="flex items-center gap-2 font-semibold text-leaf">
                  <Tag className="size-4" /> {promo} applied
                </span>
                <button type="button" onClick={removePromo} className="text-xs text-smoke underline-offset-2 hover:underline">
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={submitCode} noValidate>
                <div className={cn('flex h-12 items-center gap-2 rounded-full border bg-white/[0.04] pr-1 pl-4', codeError ? 'border-chili/60' : 'border-white/10')}>
                  <Tag className="size-4 shrink-0 text-ash" />
                  <label htmlFor="promo" className="sr-only">
                    Promo code
                  </label>
                  <input
                    id="promo"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value)
                      setCodeError('')
                    }}
                    placeholder="Promo code"
                    className="min-w-0 flex-1 bg-transparent text-sm uppercase outline-none placeholder:normal-case placeholder:text-ash"
                  />
                  <button type="submit" className="h-10 rounded-full bg-white/10 px-4 text-xs font-bold transition hover:bg-white/15">
                    Apply
                  </button>
                </div>
                {codeError && <p className="mt-1.5 pl-4 text-xs text-chili">{codeError}</p>}
              </form>
            )}
            <Totals />
            <button type="button" onClick={onNext} className="btn-flame h-14 w-full rounded-full font-bold transition hover:brightness-110">
              Checkout
            </button>
          </div>
        </>
      )}
    </Pane>
  )
}

type Errors = Partial<Record<'name' | 'phone' | 'address' | 'time', string>>

function Field({
  label,
  error,
  children,
  htmlFor,
}: {
  label: string
  error?: string
  children: ReactNode
  htmlFor: string
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-xs font-semibold text-smoke">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-chili">{error}</p>}
    </div>
  )
}

const inputCls = (err?: string) =>
  cn(
    'h-12 w-full rounded-2xl border bg-white/[0.04] px-4 text-sm outline-none transition placeholder:text-ash focus:border-flame/60',
    err ? 'border-chili/60' : 'border-white/10',
  )

/** Keeps "+", digits and single spaces: "+39 333 123 4567" */
function formatPhone(value: string) {
  const plus = value.trimStart().startsWith('+') ? '+' : ''
  return (plus + value.replace(/[^\d ]/g, '').replace(/\s+/g, ' ').trimStart()).slice(0, 20)
}

function CheckoutStep({ onBack, onDone }: { onBack: () => void; onDone: (o: { id: string; eta: string; mode: 'delivery' | 'pickup' }) => void }) {
  const { total, cart, clearCart } = useStore()
  const [mode, setMode] = useState<'delivery' | 'pickup'>('delivery')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [flat, setFlat] = useState('')
  const [when, setWhen] = useState<'asap' | 'later'>('asap')
  const [time, setTime] = useState('')
  const [pay, setPay] = useState<'card' | 'apple' | 'cash'>('card')
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (name.trim().length < 2) next.name = 'Please enter your name'
    if (!/^\d{8,15}$/.test(phone.replace(/\D/g, ''))) next.phone = 'Please enter a full phone number'
    if (mode === 'delivery' && address.trim().length < 5) next.address = 'Please enter street and number'
    if (when === 'later' && !time) next.time = 'Please pick a time'
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    window.setTimeout(() => {
      const id = `EM-${Math.floor(100000 + Math.random() * 900000)}`
      const order = { id, name, phone, mode, address, flat, when, time, pay, comment, items: cart, total, createdAt: new Date().toISOString() }
      try {
        const prev = JSON.parse(localStorage.getItem('ember-milano:orders') ?? '[]')
        localStorage.setItem('ember-milano:orders', JSON.stringify([order, ...prev].slice(0, 20)))
      } catch {
        /* ignore storage errors */
      }
      clearCart()
      setLoading(false)
      onDone({ id, mode, eta: when === 'later' ? `at ${time}` : mode === 'delivery' ? 'in 25–35 minutes' : 'in 15 minutes' })
    }, 1300)
  }

  const [slots] = useState(() =>
    Array.from({ length: 8 }, (_, i) => {
    const d = new Date()
    d.setMinutes(0, 0, 0)
    d.setHours(d.getHours() + 1 + i)
    return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    }),
  )

  return (
    <Pane>
      <Header title="Checkout" onBack={onBack} />
      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <Segmented
            layoutId="checkout-mode"
            value={mode}
            onChange={setMode}
            options={[
              { id: 'delivery', label: 'Delivery' },
              { id: 'pickup', label: 'Pick-up' },
            ]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="co-name" error={errors.name}>
              <input id="co-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls(errors.name)} />
            </Field>
            <Field label="Phone" htmlFor="co-phone" error={errors.phone}>
              <input
                id="co-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value ? formatPhone(e.target.value) : '')}
                placeholder="+39 333 123 4567"
                className={inputCls(errors.phone)}
              />
            </Field>
          </div>
          <AnimatePresence initial={false}>
            {mode === 'delivery' ? (
              <motion.div key="addr" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-[1fr_100px] gap-3 overflow-hidden">
                <Field label="Address" htmlFor="co-address" error={errors.address}>
                  <input id="co-address" autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Via Torino 15" className={inputCls(errors.address)} />
                </Field>
                <Field label="Floor / int." htmlFor="co-flat">
                  <input id="co-flat" value={flat} onChange={(e) => setFlat(e.target.value)} placeholder="12" className={inputCls()} />
                </Field>
              </motion.div>
            ) : (
              <motion.p key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-sm text-smoke">
                Pick up at EMBER Navigli — Ripa di Porta Ticinese 27. It will be ready when you arrive.
              </motion.p>
            )}
          </AnimatePresence>

          <div>
            <p className="text-xs font-semibold text-smoke">When</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(
                [
                  ['asap', 'As soon as possible'],
                  ['later', 'Schedule'],
                ] as const
              ).map(([id, l]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setWhen(id)}
                  aria-pressed={when === id}
                  className={cn('h-12 rounded-2xl border text-sm font-semibold transition', when === id ? 'border-flame/70 bg-flame/10 text-cream' : 'border-white/10 text-smoke hover:border-white/20')}
                >
                  {l}
                </button>
              ))}
            </div>
            {when === 'later' && (
              <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTime(s)}
                    className={cn('h-10 shrink-0 rounded-full border px-4 text-sm tabular-nums transition', time === s ? 'btn-flame border-transparent font-bold' : 'border-white/10 text-smoke hover:text-cream')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {errors.time && <p className="mt-1 text-xs text-chili">{errors.time}</p>}
          </div>

          <div>
            <p className="text-xs font-semibold text-smoke">Payment</p>
            <div className="mt-1.5 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payment method">
              {(
                [
                  ['card', 'Card', CreditCard],
                  ['apple', 'Apple Pay', Smartphone],
                  ['cash', 'Cash', Banknote],
                ] as const
              ).map(([id, l, Icon]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={pay === id}
                  onClick={() => setPay(id)}
                  className={cn('flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-xs font-semibold transition', pay === id ? 'border-flame/70 bg-flame/10' : 'border-white/10 text-smoke hover:border-white/20')}
                >
                  <Icon className={cn('size-5', pay === id && 'text-amber')} />
                  {l}
                </button>
              ))}
            </div>
          </div>

          <Field label="Note for the kitchen or rider" htmlFor="co-comment">
            <textarea
              id="co-comment"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. no onion, ring the bell at “Rossi”"
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-ash focus:border-flame/60"
            />
          </Field>
        </div>
        <div className="space-y-4 border-t border-white/[0.07] px-5 py-5 sm:px-6">
          <Totals />
          <button type="submit" disabled={loading} className="btn-flame flex h-14 w-full items-center justify-center gap-2 rounded-full font-bold transition hover:brightness-110 disabled:opacity-80">
            {loading ? (
              <>
                <LoaderCircle className="size-5 animate-spin" /> Sending to the kitchen…
              </>
            ) : (
              <>Place order · {money(total)}</>
            )}
          </button>
        </div>
      </form>
    </Pane>
  )
}

function DoneStep({ order, onClose }: { order: { id: string; eta: string; mode: 'delivery' | 'pickup' }; onClose: () => void }) {
  return (
    <Pane>
      <Header title="Order confirmed" onClose={onClose} />
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <motion.span
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
          className="grid size-24 place-items-center rounded-full bg-leaf/15"
        >
          <CircleCheck className="size-12 text-leaf" />
        </motion.span>
        <p className="mt-6 font-display text-2xl font-semibold">Grazie! We’re firing up the grill 🔥</p>
        <p className="mt-2 text-smoke">
          Order number <b className="text-cream">{order.id}</b>
        </p>
        <p className="mt-1 text-sm text-smoke">
          {order.mode === 'delivery' ? 'Your rider will arrive' : 'Your order will be ready'} <b className="text-amber">{order.eta}</b>. We’ll text you a confirmation.
        </p>
        <button type="button" onClick={onClose} className="btn-flame mt-8 h-12 rounded-full px-8 text-sm font-bold">
          Perfect
        </button>
      </div>
    </Pane>
  )
}
