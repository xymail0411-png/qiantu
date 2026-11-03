import { useState, lazy, Suspense } from 'react'
import { useAppStore } from './store'
import AmountInput from './components/AmountInput'
import TabBar from './components/TabBar'
import CategoryPage from './components/CategoryPage'
import DataDropdown from './components/DataDropdown'
import { AnimatePresence, motion } from 'framer-motion'

const HomePage = lazy(() => import('./pages/Home'))
const ConvertPage = lazy(() => import('./pages/Convert'))
const GamePage = lazy(() => import('./pages/Game'))
const YearReport = lazy(() => import('./components/YearReport'))

export default function App() {
  const { activeTab } = useAppStore()
  const [showYearReport, setShowYearReport] = useState(false)
  const [isDataDropdownOpen, setIsDataDropdownOpen] = useState(false)

  return (
    <div className="min-h-screen bg-cream md:bg-gradient-to-br md:from-cream md:via-coral-light/20 md:to-cream relative overflow-hidden">
      {/* Scattered decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none" aria-hidden="true">
        <span className="absolute top-[8%] left-[5%] text-2xl opacity-[0.07] rotate-12">☁️</span>
        <span className="absolute top-[15%] right-[8%] text-xl opacity-[0.06] -rotate-12">⭐</span>
        <span className="absolute top-[35%] left-[3%] text-lg opacity-[0.05] rotate-6">🌸</span>
        <span className="absolute top-[55%] right-[4%] text-xl opacity-[0.06] rotate-12">☁️</span>
        <span className="absolute top-[75%] left-[7%] text-lg opacity-[0.05] -rotate-6">✨</span>
        <span className="absolute bottom-[12%] right-[6%] text-2xl opacity-[0.07] rotate-12">🌸</span>
        <span className="absolute top-[45%] left-[92%] text-lg opacity-[0.05] -rotate-12">⭐</span>
        <span className="absolute top-[25%] left-[90%] text-xl opacity-[0.04] rotate-6">🌙</span>
      </div>
      <div className="w-full mx-auto px-3 pt-4 pb-20 min-h-screen sm:px-4 sm:pt-6 sm:pb-24 md:max-w-2xl md:px-8 lg:max-w-3xl relative z-10">
        <header className="mb-4 sm:mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/logo/qiantu-logo.png" alt="钱途" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl" />
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-text">钱途</h1>
              <p className="text-[10px] sm:text-xs text-sub mt-0.5 hidden sm:block">✨ 让每一笔消费都有意义 ☁️</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <DataDropdown onOpenChange={setIsDataDropdownOpen} />
            <button
              onClick={() => setShowYearReport(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white border-2 border-dashed border-border hover:border-coral transition-colors group shadow-warm"
            >
              <span className="text-sm sm:text-base">📊</span>
              <span className="text-xs sm:text-sm text-sub group-hover:text-coral transition-colors font-medium">{new Date().getFullYear()}年</span>
              <span className="text-[10px] sm:text-xs text-sub/60 hidden sm:inline">▾</span>
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <Suspense fallback={<div className="flex items-center justify-center py-20"><span className="text-2xl animate-bounce">🌸</span></div>}>
              {activeTab === 'home' && <HomePage isDataDropdownOpen={isDataDropdownOpen} />}
              {activeTab === 'convert' && <ConvertPage />}
              {activeTab === 'game' && <GamePage />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>

      <CategoryPage />
      <AmountInput />
      <TabBar />

      <AnimatePresence>
        {showYearReport && (
          <Suspense fallback={null}>
            <YearReport onClose={() => setShowYearReport(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  )
}
