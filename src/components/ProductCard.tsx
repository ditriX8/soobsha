import { motion } from 'framer-motion'
import { Heart, Plus } from 'lucide-react'
import { BADGE_LABEL, OPTIONS, type Product } from '../data'
import { cn, img, money } from '../lib/utils'
import { useStore } from '../store'
import { Rating } from './ui'

export function BadgePill({ badge }: { badge: keyof typeof BADGE_LABEL }) {
  const tone = {
    hit: 'bg-amber text-coal',
    spicy: 'bg-chili text-white',
    new: 'bg-cream text-coal',
    veg: 'bg-leaf text-coal',
  }[badge]
  return <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', tone)}>{BADGE_LABEL[badge]}</span>
}

export function HeartButton({ id, className }: { id: string; className?: string }) {
  const { favorites, toggleFavorite, notify } = useStore()
  const fav = favorites.includes(id)
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.75 }}
      onClick={(e) => {
        e.stopPropagation()
        toggleFavorite(id)
        if (!fav) notify({ title: 'Saved to favourites', text: 'Find it under the “Saved” tab ❤' })
      }}
      aria-pressed={fav}
      aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
      className={cn(
        'grid size-10 place-items-center rounded-full backdrop-blur-md transition-colors',
        fav ? 'bg-chili/90 text-white' : 'bg-coal/50 text-cream hover:bg-coal/70',
        className,
      )}
    >
      <motion.span key={String(fav)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 12 }}>
        <Heart className={cn('size-[18px]', fav && 'fill-current')} />
      </motion.span>
    </motion.button>
  )
}

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const { openProduct, addItem, notify } = useStore()

  const quickAdd = () => {
    const size = OPTIONS[product.category].sizes[0]
    addItem({
      key: `${product.id}|${size.id}|`,
      productId: product.id,
      name: product.name,
      image: product.image,
      unitPrice: product.price,
      note: size.label,
    })
    notify({ title: 'Added to cart', text: product.name, image: product.image })
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: Math.min(index, 8) * 0.04 }}
      className="glass group relative flex flex-col overflow-hidden rounded-[22px] p-1.5 sm:rounded-[28px] sm:p-2.5 transition-[border-color,transform] duration-500 hover:-translate-y-1.5 hover:border-flame/30"
    >
      <button
        type="button"
        onClick={() => openProduct(product)}
        className="relative block aspect-square overflow-hidden rounded-[18px] text-left sm:aspect-[4/3.3] sm:rounded-[22px]"
        aria-label={`Open ${product.name}`}
      >
        <img
          src={img(product.image, 640, 528)}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-coal/70 via-transparent to-transparent" />
        {product.badges && (
          <span className="absolute top-2 left-2 flex gap-1 sm:top-3 sm:left-3 sm:gap-1.5">
            {product.badges.map((b) => (
              <BadgePill key={b} badge={b} />
            ))}
          </span>
        )}
        <span className="absolute bottom-3 left-3 hidden rounded-full bg-coal/60 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md sm:block">
          {product.weight} · {product.kcal} kcal
        </span>
      </button>
      <HeartButton id={product.id} className="absolute top-3 right-3 size-8 sm:top-5 sm:right-5 sm:size-10" />

      <div className="flex flex-1 flex-col px-1.5 pt-3 pb-1 sm:px-2.5 sm:pt-4 sm:pb-2">
        <div className="flex flex-col-reverse items-start justify-between gap-1 sm:flex-row sm:gap-3">
          <h3 className="font-display text-[14px] leading-tight font-semibold tracking-tight sm:text-[17px]">{product.name}</h3>
          <Rating value={product.rating} className="shrink-0 text-xs sm:pt-0.5 sm:text-[13px]" />
        </div>
        <p className="mt-2 hidden text-[13px] leading-relaxed text-smoke sm:line-clamp-2">{product.description}</p>
        <div className="mt-auto flex items-center justify-between pt-3 sm:pt-5">
          <span className="font-display text-base font-semibold sm:text-xl">
            <span className="mr-1 hidden font-sans text-xs font-medium text-ash sm:inline">from</span>
            {money(product.price)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openProduct(product)}
              className="hidden h-10 rounded-full px-3.5 text-[13px] font-semibold text-smoke transition hover:bg-white/[0.07] hover:text-cream sm:block"
            >
              Customise
            </button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.85, rotate: 90 }}
              onClick={quickAdd}
              aria-label={`Add ${product.name} to cart`}
              className="btn-flame grid size-9 place-items-center rounded-xl transition hover:brightness-110 sm:size-11 sm:rounded-2xl"
            >
              <Plus className="size-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
