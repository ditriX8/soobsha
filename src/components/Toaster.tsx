import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheck, X } from 'lucide-react'
import { img } from '../lib/utils'
import { useStore } from '../store'

export function Toaster() {
  const { toasts, dismiss, setCartOpen } = useStore()
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-3 top-20 z-[90] flex flex-col items-center gap-2 md:inset-x-auto md:top-24 md:right-5 md:items-end">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="glass-strong pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl p-2.5 pr-3"
          >
            {t.image ? (
              <img src={img(t.image, 96, 96)} alt="" className="size-11 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-flame/15 text-amber">
                <CircleCheck className="size-5" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{t.title}</p>
              {t.text && <p className="truncate text-xs text-smoke">{t.text}</p>}
            </div>
            {t.image && (
              <button
                type="button"
                onClick={() => {
                  dismiss(t.id)
                  setCartOpen(true)
                }}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/15"
              >
                View cart
              </button>
            )}
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="text-ash hover:text-cream">
              <X className="size-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
