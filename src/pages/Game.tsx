import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { defaultPrizes } from '../data/prizes'
import { defaultBadges } from '../data/badges'
import { defaultMilestones } from '../data/milestones'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BlindBoxAnimation from '../components/BlindBoxAnimation'
import SaveModal from '../components/share/SaveModal'
import BlindBoxCard from '../components/share/templates/BlindBoxCard'
import StreakCard from '../components/share/templates/StreakCard'
import MilestoneToast from '../components/MilestoneToast'

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
  const [animatingPrize, setAnimatingPrize] = useState<typeof defaultPrizes[0] | null>(null)
  const [showSaveBlindBox, setShowSaveBlindBox] = useState(false)
  const [showSaveStreak, setShowSaveStreak] = useState(false)
  const [newMilestone, setNewMilestone] = useState<{ name: string; icon: string; description: string } | null>(null)
  const milestoneCheckRef = useRef(false)

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

  // Milestone detection
  const checkMilestones = useCallback(async () => {
    if (!allTransactions || !allBoxHistory || !badges || milestoneCheckRef.current) return
    milestoneCheckRef.current = true

    const totalTx = allTransactions.length
    const totalBoxes = allBoxHistory.length
    const unlockedBadges = badges.filter((b) => b.unlockedAt != null).length
    const totalIncome = allTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)

    // Calculate streak
    const txDates = new Set(allTransactions.map((t) => t.date))
    let currentStreak = 0
    const d = new Date()
    while (currentStreak < 365) {
      const dateStr = d.toISOString().slice(0, 10)
      if (txDates.has(dateStr)) {
        currentStreak++
        d.setDate(d.getDate() - 1)
      } else break
    }

    const existingMilestones = await db.milestones.toArray()
    const existingKeys = new Set(existingMilestones.map((m) => m.key))

    // Remove milestones that are no longer satisfied
    for (const ms of defaultMilestones) {
      if (!existingKeys.has(ms.key)) continue

      let stillAchieved = false
      const cond = ms.condition
      if (cond.type === 'transaction_count') stillAchieved = totalTx >= cond.target
      else if (cond.type === 'streak_days') stillAchieved = currentStreak >= cond.target
      else if (cond.type === 'total_income') stillAchieved = totalIncome >= cond.target
      else if (cond.type === 'box_count') stillAchieved = totalBoxes >= cond.target
      else if (cond.type === 'badge_count') stillAchieved = unlockedBadges >= cond.target

      if (!stillAchieved) {
        await db.milestones.where('key').equals(ms.key).delete()
      }
    }

    // Check for new milestones
    const refreshedMilestones = await db.milestones.toArray()
    const refreshedKeys = new Set(refreshedMilestones.map((m) => m.key))

    for (const ms of defaultMilestones) {
      if (refreshedKeys.has(ms.key)) continue

      let achieved = false
      const cond = ms.condition
      if (cond.type === 'transaction_count') achieved = totalTx >= cond.target
      else if (cond.type === 'streak_days') achieved = currentStreak >= cond.target
      else if (cond.type === 'total_income') achieved = totalIncome >= cond.target
      else if (cond.type === 'box_count') achieved = totalBoxes >= cond.target
      else if (cond.type === 'badge_count') achieved = unlockedBadges >= cond.target

      if (achieved) {
        await db.milestones.add({
          key: ms.key,
          name: ms.name,
          icon: ms.icon,
          description: ms.description,
          unlockedAt: Date.now(),
        })
        setNewMilestone({ name: ms.name, icon: ms.icon, description: ms.description })
        break
      }
    }

    milestoneCheckRef.current = false
  }, [allTransactions, allBoxHistory, badges])

  useEffect(() => {
    checkMilestones()
  }, [checkMilestones])

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

  const todayCheckedIn = useLiveQuery(
    () => db.transactions
      .where('date')
      .equals(today)
      .count()
      .then((count) => count > 0),
    [today]
  )

  const streak = useLiveQuery(
    async () => {
      const allTx = await db.transactions.toArray()
      const txDates = new Set(allTx.map((t) => t.date))
      let count = 0
      const d = new Date()
      while (count < 365) {
        const dateStr = d.toISOString().slice(0, 10)
        if (txDates.has(dateStr)) {
          count++
          d.setDate(d.getDate() - 1)
        } else {
          break
        }
      }
      return count
    },
    []
  )

  const streakBonus = (streak || 0) >= 30 ? 15 : (streak || 0) >= 14 ? 10 : (streak || 0) >= 7 ? 5 : (streak || 0) >= 3 ? 2 : 0

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

    // Apply streak bonus: shift probability from common to rare/legendary
    const bonus = streakBonus / 100
    const rareBonus = bonus * 0.7
    const legendaryBonus = bonus * 0.3
    commonProb = Math.max(0.1, commonProb - bonus)
    rareProb = rareProb + rareBonus
    legendaryProb = legendaryProb + legendaryBonus

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

    setResult(null)
    setOpening(false)
    setAnimatingPrize(selected)
  }

  const handleAnimationComplete = useCallback(() => {
    if (animatingPrize) {
      setResult(animatingPrize)
      setAnimatingPrize(null)
    }
  }, [animatingPrize])

  const rarityColors = {
    common: 'from-cream-dark to-cream border-border',
    rare: 'from-warm-yellow/20 to-cream-dark border-warm-yellow',
    legendary: 'from-lavender-light/50 to-coral-light/20 border-lavender',
  }

  const rarityLabels = {
    common: '普通',
    rare: '稀有',
    legendary: '传说',
  }

  const rarityGlow = {
    common: '',
    rare: 'shadow-warm-yellow/30 shadow-lg',
    legendary: 'shadow-lavender/40 shadow-xl',
  }

  const groupedAchievements = achievements?.reduce<Record<string, number>>((acc, a) => {
    acc[a.prizeName] = (acc[a.prizeName] || 0) + 1
    return acc
  }, {}) || {}

  return (
    <div className="pb-4 space-y-6">
      {/* Blind box opening animation overlay */}
      <AnimatePresence>
        {animatingPrize && (
          <BlindBoxAnimation
            prize={animatingPrize}
            onComplete={handleAnimationComplete}
          />
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl p-6 shadow-soft border-2 border-dashed border-border text-center relative overflow-hidden">
        {/* Decorative elements */}
        <span className="absolute top-3 left-4 text-lg opacity-20">☁️</span>
        <span className="absolute top-5 right-5 text-sm opacity-20">✨</span>
        <span className="absolute bottom-4 left-6 text-sm opacity-15">⭐</span>

        <h2 className="text-sm font-bold text-text mb-4">🎰 今日盲盒</h2>

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
              <span className={`text-xs mt-1 px-2 py-0.5 rounded-full font-medium ${
                result.rarity === 'legendary' ? 'bg-lavender-light/50 text-lavender' :
                result.rarity === 'rare' ? 'bg-warm-yellow/20 text-warm-yellow' :
                'bg-cream-dark text-sub'
              }`}>
                {rarityLabels[result.rarity]}
              </span>
            </motion.div>
          ) : (
            <motion.button
              key="button"
              whileTap={canOpenBox ? { scale: 0.95 } : {}}
              whileHover={canOpenBox ? { scale: 1.02 } : {}}
              onClick={handleOpen}
              disabled={!canOpenBox}
              className={`mx-auto w-40 h-40 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                opening
                  ? 'border-coral bg-coral-light/40 animate-pulse'
                  : canOpenBox
                  ? 'border-coral bg-coral-light/30 hover:bg-coral-light/40 cursor-pointer shadow-warm'
                  : 'border-border bg-cream-dark cursor-not-allowed'
              }`}
            >
              <motion.span
                className="text-4xl mb-2"
                animate={canOpenBox && !opening ? { y: [0, -4, 0] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                {opening ? '✨' : '🎁'}
              </motion.span>
              <span className="text-sm text-sub">
                {opening ? '开启中...' : canOpenBox ? '点击开启！' : todayBox ? '今日已用完' : '记一笔支出即可开启'}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        <p className="text-xs text-sub mt-4">
          {todayExpense ? `今日消费 ¥${(todayExpense || 0).toFixed(2)} 🌸` : '记一笔支出即可开启盲盒 ☁️'}
        </p>

        {result && (
          <div className="mt-3 flex items-center justify-center gap-3">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => setShowSaveBlindBox(true)}
              className="text-xs text-coral font-bold px-3 py-1.5 rounded-full bg-coral-light/30 border border-coral/30"
            >
              📸 保存图片
            </motion.button>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => setResult(null)}
              className="text-xs text-sub font-medium"
            >
              明天再来 🌙
            </motion.button>
          </div>
        )}
      </div>

      {/* Check-in streak section */}
      <div className="bg-white rounded-3xl p-5 shadow-soft border-2 border-dashed border-border relative overflow-hidden">
        <span className="absolute top-3 right-4 text-lg opacity-15">⭐</span>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🔥</span>
            <span className="text-sm font-bold text-text">打卡记录</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            todayCheckedIn
              ? 'bg-mint-light/40 text-mint border border-mint/30'
              : 'bg-cream-dark text-sub border border-border'
          }`}>
            {todayCheckedIn ? '✅ 今日已打卡' : '⏳ 今日未打卡'}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-sub font-medium mb-1">🔥 连续打卡</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold text-coral">{streak || 0}</span>
              <span className="text-sm text-sub font-bold">天</span>
            </div>
            {streakBonus > 0 && (
              <p className="text-xs text-mint font-bold mt-1.5 px-2 py-0.5 bg-mint-light/30 rounded-full inline-block">
                ✨ 稀有概率 +{streakBonus}%
              </p>
            )}
            {streakBonus === 0 && (
              <p className="text-xs text-sub mt-1.5">
                再坚持{3 - (streak || 0)}天可获得概率加成 🌸
              </p>
            )}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSaveStreak(true)}
          className="mt-3 w-full py-2 text-xs text-coral font-bold bg-coral-light/25 rounded-2xl border border-dashed border-coral/30"
        >
          📸 保存打卡成就
        </motion.button>
      </div>

      {/* New badge notification */}
      <AnimatePresence>
        {newBadge && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-coral text-white px-6 py-3 rounded-full shadow-cute text-sm font-bold whitespace-nowrap"
          >
            🎉 解锁新徽章：{newBadge}！
          </motion.div>
        )}
      </AnimatePresence>

      {badges && badges.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-soft border-2 border-dashed border-border">
          <h2 className="text-sm font-bold text-text mb-3">🎖️ 徽章墙</h2>
          <div className="grid grid-cols-2 gap-3">
            {(showAllBadges ? badges : badges.slice(0, 2)).map((badge, idx) => {
              const unlocked = badge.unlockedAt != null
              const progress = Math.min(badge.currentCount / badge.requiredCount, 1)
              const macaronBgs = ['bg-coral-light/30', 'bg-lavender-light/35', 'bg-mint-light/35', 'bg-cream-dark']
              return (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.02, rotate: idx % 2 === 0 ? 1 : -1 }}
                  className={`p-3 rounded-2xl text-center border-2 transition-all ${
                    unlocked
                      ? `${macaronBgs[idx % macaronBgs.length]} border-coral/30 shadow-warm`
                      : 'bg-cream-dark border-border'
                  }`}
                >
                  <span className="text-2xl">{unlocked ? badge.icon : '🔒'}</span>
                  <p className="text-xs text-text mt-1 font-bold">{badge.name}</p>
                  <p className="text-[10px] text-sub mt-0.5">{badge.description}</p>
                  <div className="mt-2 h-1.5 bg-border/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                      className={`h-full rounded-full ${unlocked ? 'bg-coral' : 'bg-sub/30'}`}
                    />
                  </div>
                  <p className="text-[10px] text-sub mt-1">
                    {badge.currentCount}/{badge.requiredCount}
                  </p>
                </motion.div>
              )
            })}
          </div>
          {badges.length > 2 && (
            <button
              onClick={() => setShowAllBadges(!showAllBadges)}
              className="w-full mt-3 py-2 text-xs text-coral font-bold hover:bg-coral-light/20 rounded-2xl transition-colors"
            >
              {showAllBadges ? '收起 🌸' : `展开全部 (${badges.length - 2} 个更多) ✨`}
            </button>
          )}
        </div>
      )}

      {Object.keys(groupedAchievements).length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-soft border-2 border-dashed border-border">
          <h2 className="text-sm font-bold text-text mb-3">🏆 已收集</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(groupedAchievements).map(([name, count]) => {
              const achievement = achievements!.find((a) => a.prizeName === name)!
              return (
                <motion.div
                  key={name}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cream-dark rounded-full border border-border"
                >
                  <span className="text-base">{achievement.prizeIcon}</span>
                  <span className="text-xs text-text font-medium">{name}</span>
                  <span className="text-xs text-coral font-bold">×{count}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Save blind box result modal */}
      {result && (
        <SaveModal
          open={showSaveBlindBox}
          onClose={() => setShowSaveBlindBox(false)}
          title="盲盒奖品卡片"
          filename={`钱途盲盒-${result.name}`}
        >
          <BlindBoxCard
            prizeName={result.name}
            prizeIcon={result.icon}
            rarity={result.rarity as 'common' | 'rare' | 'legendary'}
            sourceAmount={todayExpense || 0}
            date={today}
          />
        </SaveModal>
      )}

      {/* Save streak achievement modal */}
      <SaveModal
        open={showSaveStreak}
        onClose={() => setShowSaveStreak(false)}
        title="打卡成就卡片"
        filename={`钱途打卡-${streak || 0}天`}
      >
        <StreakCard
          streak={streak || 0}
          streakBonus={streakBonus}
          todayCheckedIn={todayCheckedIn || false}
        />
      </SaveModal>

      {/* Milestone toast notification */}
      <MilestoneToast
        milestone={newMilestone}
        onDone={() => setNewMilestone(null)}
      />
    </div>
  )
}
