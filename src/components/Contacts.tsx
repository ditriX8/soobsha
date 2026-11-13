import { AnimatePresence, motion } from 'framer-motion'
import { Clock, MapPin, Navigation, Plus } from 'lucide-react'
import { useState } from 'react'
import { FAQ, IMAGES, LOCATIONS } from '../data'
import { cn, EASE, img } from '../lib/utils'
import { Reveal, SectionHeading } from './ui'

export function Contacts() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="contacts" className="relative py-20 md:py-28">
      <div className="container-x grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <SectionHeading eyebrow="Questions" title={<>Good to know</>} />
          <div className="flex flex-col gap-3">
            {FAQ.map((f, i) => {
              const isOpen = open === i
              return (
                <Reveal key={f.q} delay={i * 0.05}>
                  <div className={cn('glass overflow-hidden rounded-[24px] transition-colors', isOpen && 'border-flame/30')}>
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : i)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-${i}`}
                        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-[15px] font-semibold md:text-base"
                      >
                        {f.q}
                        <motion.span
                          animate={{ rotate: isOpen ? 45 : 0 }}
                          transition={{ duration: 0.4, ease: EASE }}
                          className={cn('grid size-9 shrink-0 place-items-center rounded-full', isOpen ? 'btn-flame' : 'bg-white/[0.07]')}
                        >
                          <Plus className="size-4" />
                        </motion.span>
                      </button>
                    </h3>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`faq-${i}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.45, ease: EASE }}
                        >
                          <p className="px-6 pb-6 text-[15px] leading-relaxed text-smoke">{f.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>

        <div>
          <SectionHeading eyebrow="Our restaurants" title={<>Come by the fire</>} />
          <Reveal>
            <div className="relative h-56 overflow-hidden rounded-[32px] md:h-64">
              <img src={img(IMAGES.restaurant, 1000, 600)} alt="EMBER dining room in warm light" loading="lazy" className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-coal/90 to-transparent" />
              <p className="absolute bottom-5 left-6 max-w-xs font-display text-lg leading-snug font-semibold">
                Open kitchen, live fire and DJ sets every Friday in Navigli
              </p>
            </div>
          </Reveal>
          <ul className="mt-4 flex flex-col gap-3">
            {LOCATIONS.map((l, i) => (
              <Reveal key={l.name} delay={i * 0.06}>
                <li className="glass group flex items-center justify-between gap-4 rounded-[24px] p-5 transition-colors hover:border-flame/30">
                  <div>
                    <p className="font-display font-semibold">{l.name}</p>
                    <p className="mt-1.5 flex items-center gap-2 text-sm text-smoke">
                      <MapPin className="size-3.5 text-flame" /> {l.address}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-ash">
                      <Clock className="size-3.5" /> {l.hours}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Directions to ${l.name}`}
                    className="grid size-12 shrink-0 place-items-center rounded-full bg-white/[0.07] transition group-hover:bg-flame group-hover:text-coal"
                  >
                    <Navigation className="size-5" />
                  </a>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
