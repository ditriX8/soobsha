import { MotionConfig, motion, useScroll, useSpring } from 'framer-motion'
import { AppShowcase } from './components/AppShowcase'
import { CartDrawer } from './components/CartDrawer'
import { Contacts } from './components/Contacts'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { Marquee } from './components/Marquee'
import { MenuSection } from './components/MenuSection'
import { MobileTabBar } from './components/MobileTabBar'
import { Navbar } from './components/Navbar'
import { Offer } from './components/Offer'
import { ProductModal } from './components/ProductModal'
import { Reviews } from './components/Reviews'
import { Toaster } from './components/Toaster'
import { StoreProvider } from './store'

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  return <motion.div style={{ scaleX }} className="btn-flame fixed inset-x-0 top-0 z-[60] h-[3px] origin-left" />
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <div className="grain relative overflow-x-clip">
          <ScrollProgress />
          <Navbar />
          <main>
            <Hero />
            <Marquee />
            <MenuSection />
            <Offer />
            <HowItWorks />
            <AppShowcase />
            <Reviews />
            <Contacts />
          </main>
          <Footer />
          <MobileTabBar />
          <ProductModal />
          <CartDrawer />
          <Toaster />
        </div>
      </StoreProvider>
    </MotionConfig>
  )
}
