/** Local, pre-optimised photos live in public/img (originals from Unsplash). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const img = (id: string, _w?: number, _h?: number) => `${import.meta.env.BASE_URL}img/${id}.jpg`

export const depthOf = (id: string) => `${import.meta.env.BASE_URL}img/${id}-depth.png`

export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ')

const EUR = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })
/** €12.90 */
export const money = (n: number) => EUR.format(Math.round(n * 100) / 100)

/** Smooth-scroll to a section id, accounting for the fixed header. */
export function scrollToId(id: string) {
  const clean = id.replace('#', '')
  if (clean === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    history.replaceState(null, '', location.pathname)
    return
  }
  const el = document.getElementById(clean)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - 76
  window.scrollTo({ top, behavior: 'smooth' })
  history.replaceState(null, '', `#${clean}`)
}

export const EASE = [0.16, 1, 0.3, 1] as const

export const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)
