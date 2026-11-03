import { useState } from 'react'
import { useAppStore } from './store'
import HomePage from './pages/Home'
import ConvertPage from './pages/Convert'
import GamePage from './pages/Game'
import AmountInput from './components/AmountInput'
import TabBar from './components/TabBar'
import CategoryPage from './components/CategoryPage'
import YearReport from './components/YearReport'
import DataDropdown from './components/DataDropdown'
import { AnimatePresence, motion } from 'framer-motion'

export default function App() {
  const { activeTab } = useAppStore()
  const [showYearReport, setShowYearReport] = useState(false)
  const [isDataDropdownOpen, setIsDataDropdownOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg md:bg-gradient-to-br md:from-bg md:via-blue-50/30 md:to-bg">
      <div className="w-full mx-auto px-4 pt-6 pb-24 min-h-screen md:max-w-3xl lg:max-w-4xl md:px-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">钱途</h1>
            <p className="text-xs text-sub mt-1">让每一笔消费都有意义</p>
          </div>
          <div className="flex items-center gap-2">
            <DataDropdown onOpenChange={setIsDataDropdownOpen} />
            <button
              onClick={() => setShowYearReport(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-border hover:border-primary transition-colors group shadow-sm"
            >
              <span className="text-base">📊</span>
              <span className="text-sm text-sub group-hover:text-primary transition-colors">{new Date().getFullYear()}年</span>
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
            {activeTab === 'home' && <HomePage isDataDropdownOpen={isDataDropdownOpen} />}
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
