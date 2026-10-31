import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { defaultPrizes } from '../data/prizes'
import { defaultBadges } from '../data/badges'
import { useState, useEffect, useCallback } from 'react'
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
  const allBoxHistory = useLiveQuery(() => db.boxHistory.toArray())
  const allTransactions = useLiveQuery(() => db.transactions.toArray())

  const [opening, setOpening] = useState(false)
  const [result, setResult] = useState<typeof defaultPrizes[0] | null>(null)
  const [newBadge, setNewBadge] = useState<string | null>(null)
  const [showAllBadges, setShowAllBadges] = useState(false)

  useEffect(() => {
    if (prizes && prizes.length === 0) {
      db.prizes.bulkAdd(defaultPrizes as any)
    }
  }, [prizes])

  useEffect(() => {
    if (badges && badges.length === 0) {
      db.badges.bulkAdd(
        defaultBadges.map((b) => ({ ...b, currentCount: 0 })) as any
      )
    }
  }, [badges])

  const updateBadges = useCallback(async () => {
    if (!badges || !achievements || !allBoxHistory || !allTransactions) return

    const totalTransactions = allTransactions.length
    const totalBoxOpenings = allBoxHistory.length
    const uniquePrizes = new Set(achievements.map((a) => a.prizeName)).size
    const legendaryCount = achievements.filter((a) => a.rarity === 'legendary').length

    for (const badge of badges) {
      let currentCount = 0
      let shouldUnlock = false

      if (badge.name === '初出茅庐') {
        currentCount = Math.min(totalTransactions, badge.requiredCount)
        shouldUnlock = totalTransactions >= badge.requiredCount
      } else if (badge.name === '小有积蓄') {
        currentCount = Math.min(totalTransactions, badge.requiredCount)
        shouldUnlock = totalTransactions >= badge.requiredCount
      } else if (badge.name === '记账达人') {
        currentCount = Math.min(totalTransactions, badge.requiredCount)
        shouldUnlock = totalTransactions >= badge.requiredCount
      } else if (badge.name === '盲盒新手') {
        currentCount = Math.min(totalBoxOpenings, badge.requiredCount)
        shouldUnlock = totalBoxOpenings >= badge.requiredCount
      } else if (badge.name === '盲盒爱好者') {
        currentCount = Math.min(totalBoxOpenings, badge.requiredCount)
        shouldUnlock = totalBoxOpenings >= badge.requiredCount
      } else if (badge.name === '盲盒大师') {
        currentCount = Math.min(totalBoxOpenings, badge.requiredCount)
        shouldUnlock = totalBoxOpenings >= badge.requiredCount
      } else if (badge.name === '收藏家') {
        currentCount = Math.min(uniquePrizes, badge.requiredCount)
        shouldUnlock = uniquePrizes >= badge.requiredCount
      } else if (badge.name === '传说猎人') {
        currentCount = Math.min(legendaryCount, badge.requiredCount)
        shouldUnlock = legendaryCount >= badge.requiredCount
      }

      const wasUnlocked = badge.unlockedAt != null
      const update: any = { currentCount }
      if (shouldUnlock && !wasUnlocked) {
        update.unlockedAt = Date.now()
        setNewBadge(badge.name)
        setTimeout(() => setNewBadge(null), 3000)
      }

      await db.badges.update(badge.id!, update)
    }
  }, [badges, achievements, allBoxHistory, allTransactions])

  useEffect(() => {
    updateBadges()
  }, [updateBadges])

  const todayExpense = useLiveQuery(
    () => db.transactions
      .where('date')
      .equals(today)
      .filter((t) => t.type === 'expense')
      .toArray()
      .then((txs) => txs.reduce((sum, t) => sum + t.amount, 0)),
    [today]
  )

  const canOpenBox = (todayExpense || 0) > 0 && !todayBox

  const getAdjustedProbabilities = (expense: number) => {
    // Base probabilities
    let commonProb = 0.6
    let rareProb = 0.3
    let legendaryProb = 0.1

    // Spending restraint bonus: less spending = better odds
    if (expense < 30) {
      // Very frugal: big bonus
      commonProb = 0.4
      rareProb = 0.35
      legendaryProb = 0.25
    } else if (expense < 80) {
      // Moderate: slight bonus
      commonProb = 0.5
      rareProb = 0.32
      legendaryProb = 0.18
    } else if (expense < 150) {
      // Normal: base rates
      commonProb = 0.6
      rareProb = 0.3
      legendaryProb = 0.1
    } else if (expense < 300) {
      // High spending: slight penalty
      commonProb = 0.7
      rareProb = 0.25
      legendaryProb = 0.05
    } else {
      // Very high spending: big penalty
      commonProb = 0.8
      rareProb = 0.18
      legendaryProb = 0.02
    }

    return { commonProb, rareProb, legendaryProb }
  }

  const handleOpen = async () => {
    if (!canOpenBox || !prizes || opening) return

    setOpening(true)
    await new Promise((r) => setTimeout(r, 800))

    const expense = todayExpense || 0
    const { commonProb, rareProb, legendaryProb } = getAdjustedProbabilities(expense)

    // Adjust each prize's probability based on rarity
    const adjustedPrizes = prizes.map((p) => {
      let adjustedProb = p.probability
      if (p.rarity === 'common') {
        adjustedProb = commonProb / prizes.filter((x) => x.rarity === 'common').length
      } else if (p.rarity === 'rare') {
        adjustedProb = rareProb / prizes.filter((x) => x.rarity === 'rare').length
      } else if (p.rarity === 'legendary') {
        adjustedProb = legendaryProb / prizes.filter((x) => x.rarity === 'legendary').length
      }
      return { ...p, probability: adjustedProb }
    })

    const rand = Math.random()
    let cumulative = 0
    let selected = adjustedPrizes[0]
    for (const p of adjustedPrizes) {
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
              whileTap={canOpenBox ? { scale: 0.95 } : {}}
              onClick={handleOpen}
              disabled={!canOpenBox}
              className={`mx-auto w-40 h-40 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                opening
                  ? 'border-primary bg-primary/5 animate-pulse'
                  : canOpenBox
                  ? 'border-primary bg-primary/5 hover:bg-primary/10 cursor-pointer'
                  : 'border-border bg-bg cursor-not-allowed'
              }`}
            >
              <span className="text-4xl mb-2">{opening ? '✨' : '🎁'}</span>
              <span className="text-sm text-sub">
                {opening ? '开启中...' : canOpenBox ? '点击开启！' : todayBox ? '今日已用完' : '记一笔支出即可开启'}
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

      {/* New badge notification */}
      <AnimatePresence>
        {newBadge && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium"
          >
            🎉 解锁新徽章：{newBadge}！
          </motion.div>
        )}
      </AnimatePresence>

      {badges && badges.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
          <h2 className="text-sm font-medium text-text mb-3">🎖️ 徽章墙</h2>
          <div className="grid grid-cols-2 gap-3">
            {(showAllBadges ? badges : badges.slice(0, 2)).map((badge) => {
              const unlocked = badge.unlockedAt != null
              const progress = Math.min(badge.currentCount / badge.requiredCount, 1)
              return (
                <div
                  key={badge.id}
                  className={`p-3 rounded-xl text-center border transition-all ${
                    unlocked
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-bg border-border'
                  }`}
                >
                  <span className="text-2xl">{unlocked ? badge.icon : '🔒'}</span>
                  <p className="text-xs text-text mt-1 font-medium">{badge.name}</p>
                  <p className="text-[10px] text-sub mt-0.5">{badge.description}</p>
                  <div className="mt-2 h-1.5 bg-border/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                      className={`h-full rounded-full ${unlocked ? 'bg-primary' : 'bg-sub/30'}`}
                    />
                  </div>
                  <p className="text-[10px] text-sub mt-1">
                    {badge.currentCount}/{badge.requiredCount}
                  </p>
                </div>
              )
            })}
          </div>
          {badges.length > 2 && (
            <button
              onClick={() => setShowAllBadges(!showAllBadges)}
              className="w-full mt-3 py-2 text-xs text-primary font-medium"
            >
              {showAllBadges ? '收起' : `展开全部 (${badges.length - 2} 个更多)`}
            </button>
          )}
        </div>
      )}

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
    </div>
  )
}
