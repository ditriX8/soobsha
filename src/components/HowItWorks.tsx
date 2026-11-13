import { motion, useScroll, useTransform } from 'framer-motion'
import { Clock, Flame, ShieldCheck, ThermometerSun } from 'lucide-react'
import { useRef } from 'react'
import { IMAGES, STEPS } from '../data'
import { img } from '../lib/utils'
import { Reveal, SectionHeading } from './ui'

const PERKS = [
  { icon: Flame, title: 'Charcoal 400 °C', text: 'Crust and a smoky aroma' },
  { icon: ThermometerSun, title: 'Hot bags', text: 'Arrives piping hot' },
  { icon: ShieldCheck, title: 'On-time promise', text: 'Late? Your next burger is on us' },
]

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  return (
    <section id="how" className="relative py-20 md:py-28">
      <div className="container-x">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              From grill to door in <span className="text-flame-gradient">27 minutes</span>
            </>
          }
          text="Nothing sits under a heat lamp. Every burger is built after you order and goes straight to your door."
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr] lg:gap-6">
          <div ref={ref} className="relative min-h-[420px] overflow-hidden rounded-[36px]">
            <motion.img
              style={{ y: imgY }}
              src={img(IMAGES.courier, 1100, 1300)}
              alt="EMBER rider on a scooter delivering an order through the city at night"
              loading="lazy"
              className="absolute inset-x-0 -top-[8%] h-[116%] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-coal via-coal/30 to-transparent" />
            <div className="absolute inset-x-5 bottom-5 grid grid-cols-2 gap-3">
              <div className="glass rounded-3xl p-4">
                <Clock className="size-5 text-amber" />
                <p className="mt-3 font-display text-3xl font-semibold">27</p>
                <p className="text-xs text-smoke">minutes on average</p>
              </div>
              <div className="glass rounded-3xl p-4">
                <Flame className="size-5 text-amber" />
                <p className="mt-3 font-display text-3xl font-semibold">98%</p>
                <p className="text-xs text-smoke">orders on time</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <div className="glass group relative flex gap-5 overflow-hidden rounded-[28px] p-6 transition-colors duration-500 hover:border-flame/30 md:p-7">
                  <span className="pointer-events-none absolute -right-2 -bottom-8 font-display text-[120px] leading-none font-bold text-white/[0.035] transition-colors duration-500 group-hover:text-flame/10">
                    0{i + 1}
                  </span>
                  <span className="btn-flame grid size-12 shrink-0 place-items-center rounded-2xl font-display text-lg font-bold">{i + 1}</span>
                  <div className="relative">
                    <h3 className="font-display text-xl font-semibold tracking-tight">{s.title}</h3>
                    <p className="mt-2 max-w-md text-[15px] leading-relaxed text-smoke">{s.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
            <Reveal delay={0.25}>
              <div className="grid grid-cols-3 gap-3">
                {PERKS.map((p) => (
                  <div key={p.title} className="rounded-[24px] border border-white/[0.07] p-4">
                    <p.icon className="size-5 text-flame" />
                    <p className="mt-3 text-sm font-bold">{p.title}</p>
                    <p className="mt-1 text-xs leading-snug text-ash">{p.text}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
