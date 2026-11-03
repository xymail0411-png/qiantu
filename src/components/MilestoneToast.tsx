import { motion, AnimatePresence } from 'framer-motion'

interface MilestoneToastProps {
  milestone: { name: string; icon: string; description: string } | null
  onDone: () => void
}

export default function MilestoneToast({ milestone, onDone }: MilestoneToastProps) {
  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onAnimationComplete={() => {
            setTimeout(onDone, 2500)
          }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl px-5 py-3 shadow-cute border-2 border-dashed border-coral/30 flex items-center gap-3 max-w-xs"
        >
          <span className="text-2xl">{milestone.icon}</span>
          <div>
            <p className="text-sm font-bold text-text">🎉 达成里程碑！</p>
            <p className="text-xs text-sub">{milestone.name} — {milestone.description}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
