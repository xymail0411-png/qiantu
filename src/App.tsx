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
    <div className="min-h-screen bg-cream md:bg-gradient-to-br md:from-cream md:via-coral-light/20 md:to-cream">
      <div className="w-full mx-auto px-4 pt-6 pb-24 min-h-screen md:max-w-2xl lg:max-w-3xl md:px-8">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo/qiantu-logo.png" alt="钱途" className="w-10 h-10 rounded-xl" />
            <div>
              <h1 className="text-2xl font-extrabold text-text">钱途</h1>
              <p className="text-xs text-sub mt-0.5">✨ 让每一笔消费都有意义 ☁️</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DataDropdown onOpenChange={setIsDataDropdownOpen} />
            <button
              onClick={() => setShowYearReport(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border-2 border-dashed border-border hover:border-coral transition-colors group shadow-warm"
            >
              <span className="text-base">📊</span>
              <span className="text-sm text-sub group-hover:text-coral transition-colors font-medium">{new Date().getFullYear()}年</span>
              <span className="text-xs text-sub/60">▾</span>
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
