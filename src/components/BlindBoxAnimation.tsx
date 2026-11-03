import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ParticleCanvas from './ParticleCanvas'

type Rarity = 'common' | 'rare' | 'legendary'

interface Prize {
  name: string
  icon: string
  rarity: Rarity
}

const rarityGlow: Record<Rarity, string> = {
  common: '',
  rare: 'shadow-[0_0_40px_rgba(255,217,61,0.4)]',
  legendary: 'shadow-[0_0_60px_rgba(255,155,155,0.5),0_0_120px_rgba(184,169,255,0.3)]',
}

const rarityBg: Record<Rarity, string> = {
  common: 'from-cream-dark to-cream',
  rare: 'from-warm-yellow/20 to-cream-dark',
  legendary: 'from-lavender-light/50 to-coral-light/20',
}

const rarityBorder: Record<Rarity, string> = {
  common: 'border-border',
  rare: 'border-warm-yellow',
  legendary: 'border-lavender',
}

type Phase = 'idle' | 'shake' | 'open' | 'particles' | 'reveal'

export default function BlindBoxAnimation({
  prize,
  onComplete,
}: {
  prize: Prize
  onComplete: () => void
}) {
  const [phase, setPhase] = useState<Phase>('shake')

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setPhase('open'), 800))
    timers.push(setTimeout(() => setPhase('particles'), 1200))
    timers.push(setTimeout(() => setPhase('reveal'), 2000))
    timers.push(setTimeout(() => onComplete(), 3500))
    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  const handleParticlesComplete = useCallback(() => {}, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      {/* Full-screen flash for legendary */}
      <AnimatePresence>
        {phase === 'reveal' && prize.rarity === 'legendary' && (
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-gradient-to-br from-coral-light/40 via-lavender-light/30 to-mint-light/40 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Box container */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Particle canvas */}
        <ParticleCanvas
          rarity={prize.rarity}
          active={phase === 'particles'}
          onComplete={handleParticlesComplete}
        />

        {/* The box */}
        <AnimatePresence mode="wait">
          {(phase === 'shake' || phase === 'open') && (
            <motion.div
              key="box"
              initial={{ scale: 1 }}
              animate={
                phase === 'shake'
                  ? {
                      rotate: [0, -3, 3, -3, 3, -2, 2, 0],
                      scale: [1, 1.02, 0.98, 1.02, 0.98, 1.01, 1],
                    }
                  : {
                      scale: 1.3,
                      opacity: 0,
                      rotate: 0,
                    }
              }
              exit={{ scale: 1.5, opacity: 0 }}
              transition={
                phase === 'shake'
                  ? { duration: 0.8, ease: 'easeInOut' }
                  : { duration: 0.4, ease: 'easeOut' }
              }
              className="text-7xl"
            >
              🎁
            </motion.div>
          )}

          {phase === 'reveal' && (
            <motion.div
              key="prize"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`w-40 h-40 rounded-3xl bg-gradient-to-br ${rarityBg[prize.rarity]} border-2 ${rarityBorder[prize.rarity]} ${rarityGlow[prize.rarity]} flex flex-col items-center justify-center`}
            >
              <motion.span
                className="text-5xl mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              >
                {prize.icon}
              </motion.span>
              <motion.span
                className="text-sm font-bold text-text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {prize.name}
              </motion.span>
              <motion.span
                className={`text-xs mt-1 px-2 py-0.5 rounded-full font-medium ${
                  prize.rarity === 'legendary' ? 'bg-lavender-light/50 text-lavender' :
                  prize.rarity === 'rare' ? 'bg-warm-yellow/20 text-warm-yellow' :
                  'bg-cream-dark text-sub'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {prize.rarity === 'legendary' ? '✨ 传说' : prize.rarity === 'rare' ? '⭐ 稀有' : '普通'}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
