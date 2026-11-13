import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, PenLine, Quote, Star, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { REVIEWS } from '../data'
import { cn, EASE, img } from '../lib/utils'
import { useStore } from '../store'
import { Reveal, SectionHeading } from './ui'

type Review = Omit<(typeof REVIEWS)[number], 'avatar'> & { avatar: string | null }

export function Reviews() {
  const { notify } = useStore()
  const [reviews, setReviews] = useState<Review[]>(REVIEWS)
  const [formOpen, setFormOpen] = useState(false)
  const track = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  const onScroll = () => {
    const el = track.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setProgress(max > 0 ? el.scrollLeft / max : 0)
  }
  useEffect(onScroll, [reviews])

  const scroll = (dir: 1 | -1) => {
    const el = track.current
    if (!el) return
    const card = el.querySelector('article')
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 360) + 16), behavior: 'smooth' })
  }

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length

  return (
    <section id="reviews" className="relative py-20 md:py-28">
      <div className="container-x">
        <SectionHeading
          eyebrow="Guest reviews"
          title={
            <>
              Word is, we grill the <span className="text-flame-gradient">best</span> burgers in Milan
            </>
          }
          aside={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scroll(-1)}
                disabled={progress <= 0.01}
                aria-label="Previous reviews"
                className="grid size-14 place-items-center rounded-full border border-white/15 transition hover:bg-white/[0.08] disabled:opacity-30"
              >
                <ArrowLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => scroll(1)}
                disabled={progress >= 0.99}
                aria-label="Next reviews"
                className="btn-flame grid size-14 place-items-center rounded-full transition hover:brightness-110 disabled:opacity-40"
              >
                <ArrowRight className="size-5" />
              </button>
            </div>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Reveal>
            <div className="glass relative h-full overflow-hidden rounded-[32px] p-7">
              <div className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-flame/25 blur-3xl" />
              <AnimatePresence mode="wait" initial={false}>
                {formOpen ? (
                  <ReviewForm
                    key="form"
                    onCancel={() => setFormOpen(false)}
                    onSubmit={(r) => {
                      setReviews((list) => [r, ...list])
                      setFormOpen(false)
                      track.current?.scrollTo({ left: 0, behavior: 'smooth' })
                      notify({ title: 'Grazie for your review!', text: 'It is already in the feed' })
                    }}
                  />
                ) : (
                  <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
                    <p className="font-display text-7xl font-semibold tracking-tight">{avg.toFixed(1)}</p>
                    <div className="mt-2 flex gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={cn('size-5', i < Math.round(avg) ? 'fill-amber text-amber' : 'text-ash')} />
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-smoke">12,400+ ratings on Google, Tripadvisor and TheFork</p>
                    <div className="mt-6 space-y-2">
                      {[
                        [5, 88],
                        [4, 9],
                        [3, 2],
                        [2, 1],
                      ].map(([star, pct]) => (
                        <div key={star} className="flex items-center gap-3 text-xs text-smoke">
                          <span className="w-3">{star}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                            <motion.div
                              className="btn-flame h-full rounded-full"
                              initial={{ width: 0 }}
                              whileInView={{ width: `${pct}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.2, ease: EASE }}
                            />
                          </div>
                          <span className="w-8 text-right">{pct}%</span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormOpen(true)}
                      className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/15 text-sm font-semibold transition hover:bg-white/[0.08]"
                    >
                      <PenLine className="size-4" /> Write a review
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>

          <div className="min-w-0">
            <div
              ref={track}
              onScroll={onScroll}
              className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 lg:mx-0 lg:px-0"
            >
              <AnimatePresence initial={false}>
                {reviews.map((r, i) => (
                  <motion.article
                    key={`${r.name}-${i}-${r.text.length}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="glass flex w-[85%] shrink-0 snap-start flex-col rounded-[32px] p-7 sm:w-[360px]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, k) => (
                          <Star key={k} className={cn('size-4', k < r.rating ? 'fill-amber text-amber' : 'text-ash')} />
                        ))}
                      </div>
                      <Quote className="size-7 text-flame/40" />
                    </div>
                    <p className="mt-5 flex-1 text-[15px] leading-relaxed text-cream/90">“{r.text}”</p>
                    <div className="mt-6 flex items-center gap-3 border-t border-white/[0.07] pt-5">
                      {r.avatar ? (
                        <img src={img(r.avatar, 96, 96)} alt="" loading="lazy" className="size-11 rounded-full object-cover" />
                      ) : (
                        <span className="btn-flame grid size-11 place-items-center rounded-full font-display font-bold">{r.name[0]}</span>
                      )}
                      <div>
                        <p className="text-sm font-bold">{r.name}</p>
                        <p className="text-xs text-ash">{r.date}</p>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
            <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/[0.07]">
              <motion.div className="btn-flame h-full rounded-full" animate={{ width: `${12 + progress * 88}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ReviewForm({ onSubmit, onCancel }: { onSubmit: (r: Review) => void; onCancel: () => void }) {
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [errors, setErrors] = useState<{ name?: string; text?: string }>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (name.trim().length < 2) next.name = 'What’s your name?'
    if (text.trim().length < 10) next.text = 'Write at least a few words (10+ characters)'
    setErrors(next)
    if (Object.keys(next).length) return
    onSubmit({ name: name.trim(), text: text.trim(), rating, date: 'just now', avatar: null })
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onSubmit={submit}
      noValidate
      className="relative flex h-full flex-col"
    >
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-semibold">Your review</p>
        <button type="button" onClick={onCancel} aria-label="Cancel" className="grid size-9 place-items-center rounded-full hover:bg-white/10">
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-4 flex gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} out of 5`}
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
          >
            <Star className={cn('size-7 transition', n <= (hover || rating) ? 'scale-110 fill-amber text-amber' : 'text-ash')} />
          </button>
        ))}
      </div>
      <label className="mt-5 text-xs font-semibold text-smoke" htmlFor="rv-name">
        Name
      </label>
      <input
        id="rv-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={cn('mt-1.5 h-11 rounded-2xl border bg-white/[0.04] px-4 text-sm outline-none focus:border-flame/60', errors.name ? 'border-chili/60' : 'border-white/10')}
        placeholder="Giulia"
      />
      {errors.name && <p className="mt-1 text-xs text-chili">{errors.name}</p>}
      <label className="mt-4 text-xs font-semibold text-smoke" htmlFor="rv-text">
        Your experience
      </label>
      <textarea
        id="rv-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className={cn('mt-1.5 resize-none rounded-2xl border bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-flame/60', errors.text ? 'border-chili/60' : 'border-white/10')}
        placeholder="What did you love most?"
      />
      {errors.text && <p className="mt-1 text-xs text-chili">{errors.text}</p>}
      <button type="submit" className="btn-flame mt-5 h-12 rounded-full text-sm font-bold">
        Publish
      </button>
    </motion.form>
  )
}
