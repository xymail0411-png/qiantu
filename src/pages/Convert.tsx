import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { defaultEquivalents, experienceEquivalents } from '../data/equivalents'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type TabType = 'physical' | 'experience' | 'labor'

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

  const [activeTab, setActiveTab] = useState<TabType>('physical')
  const [hourlyWage, setHourlyWage] = useState('')
  const [showAddWish, setShowAddWish] = useState(false)
  const [wishName, setWishName] = useState('')
  const [wishPrice, setWishPrice] = useState('')
  const [wishIcon, setWishIcon] = useState('🎁')
  const [showAddEquiv, setShowAddEquiv] = useState(false)
  const [equivName, setEquivName] = useState('')
  const [equivPrice, setEquivPrice] = useState('')
  const [equivIcon, setEquivIcon] = useState('📦')

  useEffect(() => {
    if (equivalents && equivalents.length === 0) {
      db.equivalents.bulkAdd(defaultEquivalents as any)
    }
  }, [equivalents])

  const amount = todayExpense || 0
  const physicalItems = equivalents || []

  const getTopPhysicalItems = () => {
    if (amount <= 0) return []
    return physicalItems
      .map(eq => ({ ...eq, count: amount / eq.price }))
      .filter(eq => eq.count >= 0.5)
      .sort((a, b) => {
        const aScore = a.count >= 1 && a.count <= 100 ? 1 : 0
        const bScore = b.count >= 1 && b.count <= 100 ? 1 : 0
        return bScore - aScore || Math.abs(1 - a.count) - Math.abs(1 - b.count)
      })
      .slice(0, 3)
  }

  const getTopExperienceItems = () => {
    if (amount <= 0) return []
    return experienceEquivalents
      .map(eq => ({ ...eq, count: amount / eq.price }))
      .filter(eq => eq.count >= 0.1)
      .sort((a, b) => Math.abs(1 - a.count) - Math.abs(1 - b.count))
      .slice(0, 3)
  }

  const laborHours = hourlyWage && parseFloat(hourlyWage) > 0
    ? amount / parseFloat(hourlyWage)
    : 0

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

  const handleAddEquiv = async () => {
    if (!equivName || !equivPrice) return
    await db.equivalents.add({
      name: equivName,
      price: parseFloat(equivPrice),
      icon: equivIcon,
      isCustom: true,
    })
    setEquivName('')
    setEquivPrice('')
    setEquivIcon('📦')
    setShowAddEquiv(false)
  }

  const handleDeleteEquiv = async (id: number) => {
    await db.equivalents.delete(id)
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

      {/* Tab switcher */}
      <div className="flex bg-white rounded-xl p-1 shadow-sm border border-border">
        <TabButton 
          active={activeTab === 'physical'} 
          onClick={() => setActiveTab('physical')}
          icon="🍚"
          label="实物"
        />
        <TabButton 
          active={activeTab === 'experience'} 
          onClick={() => setActiveTab('experience')}
          icon="🎬"
          label="体验"
        />
        <TabButton 
          active={activeTab === 'labor'} 
          onClick={() => setActiveTab('labor')}
          icon="⏱️"
          label="工时"
        />
      </div>

      {/* Content based on active tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'physical' && (
          <motion.div
            key="physical"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {amount > 0 && getTopPhysicalItems().length > 0 ? (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-text">相当于</h3>
                  <button
                    onClick={() => setShowAddEquiv(!showAddEquiv)}
                    className="text-xs text-primary font-medium"
                  >
                    {showAddEquiv ? '取消' : '+ 自定义'}
                  </button>
                </div>

                <AnimatePresence>
                  {showAddEquiv && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mb-4 overflow-hidden"
                    >
                      <AddEquivForm
                        icon={equivIcon}
                        setIcon={setEquivIcon}
                        name={equivName}
                        setName={setEquivName}
                        price={equivPrice}
                        setPrice={setEquivPrice}
                        onAdd={handleAddEquiv}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-3 gap-3">
                  {getTopPhysicalItems().map((eq) => (
                    <div
                      key={eq.id}
                      className="relative flex flex-col items-center p-3 bg-bg rounded-xl"
                    >
                      {eq.isCustom && (
                        <button
                          onClick={() => handleDeleteEquiv(eq.id!)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/80 text-sub/60 hover:text-expense text-xs flex items-center justify-center"
                        >
                          ✕
                        </button>
                      )}
                      <span className="text-2xl mb-1">{eq.icon}</span>
                      <span className="text-lg font-medium text-primary">
                        {formatCount(eq.count)}
                      </span>
                      <span className="text-xs text-sub mt-0.5">{eq.name}</span>
                    </div>
                  ))}
                </div>

                {physicalItems.length > 3 && (
                  <p className="text-xs text-sub/60 text-center mt-3">
                    还有 {physicalItems.length - 3} 个参照物
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-border text-center">
                <span className="text-4xl block mb-3">📝</span>
                <p className="text-sm text-sub">记一笔支出后来看换算</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'experience' && (
          <motion.div
            key="experience"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {amount > 0 && getTopExperienceItems().length > 0 ? (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
                <h3 className="text-sm font-medium text-text mb-4">相当于</h3>
                <div className="grid grid-cols-3 gap-3">
                  {getTopExperienceItems().map((eq) => (
                    <div
                      key={eq.name}
                      className="flex flex-col items-center p-3 bg-bg rounded-xl"
                    >
                      <span className="text-2xl mb-1">{eq.icon}</span>
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
          </motion.div>
        )}

        {activeTab === 'labor' && (
          <motion.div
            key="labor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="text-sm font-medium text-text mb-4">⏱️ 劳动工时</h3>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="number"
                  placeholder="填写时薪"
                  value={hourlyWage}
                  onChange={(e) => setHourlyWage(e.target.value)}
                  className="flex-1 px-4 py-3 bg-bg rounded-xl border border-border text-sm outline-none focus:border-primary transition-colors"
                />
                <span className="text-sm text-sub">元/时</span>
              </div>
              {laborHours > 0 && amount > 0 ? (
                <div className="p-5 bg-primary/5 rounded-xl text-center">
                  <p className="text-xs text-sub mb-2">今天的消费 =</p>
                  <p className="text-3xl font-medium text-primary">
                    {laborHours >= 1 ? laborHours.toFixed(1) : (laborHours * 60).toFixed(0)}
                  </p>
                  <p className="text-sm text-sub mt-1">
                    {laborHours >= 1 ? '小时工作收入' : '分钟劳动时间'}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-sub/60 text-center py-4">
                  填写时薪后查看换算
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <input
                    type="text"
                    placeholder="🎁"
                    value={wishIcon}
                    onChange={(e) => setWishIcon(e.target.value)}
                    className="w-14 px-2 py-2.5 text-center bg-white rounded-lg border border-border text-sm outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="名称"
                    value={wishName}
                    onChange={(e) => setWishName(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-white rounded-lg border border-border text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="价格"
                    value={wishPrice}
                    onChange={(e) => setWishPrice(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-white rounded-lg border border-border text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleAddWish}
                    className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium"
                  >
                    添加
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/80 text-sub/60 hover:text-expense text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-sm font-medium text-text mt-1">{item.name}</p>
                  <p className="text-xs text-sub">¥{item.price}</p>
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-xs text-primary">
                      = {amount > 0 ? `${daysNeeded} 天` : '记一笔再看'}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-sub text-center py-4">
            添加想买的东西，看看要攒几天
          </p>
        )}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-primary text-white shadow-sm' 
          : 'text-sub hover:bg-bg'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function AddEquivForm({ icon, setIcon, name, setName, price, setPrice, onAdd }: {
  icon: string
  setIcon: (v: string) => void
  name: string
  setName: (v: string) => void
  price: string
  setPrice: (v: string) => void
  onAdd: () => void
}) {
  return (
    <div className="p-3 bg-bg rounded-xl space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="📦"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="w-14 px-2 py-2.5 text-center bg-white rounded-lg border border-border text-sm outline-none focus:border-primary"
        />
        <input
          type="text"
          placeholder="名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-3 py-2.5 bg-white rounded-lg border border-border text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="单价（元）"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="flex-1 px-3 py-2.5 bg-white rounded-lg border border-border text-sm outline-none focus:border-primary"
        />
        <button
          onClick={onAdd}
          className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium"
        >
          添加
        </button>
      </div>
    </div>
  )
}
