import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { defaultEquivalents } from '../data/equivalents'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [wishRating, setWishRating] = useState(3)
  const [showIconPicker, setShowIconPicker] = useState(false)

  const commonIcons = ['🎁', '🧋', '🎬', '🎮', '👕', '📱', '💻', '🎧', '📚', '✈️', '🍜', '🍰', '💄', '🎨', '⌚', '🏠']

  useEffect(() => {
    if (equivalents && equivalents.length === 0) {
      db.equivalents.bulkAdd(defaultEquivalents as any)
    }
  }, [equivalents])

  const amount = todayExpense || 0

  const getTopEquivalents = () => {
    if (amount <= 0) return []
    const items = equivalents || []
    return items
      .map(eq => ({ ...eq, count: amount / eq.price }))
      .filter(eq => eq.count >= 0.5)
      .sort((a, b) => {
        const aScore = a.count >= 1 && a.count <= 100 ? 1 : 0
        const bScore = b.count >= 1 && b.count <= 100 ? 1 : 0
        return bScore - aScore || Math.abs(1 - a.count) - Math.abs(1 - b.count)
      })
      .slice(0, 3)
  }

  const handleAddWish = async () => {
    if (!wishName || !wishPrice) return
    const price = parseFloat(wishPrice)
    if (!price || price <= 0) return // 验证价格必须为正数
    
    await db.wishlist.add({
      name: wishName,
      price: price,
      icon: wishIcon,
      rating: wishRating,
      addedAt: Date.now(),
    })
    setWishName('')
    setWishPrice('')
    setWishIcon('🎁')
    setWishRating(3)
    setShowAddWish(false)
    setShowIconPicker(false)
  }

  const handleDeleteWish = async (id: number) => {
    await db.wishlist.delete(id)
  }

  const formatCount = (count: number) => {
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k'
    if (count >= 10) return Math.floor(count).toString()
    if (count >= 1) return count.toFixed(1)
    return count.toFixed(2)
  }

  return (
    <div className="pb-4 space-y-4">
      {/* Today's expense summary */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
        <h2 className="text-xs font-medium text-sub mb-1">💡 今天花了</h2>
        <p className="text-3xl font-light text-text">
          ¥ <span className="font-medium">{amount.toFixed(2)}</span>
        </p>
      </div>

      {/* Equivalents display */}
      {amount > 0 && getTopEquivalents().length > 0 ? (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
          <div className="grid grid-cols-3 gap-3">
            {getTopEquivalents().map((eq) => (
              <div
                key={eq.id}
                className="flex flex-col items-center p-3 bg-bg rounded-xl"
              >
                <span className="text-2xl mb-1">{eq.icon}</span>
                <span className="text-xs text-sub mb-0.5">≈</span>
                <span className="text-lg font-medium text-primary">
                  {formatCount(eq.count)}
                </span>
                <span className="text-xs text-sub mt-0.5">{eq.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-border text-center">
          <span className="text-4xl block mb-3">📝</span>
          <p className="text-sm text-sub">记一笔支出后来看换算</p>
        </div>
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
        <p className="text-xs text-sub/60 mb-3 -mt-2">今天花的钱能换多少愿望？</p>

        <AnimatePresence>
          {showAddWish && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="p-3 bg-bg rounded-xl space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-14 h-11 flex items-center justify-center bg-white rounded-lg border border-border text-2xl hover:border-primary transition-colors"
                  >
                    {wishIcon}
                  </button>
                  <input
                    type="text"
                    placeholder="名称"
                    value={wishName}
                    onChange={(e) => setWishName(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-white rounded-lg border border-border text-sm outline-none focus:border-primary"
                  />
                </div>
                
                <AnimatePresence>
                  {showIconPicker && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-8 gap-2 p-2 bg-white rounded-lg border border-border">
                        {commonIcons.map((icon) => (
                          <button
                            key={icon}
                            onClick={() => {
                              setWishIcon(icon)
                              setShowIconPicker(false)
                            }}
                            className={`w-8 h-8 rounded text-xl hover:bg-bg transition-colors ${
                              wishIcon === icon ? 'bg-primary/10 ring-2 ring-primary' : ''
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="价格"
                    value={wishPrice}
                    onChange={(e) => setWishPrice(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="flex-1 px-3 py-2.5 bg-white rounded-lg border border-border text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleAddWish}
                    disabled={!wishName || !wishPrice || parseFloat(wishPrice) <= 0}
                    className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    添加
                  </button>
                </div>

                <div>
                  <p className="text-xs text-sub mb-1.5">重要程度</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setWishRating(star)}
                        className={`text-2xl transition-transform hover:scale-110 ${
                          star <= wishRating ? 'grayscale-0' : 'grayscale opacity-30'
                        }`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {wishlist && wishlist.length > 0 ? (
          <div className="space-y-3">
            {[...wishlist].sort((a, b) => (b.rating || 0) - (a.rating || 0)).map((item) => {
              const count = amount > 0 ? amount / item.price : 0
              return (
                <motion.div
                  key={item.id}
                  layout
                  className="relative p-4 bg-bg rounded-xl flex items-center gap-3"
                >
                  <button
                    onClick={() => handleDeleteWish(item.id!)}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/80 text-sub/60 hover:text-expense text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                  <span className="text-3xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text">{item.name}</p>
                      {item.rating && (
                        <div className="flex gap-0.5">
                          {Array.from({ length: item.rating }).map((_, i) => (
                            <span key={i} className="text-xs">⭐</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-sub">¥{item.price}</p>
                  </div>
                  {amount > 0 ? (
                    <div className="text-right">
                      <p className="text-lg font-medium text-primary">≈</p>
                      <p className="text-sm text-primary font-medium">
                        {count >= 1 ? Math.floor(count) : count.toFixed(1)}个
                      </p>
                    </div>
                  ) : (
                    <div className="text-right">
                      <p className="text-xs text-sub">记一笔</p>
                      <p className="text-xs text-sub">再看</p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-sub text-center py-4">
            添加想要的东西，看看今天消费能换多少
          </p>
        )}
      </div>
    </div>
  )
}
