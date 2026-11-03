import { useState } from 'react'
import { useAppStore } from './store'
import HomePage from './pages/Home'
import ConvertPage from './pages/Convert'
import GamePage from './pages/Game'
import AmountInput from './components/AmountInput'
import TabBar from './components/TabBar'
import CategoryPage from './components/CategoryPage'
import YearReport from './components/YearReport'
import { AnimatePresence, motion } from 'framer-motion'

export default function App() {
  const { activeTab } = useAppStore()
  const [showYearReport, setShowYearReport] = useState(false)

  return (
    <div className="min-h-screen bg-bg md:bg-gradient-to-br md:from-bg md:via-blue-50/30 md:to-bg">
      <div className="w-full max-w-md mx-auto px-4 pt-6 pb-24 md:max-w-4xl md:shadow-2xl md:shadow-primary/5 md:border-x md:border-border/30 min-h-screen">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text">钱途</h1>
            <p className="text-xs text-sub mt-0.5">让每一笔消费都有意义</p>
          </div>
          <button
            onClick={() => setShowYearReport(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-border hover:border-primary transition-colors group"
          >
            <span className="text-sm">📊</span>
            <span className="text-xs text-sub group-hover:text-primary transition-colors">{new Date().getFullYear()}年</span>
            <span className="text-[10px] text-sub/60">▾</span>
          </button>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'home' && <HomePage />}
            {activeTab === 'convert' && <ConvertPage />}
            {activeTab === 'game' && <GamePage />}
          </motion.div>
        </AnimatePresence>
      </div>

      <CategoryPage />
      <AmountInput />
      <TabBar />

      <AnimatePresence>
        {showYearReport && (
          <YearReport onClose={() => setShowYearReport(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
