import { motion } from 'framer-motion'
import { useAppStore } from '../store'

const tabs = [
  { key: 'home' as const, icon: '📝', label: '记一下' },
  { key: 'convert' as const, icon: '💡', label: '换算' },
  { key: 'game' as const, icon: '🎰', label: '盲盒' },
]

export default function TabBar() {
  const activeTab = useAppStore((s) => s.activeTab)
  const setActiveTab = useAppStore((s) => s.setActiveTab)

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-border z-40">
      <div className="max-w-md mx-auto flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative flex flex-col items-center gap-0.5 py-2 px-6"
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className={`text-lg transition-transform ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </span>
              <span className={`text-xs transition-colors ${
                isActive ? 'text-primary font-medium' : 'text-sub'
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
