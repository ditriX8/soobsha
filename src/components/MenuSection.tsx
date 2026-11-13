import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { ChevronDown, Heart, Search, SearchX, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CATEGORIES, PRODUCTS, type FilterId } from '../data'
import { cn } from '../lib/utils'
import { useStore } from '../store'
import { ProductCard } from './ProductCard'
import { Glow, SectionHeading } from './ui'

export function MenuSection() {
  const { filter, setFilter, query, setQuery, favorites } = useStore()

  const tabs: { id: FilterId; label: string; emoji?: string }[] = [
    { id: 'all', label: 'All' },
    ...CATEGORIES,
    { id: 'fav', label: 'Saved' },
  ]

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PRODUCTS.filter((p) => {
      if (filter === 'fav' && !favorites.includes(p.id)) return false
      if (filter !== 'all' && filter !== 'fav' && p.category !== filter) return false
      if (q && !`${p.name} ${p.description}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [filter, query, favorites])

  const PAGE = 8
  // the page size resets whenever the filter or the query changes
  const listKey = `${filter}|${query}`
  const [paging, setPaging] = useState({ key: listKey, limit: PAGE })
  const limit = paging.key === listKey ? paging.limit : PAGE
  const showMore = () => setPaging({ key: listKey, limit: limit + PAGE })
  const visible = list.slice(0, limit)
  const hidden = list.length - visible.length

  return (
    <section id="menu" className="relative py-20 md:py-28">
      <Glow className="top-40 left-1/2 size-[500px] -translate-x-1/2 bg-flame/10" />
      <div className="container-x relative">
        <SectionHeading
          eyebrow="Popular right now"
          title={
            <>
              A menu you’ll <span className="text-flame-gradient">want</span> to order all of
            </>
          }
          text="Tap “+” to add a dish to your cart, or “Customise” to choose the size and extras."
          aside={
            <label className="glass flex h-14 w-full items-center gap-3 rounded-full px-5 focus-within:border-flame/50 md:w-80">
              <Search className="size-[18px] shrink-0 text-smoke" />
              <span className="sr-only">Search the menu</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search: bacon, spicy…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ash"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-smoke hover:text-cream">
                  <X className="size-4" />
                </button>
              )}
            </label>
          }
        />

        <LayoutGroup>
          <div className="no-scrollbar -mx-5 mb-10 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0" role="tablist" aria-label="Menu categories">
            {tabs.map((t) => {
              const active = filter === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(t.id)}
                  className={cn(
                    'relative flex h-12 shrink-0 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors',
                    active ? 'border-transparent text-coal' : 'border-white/10 bg-white/[0.03] text-smoke hover:border-white/20 hover:text-cream',
                  )}
                >
                  {active && (
                    <motion.span layoutId="menu-tab" className="btn-flame absolute inset-0 rounded-full" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />
                  )}
                  <span className="relative flex items-center gap-2">
                    {t.id === 'fav' ? <Heart className={cn('size-4', active ? 'fill-coal' : 'text-chili')} /> : t.emoji && <span>{t.emoji}</span>}
                    {t.label}
                    {t.id === 'fav' && favorites.length > 0 && (
                      <span className={cn('rounded-full px-1.5 text-xs', active ? 'bg-coal/15' : 'bg-white/10')}>{favorites.length}</span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
            <AnimatePresence mode="popLayout">
              {visible.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>

        {hidden > 0 && (
          <div className="mt-10 flex justify-center">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={showMore}
              className="group flex h-14 items-center gap-2 rounded-full border border-white/15 px-7 text-sm font-semibold transition hover:border-flame/50 hover:bg-white/[0.05]"
            >
              Show more
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{hidden}</span>
              <ChevronDown className="size-4 transition group-hover:translate-y-0.5" />
            </motion.button>
          </div>
        )}

        <AnimatePresence>
          {list.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass mx-auto flex max-w-md flex-col items-center rounded-[28px] px-6 py-12 text-center"
            >
              {filter === 'fav' ? <Heart className="size-10 text-chili" /> : <SearchX className="size-10 text-flame" />}
              <p className="mt-4 font-display text-lg font-semibold">
                {filter === 'fav' && !query ? 'Nothing saved yet' : 'No dishes found'}
              </p>
              <p className="mt-2 text-sm text-smoke">
                {filter === 'fav' && !query
                  ? 'Tap the heart on any dish to save it here.'
                  : 'Try another search or browse the full menu.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setFilter('all')
                }}
                className="btn-flame mt-6 h-12 rounded-full px-6 text-sm font-bold"
              >
                Show full menu
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
