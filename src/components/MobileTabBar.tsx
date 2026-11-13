import { motion } from 'framer-motion'
import { Heart, Home, ShoppingBag, Tag, UtensilsCrossed } from 'lucide-react'
import { cn, money, scrollToId } from '../lib/utils'
import { useStore } from '../store'

/** App-style bottom navigation for phones — echoes the reference app UI. */
export function MobileTabBar() {
  const { count, total, setCartOpen, setFilter, setQuery, favorites } = useStore()

  const items = [
    { label: 'Home', icon: Home, onClick: () => scrollToId('top') },
    { label: 'Menu', icon: UtensilsCrossed, onClick: () => scrollToId('menu') },
    { label: 'Deals', icon: Tag, onClick: () => scrollToId('offer') },
    {
      label: 'Saved',
      icon: Heart,
      badge: favorites.length,
      onClick: () => {
        setQuery('')
        setFilter('fav')
        scrollToId('menu')
      },
    },
  ]

  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-3 bottom-3 z-40 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="glass-strong flex items-center gap-0.5 rounded-[26px] bg-coal-2/90 p-1.5">
        {items.map((it) => (
          <button key={it.label} type="button" onClick={it.onClick} className="relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[9.5px] font-semibold text-smoke active:bg-white/[0.06]">
            <it.icon className="size-5" />
            {it.label}
            {!!it.badge && <span className="absolute top-1 right-[22%] size-2 rounded-full bg-chili" />}
          </button>
        ))}
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => setCartOpen(true)}
          className={cn('btn-flame flex h-14 items-center gap-2 rounded-[20px] px-4 text-sm font-bold')}
          aria-label={`Cart, ${count} items`}
        >
          <ShoppingBag className="size-5" />
          {count > 0 ? <span className="tabular-nums">{money(total)}</span> : <span>€0</span>}
        </motion.button>
      </div>
    </nav>
  )
}
