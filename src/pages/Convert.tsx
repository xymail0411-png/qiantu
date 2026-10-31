import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { defaultEquivalents, experienceEquivalents } from '../data/equivalents'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function ConvertPage() {
  const today = new Date().toISOString().slice(0, 10)

  const todayExpense = useLiveQuery(
    () => db.transactions
      .where('date')
      .equals(today)
      .filter((t) => t.type === 'expense')
      .toArray()
      .then((txs) => txs.reduce((sum, t) => sum + t.amount, 0)),
    [today]
  )

  const equivalents = useLiveQuery(() => db.equivalents.toArray())
  const wishlist = useLiveQuery(() => db.wishlist.orderBy('addedAt').reverse().toArray())

  const [showAddWish, setShowAddWish] = useState(false)
  const [wishName, setWishName] = useState('')
  const [wishPrice, setWishPrice] = useState('')
  const [wishIcon, setWishIcon] = useState('🎁')

  // Three modules toggle state
  const [showPhysical, setShowPhysical] = useState(true)
  const [showExperience, setShowExperience] = useState(false)
  const [showLabor, setShowLabor] = useState(false)
  const [hourlyWage, setHourlyWage] = useState('')

  useEffect(() => {
    if (equivalents && equivalents.length === 0) {
      db.equivalents.bulkAdd(defaultEquivalents as any)
    }
  }, [equivalents])

  const handleAddWish = async () => {
    if (!wishName || !wishPrice) return
    await db.wishlist.add({
      name: wishName,
      price: parseFloat(wishPrice),
      icon: wishIcon,
      addedAt: Date.now(),
    })
    setWishName('')
    setWishPrice('')
    setWishIcon('🎁')
    setShowAddWish(false)
  }

  const handleDeleteWish = async (id: number) => {
    await db.wishlist.delete(id)
  }

  const amount = todayExpense || 0

  const physicalItems = equivalents?.filter((e) => !e.isCustom) || []
  const experienceItems = experienceEquivalents

  const laborHours = hourlyWage && parseFloat(hourlyWage) > 0
    ? amount / parseFloat(hourlyWage)
    : 0

  return (
    <div className="pb-4 space-y-4">
      {/* Today's expense summary */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
        <h2 className="text-sm font-medium text-sub mb-1">💡 今天花了</h2>
        <p className="text-3xl font-light text-text mb-4">
          ¥ <span className="font-medium">{amount.toFixed(2)}</span>
        </p>
      </div>

      {/* Module toggles */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setShowPhysical(!showPhysical)}
          className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            showPhysical ? 'bg-primary text-white' : 'bg-white text-sub border border-border'
          }`}
        >
          🍚 实物参照
        </button>
        <button
          onClick={() => setShowExperience(!showExperience)}
          className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            showExperience ? 'bg-primary text-white' : 'bg-white text-sub border border-border'
          }`}
        >
          🎬 体验参照
        </button>
        <button
          onClick={() => setShowLabor(!showLabor)}
          className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            showLabor ? 'bg-primary text-white' : 'bg-white text-sub border border-border'
          }`}
        >
          ⏱️ 劳动工时
        </button>
      </div>

      {/* Physical equivalents */}
      {showPhysical && amount > 0 && physicalItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-border"
        >
          <h3 className="text-sm font-medium text-text mb-3">🍚 实物参照</h3>
          <div className="space-y-2">
            {physicalItems.map((eq) => {
              const count = amount / eq.price
              return (
                <div
                  key={eq.id}
                  className="flex items-center justify-between py-2 px-3 bg-bg rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{eq.icon}</span>
                    <span className="text-sm text-text">{eq.name}</span>
                    <span className="text-xs text-sub">¥{eq.price}/个</span>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    × {count >= 1 ? Math.floor(count) : count.toFixed(1)}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Experience equivalents */}
      {showExperience && amount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-border"
        >
          <h3 className="text-sm font-medium text-text mb-3">🎬 体验参照</h3>
          <div className="space-y-2">
            {experienceItems.map((eq) => {
              const count = amount / eq.price
              return (
                <div
                  key={eq.name}
                  className="flex items-center justify-between py-2 px-3 bg-bg rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{eq.icon}</span>
                    <span className="text-sm text-text">{eq.name}</span>
                    <span className="text-xs text-sub">¥{eq.price}/次</span>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    × {count.toFixed(1)}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Labor hours */}
      {showLabor && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-border"
        >
          <h3 className="text-sm font-medium text-text mb-3">⏱️ 劳动工时</h3>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-sub">我的时薪：</span>
            <input
              type="number"
              placeholder="填写时薪"
              value={hourlyWage}
              onChange={(e) => setHourlyWage(e.target.value)}
              className="flex-1 px-3 py-2 bg-bg rounded-lg border border-border text-sm outline-none focus:border-primary"
            />
            <span className="text-xs text-sub">元/小时</span>
          </div>
          {laborHours > 0 && (
            <div className="p-4 bg-primary/5 rounded-xl text-center">
              <p className="text-xs text-sub mb-1">今天的消费相当于</p>
              <p className="text-2xl font-medium text-primary">
                {laborHours >= 1 ? laborHours.toFixed(1) : (laborHours * 60).toFixed(0) + ' 分钟'}
              </p>
              <p className="text-xs text-sub mt-1">
                {laborHours >= 1 ? '小时的工作收入' : '的劳动时间'}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Wishlist */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-text">🛍️ 愿望清单</h2>
          <button
            onClick={() => setShowAddWish(!showAddWish)}
            className="text-xs text-primary font-medium"
          >
            {showAddWish ? '取消' : '+ 添加'}
          </button>
        </div>

        {showAddWish && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mb-4 p-3 bg-bg rounded-xl space-y-2"
          >
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="图标 Emoji"
                value={wishIcon}
                onChange={(e) => setWishIcon(e.target.value)}
                className="w-16 px-2 py-2 text-center bg-white rounded-lg border border-border text-sm outline-none focus:border-primary"
              />
              <input
                type="text"
                placeholder="名称"
                value={wishName}
                onChange={(e) => setWishName(e.target.value)}
                className="flex-1 px-3 py-2 bg-white rounded-lg border border-border text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="价格"
                value={wishPrice}
                onChange={(e) => setWishPrice(e.target.value)}
                className="flex-1 px-3 py-2 bg-white rounded-lg border border-border text-sm outline-none focus:border-primary"
              />
              <button
                onClick={handleAddWish}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
              >
                添加
              </button>
            </div>
          </motion.div>
        )}

        {wishlist && wishlist.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {wishlist.map((item) => {
              const daysNeeded = amount > 0 ? Math.ceil(item.price / amount) : '∞'
              return (
                <motion.div
                  key={item.id}
                  layout
                  className="relative p-3 bg-bg rounded-xl"
                >
                  <button
                    onClick={() => handleDeleteWish(item.id!)}
                    className="absolute top-2 right-2 text-sub/40 hover:text-expense text-xs"
                  >
                    ✕
                  </button>
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-sm font-medium text-text mt-1">{item.name}</p>
                  <p className="text-xs text-sub">¥{item.price}</p>
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-xs text-primary">
                      = {amount > 0 ? `今天 × ${daysNeeded}` : '记一笔账再来看'}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-sub text-center py-4">
            添加想买的东西，看看要花几天才能攒到
          </p>
        )}
      </div>
    </div>
  )
}
