import { motion } from 'framer-motion'
import { useAppStore } from '../store'

const tabs = [
  { key: 'home' as const, icon: '🏠', label: '记一下', color: 'bg-coral-light/40' },
  { key: 'convert' as const, icon: '💡', label: '值多少', color: 'bg-lavender-light/50' },
  { key: 'game' as const, icon: '🎰', label: '开盲盒', color: 'bg-mint-light/50' },
]

export default function TabBar() {
  const activeTab = useAppStore((s) => s.activeTab)
  const setActiveTab = useAppStore((s) => s.setActiveTab)

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t-2 border-dashed border-border z-40 md:border-x md:rounded-t-3xl md:shadow-soft">
      <div className="max-w-2xl lg:max-w-3xl mx-auto flex items-center justify-around h-18 py-2 md:px-8">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative flex flex-col items-center gap-1 py-2 px-6 md:px-10 rounded-2xl transition-all"
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className={`absolute inset-0 ${tab.color} rounded-2xl`}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <motion.span
                className="text-2xl relative z-10"
                animate={isActive ? { scale: [1, 1.2, 1.1], rotate: [0, -5, 5, 0] } : { scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                {tab.icon}
              </motion.span>
              <span className={`text-xs relative z-10 transition-colors ${
                isActive ? 'text-text font-bold' : 'text-sub'
              }`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
