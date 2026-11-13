import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Flame, Rotate3d, Scale, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CATEGORIES, OPTIONS, type Product } from '../data'
import { depthOf, EASE, img, money } from '../lib/utils'
import { DepthPhoto } from './DepthPhoto'
import { useScrollLock, useStore } from '../store'
import { BadgePill, HeartButton } from './ProductCard'
import { Rating, Segmented, Stepper, Toggle } from './ui'

export function ProductModal() {
  const { activeProduct, openProduct } = useStore()
  useScrollLock(!!activeProduct)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && openProduct(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openProduct])

  return (
    <AnimatePresence>
      {activeProduct && <ModalBody key={activeProduct.id} product={activeProduct} onClose={() => openProduct(null)} />}
    </AnimatePresence>
  )
}

function ModalBody({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addItem, notify } = useStore()
  const opts = OPTIONS[product.category]
  const [size, setSize] = useState(opts.sizes[0].id)
  const [extras, setExtras] = useState<string[]>([])
  const [qty, setQty] = useState(1)

  const sizeOpt = opts.sizes.find((s) => s.id === size)!
  const extrasSum = opts.extras.filter((e) => extras.includes(e.id)).reduce((s, e) => s + e.price, 0)
  const unit = product.price + sizeOpt.delta + extrasSum
  const total = unit * qty
  const category = CATEGORIES.find((c) => c.id === product.category)!

  const toggleExtra = (id: string, on: boolean) => setExtras((list) => (on ? [...list, id] : list.filter((x) => x !== id)))

  const add = () => {
    const sortedExtras = [...extras].sort()
    const extraLabels = opts.extras.filter((e) => sortedExtras.includes(e.id)).map((e) => e.label)
    addItem(
      {
        key: `${product.id}|${size}|${sortedExtras.join(',')}`,
        productId: product.id,
        name: product.name,
        image: product.image,
        unitPrice: unit,
        note: [sizeOpt.label, ...extraLabels].join(' · '),
      },
      qty,
    )
    notify({ title: `Added ${qty} to cart`, text: product.name, image: product.image })
    onClose()
  }

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-end justify-center md:items-center md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-title"
        initial={{ y: 80, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="glass-strong relative flex max-h-[92svh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[32px] md:grid md:max-h-[88vh] md:grid-cols-2 md:rounded-[36px]"
      >
        {/* Visual */}
        <div className="relative h-64 shrink-0 overflow-hidden sm:h-80 md:h-auto">
          <motion.div initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: EASE }} className="absolute inset-0">
            <DepthPhoto
              src={img(product.image, 1000, 1000)}
              depth={depthOf(product.image)}
              alt={product.name}
              strength={0.04}
              focus={0.5}
              turn={4}
              zoom={1.12}
              className="size-full"
            />
          </motion.div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-coal-2 via-transparent to-coal/30 md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-coal-2/60" />
          <div className="absolute inset-x-4 top-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="grid size-10 place-items-center rounded-full bg-coal/50 backdrop-blur-md transition hover:bg-coal/70"
              aria-label="Close"
            >
              <ChevronDown className="size-5 md:hidden" />
              <X className="hidden size-5 md:block" />
            </button>
            <HeartButton id={product.id} />
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 flex gap-2 md:bottom-6 md:left-6">
            <span className="rounded-full bg-coal/60 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
              {category.emoji} {category.label}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-coal/60 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
              <Rotate3d className="size-3.5 text-amber" /> Drag to turn
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-4 md:px-8 md:pt-8">
            {product.badges && (
              <div className="mb-3 flex gap-1.5">
                {product.badges.map((b) => (
                  <BadgePill key={b} badge={b} />
                ))}
              </div>
            )}
            <div className="flex items-start justify-between gap-4">
              <h3 id="product-title" className="font-display text-2xl leading-tight font-semibold tracking-tight md:text-3xl">
                {product.name}
              </h3>
              <span className="pt-1 font-display text-xl font-semibold text-amber md:text-2xl">{money(product.price)}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-smoke">
              <Rating value={product.rating} count={product.reviews} className="text-cream" />
              <span className="inline-flex items-center gap-1">
                <Scale className="size-3.5" /> {product.weight}
              </span>
              <span className="inline-flex items-center gap-1">
                <Flame className="size-3.5" /> {product.kcal} kcal
              </span>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-smoke">{product.description}</p>

            <div className="mt-7">
              <p className="mb-3 text-sm font-bold">Size</p>
              <Segmented
                layoutId={`size-${product.id}`}
                value={size}
                onChange={setSize}
                options={opts.sizes.map((s) => ({ id: s.id, label: s.label, hint: s.delta ? `+${money(s.delta)}` : undefined }))}
              />
            </div>

            <div className="mt-7">
              <p className="mb-1 text-sm font-bold">Extras</p>
              <ul className="divide-y divide-white/[0.07]">
                {opts.extras.map((e) => {
                  const on = extras.includes(e.id)
                  return (
                    <li key={e.id} className="flex items-center justify-between gap-4 py-3">
                      <span className="text-[15px]">
                        {e.label}
                        <span className="ml-2 text-sm text-ash">+{money(e.price)}</span>
                      </span>
                      <Toggle checked={on} onChange={(v) => toggleExtra(e.id, v)} label={e.label} />
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-white/[0.07] bg-coal-2/60 px-5 py-4 md:px-8 md:py-5">
            <Stepper value={qty} onChange={setQty} />
            <button
              type="button"
              onClick={add}
              className="btn-flame flex h-12 flex-1 items-center justify-between gap-3 rounded-full px-6 text-sm font-bold transition hover:brightness-110"
            >
              <span>Add to cart</span>
              <motion.span key={total} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="tabular-nums">
                {money(total)}
              </motion.span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
