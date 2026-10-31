import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { defaultPrizes } from '../data/prizes'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function GamePage() {
  const today = new Date().toISOString().slice(0, 10)

  const prizes = useLiveQuery(() => db.prizes.toArray())
  const achievements = useLiveQuery(
    () => db.achievements.orderBy('unlockedAt').reverse().toArray(),
    []
  )
  const badges = useLiveQuery(() => db.badges.toArray())
  const todayBox = useLiveQuery(
    () => db.boxHistory.where('date').equals(today).first(),
    [today]
  )

  const todayExpense = useLiveQuery(
    () => db.transactions
      .where('date')
      .equals(today)
      .filter((t) => t.type === 'expense')
      .toArray()
      .then((txs) => txs.reduce((sum, t) => sum + t.amount, 0)),
    [today]
  )

  const [opening, setOpening] = useState(false)
  const [result, setResult] = useState<typeof defaultPrizes[0] | null>(null)

  useEffect(() => {
    if (prizes && prizes.length === 0) {
      db.prizes.bulkAdd(defaultPrizes as any)
    }
  }, [prizes])

  const canOpen = (todayExpense || 0) > 0 && !todayBox

  const handleOpen = async () => {
    if (!canOpen || !prizes || opening) return

    setOpening(true)

    await new Promise((r) => setTimeout(r, 800))

    const rand = Math.random()
    let cumulative = 0
    let selected = prizes[0]
    for (const p of prizes) {
      cumulative += p.probability
      if (rand <= cumulative) {
        selected = p
        break
      }
    }

    await db.achievements.add({
      prizeId: selected.id!,
      prizeName: selected.name,
      prizeIcon: selected.icon,
      rarity: selected.rarity,
      unlockedAt: Date.now(),
      sourceAmount: todayExpense || 0,
    })

    await db.boxHistory.add({
      date: today,
      prizeId: selected.id!,
      openedAt: Date.now(),
    })

    setResult(selected)
    setOpening(false)
  }

  const rarityColors = {
    common: 'from-gray-100 to-gray-50 border-gray-200',
    rare: 'from-yellow-50 to-amber-50 border-yellow-300',
    legendary: 'from-purple-50 to-pink-50 border-purple-300',
  }

  const rarityLabels = {
    common: '普通',
    rare: '稀有',
    legendary: '传说',
  }

  const rarityGlow = {
    common: '',
    rare: 'shadow-yellow-200/50 shadow-lg',
    legendary: 'shadow-purple-200/50 shadow-xl',
  }

  const groupedAchievements = achievements?.reduce<Record<string, number>>((acc, a) => {
    acc[a.prizeName] = (acc[a.prizeName] || 0) + 1
    return acc
  }, {}) || {}

  return (
    <div className="pb-4 space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-border text-center">
        <h2 className="text-sm font-medium text-sub mb-4">🎰 今日盲盒</h2>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`mx-auto w-40 h-40 rounded-3xl bg-gradient-to-br ${rarityColors[result.rarity]} border-2 flex flex-col items-center justify-center ${rarityGlow[result.rarity]}`}
            >
              <span className="text-5xl mb-2">{result.icon}</span>
              <span className="text-sm font-medium text-text">{result.name}</span>
              <span className={`text-xs mt-1 px-2 py-0.5 rounded-full ${
                result.rarity === 'legendary' ? 'bg-purple-100 text-purple-600' :
                result.rarity === 'rare' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {rarityLabels[result.rarity]}
              </span>
            </motion.div>
          ) : (
            <motion.button
              key="button"
              whileTap={canOpen ? { scale: 0.95 } : {}}
              onClick={handleOpen}
              disabled={!canOpen}
              className={`mx-auto w-40 h-40 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                opening
                  ? 'border-primary bg-primary/5 animate-pulse'
                  : canOpen
                  ? 'border-primary bg-primary/5 hover:bg-primary/10 cursor-pointer'
                  : 'border-border bg-bg cursor-not-allowed'
              }`}
            >
              <span className="text-4xl mb-2">{opening ? '✨' : '🎁'}</span>
              <span className="text-sm text-sub">
                {opening ? '开启中...' : canOpen ? '点击开启！' : '今日已用完'}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        <p className="text-xs text-sub mt-4">
          {todayExpense ? `今日消费 ¥${(todayExpense || 0).toFixed(2)}` : '记一笔支出即可开启盲盒'}
        </p>

        {result && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => setResult(null)}
            className="mt-3 text-xs text-primary"
          >
            再开一次需要等明天哦
          </motion.button>
        )}
      </div>

      {Object.keys(groupedAchievements).length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
          <h2 className="text-sm font-medium text-text mb-3">🏆 已收集</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(groupedAchievements).map(([name, count]) => {
              const achievement = achievements!.find((a) => a.prizeName === name)!
              return (
                <div
                  key={name}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-bg rounded-full"
                >
                  <span className="text-base">{achievement.prizeIcon}</span>
                  <span className="text-xs text-text">{name}</span>
                  <span className="text-xs text-primary font-medium">×{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {badges && badges.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
          <h2 className="text-sm font-medium text-text mb-3">🎖️ 徽章墙</h2>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((badge) => {
              const unlocked = badge.unlockedAt != null
              return (
                <div
                  key={badge.id}
                  className={`p-3 rounded-xl text-center border ${
                    unlocked ? 'bg-primary/5 border-primary/20' : 'bg-bg border-border'
                  }`}
                >
                  <span className="text-2xl">{unlocked ? badge.icon : '🔒'}</span>
                  <p className="text-xs text-text mt-1 font-medium">{badge.name}</p>
                  <p className="text-xs text-sub mt-0.5">
                    {badge.currentCount}/{badge.requiredCount}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
