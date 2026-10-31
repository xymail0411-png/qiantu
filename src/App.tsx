import { useAppStore } from './store'
import HomePage from './pages/Home'
import ConvertPage from './pages/Convert'
import GamePage from './pages/Game'
import AmountInput from './components/AmountInput'
import TabBar from './components/TabBar'
import CategoryPage from './components/CategoryPage'
import { AnimatePresence, motion } from 'framer-motion'

export default function App() {
  const { activeTab } = useAppStore()

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text">钱途</h1>
            <p className="text-xs text-sub mt-0.5">让每一笔消费都有意义</p>
          </div>
          <span className="text-xs text-sub">{new Date().getFullYear()}年</span>
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
    </div>
  )
}
