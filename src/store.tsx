import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { DELIVERY_FEE, FREE_DELIVERY_FROM, PROMO_CODES, type FilterId, type Product } from './data'

export interface CartItem {
  key: string
  productId: string
  name: string
  image: string
  unitPrice: number
  qty: number
  /** Human readable options, e.g. "Large · Crispy bacon" */
  note: string
}

export interface Toast {
  id: number
  title: string
  text?: string
  image?: string
}

interface Store {
  cart: CartItem[]
  count: number
  subtotal: number
  discount: number
  delivery: number
  total: number
  promo: string | null
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  setQty: (key: string, qty: number) => void
  removeItem: (key: string) => void
  clearCart: () => void
  applyPromo: (code: string) => boolean
  removePromo: () => void

  cartOpen: boolean
  setCartOpen: (v: boolean) => void

  favorites: string[]
  toggleFavorite: (id: string) => void

  filter: FilterId
  setFilter: (f: FilterId) => void
  query: string
  setQuery: (q: string) => void

  activeProduct: Product | null
  openProduct: (p: Product | null) => void

  toasts: Toast[]
  notify: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: number) => void
}

const Ctx = createContext<Store | null>(null)

function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage may be unavailable (private mode) */
    }
  }, [key, value])
  return [value, setValue] as const
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = usePersisted<CartItem[]>('ember-milano:cart', [])
  const [favorites, setFavorites] = usePersisted<string[]>('ember-milano:favorites', ['spicy-chicken'])
  const [promo, setPromo] = usePersisted<string | null>('ember-milano:promo', null)
  const [cartOpen, setCartOpen] = useState(false)
  const [filter, setFilter] = useState<FilterId>('all')
  const [query, setQuery] = useState('')
  const [activeProduct, openProduct] = useState<Product | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const notify = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++toastId.current
      setToasts((list) => [...list.slice(-2), { ...t, id }])
      window.setTimeout(() => dismiss(id), 3200)
    },
    [dismiss],
  )

  const addItem = useCallback(
    (item: Omit<CartItem, 'qty'>, qty = 1) => {
      setCart((list) => {
        const existing = list.find((x) => x.key === item.key)
        if (existing) return list.map((x) => (x.key === item.key ? { ...x, qty: Math.min(x.qty + qty, 99) } : x))
        return [...list, { ...item, qty }]
      })
    },
    [setCart],
  )

  const setQty = useCallback(
    (key: string, qty: number) =>
      setCart((list) =>
        qty <= 0 ? list.filter((x) => x.key !== key) : list.map((x) => (x.key === key ? { ...x, qty: Math.min(qty, 99) } : x)),
      ),
    [setCart],
  )
  const removeItem = useCallback((key: string) => setCart((l) => l.filter((x) => x.key !== key)), [setCart])
  const clearCart = useCallback(() => {
    setCart([])
    setPromo(null)
  }, [setCart, setPromo])

  const applyPromo = useCallback(
    (code: string) => {
      const c = code.trim().toUpperCase()
      if (PROMO_CODES[c] === undefined) return false
      setPromo(c)
      return true
    },
    [setPromo],
  )

  const toggleFavorite = useCallback(
    (id: string) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])),
    [setFavorites],
  )

  const totals = useMemo(() => {
    const count = cart.reduce((s, i) => s + i.qty, 0)
    const subtotal = cart.reduce((s, i) => s + i.qty * i.unitPrice, 0)
    const discount = promo ? Math.round(subtotal * (PROMO_CODES[promo] ?? 0) * 100) / 100 : 0
    const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE
    return { count, subtotal, discount, delivery, total: subtotal - discount + delivery }
  }, [cart, promo])

  const value: Store = {
    cart,
    ...totals,
    promo,
    addItem,
    setQty,
    removeItem,
    clearCart,
    applyPromo,
    removePromo: () => setPromo(null),
    cartOpen,
    setCartOpen,
    favorites,
    toggleFavorite,
    filter,
    setFilter,
    query,
    setQuery,
    activeProduct,
    openProduct,
    toasts,
    notify,
    dismiss,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

/** Lock page scroll while an overlay is open. */
// eslint-disable-next-line react-refresh/only-export-components
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const { overflow, paddingRight } = document.body.style
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`
    return () => {
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
    }
  }, [locked])
}
