interface BlindBoxCardProps {
  prizeName: string
  prizeIcon: string
  rarity: 'common' | 'rare' | 'legendary'
  sourceAmount: number
  date: string
}

const rarityConfig = {
  common: { bg: 'bg-cream-dark', border: 'border-border', label: '普通', labelBg: 'bg-border/30 text-sub' },
  rare: { bg: 'bg-warm-yellow/15', border: 'border-warm-yellow/50', label: '稀有', labelBg: 'bg-warm-yellow/20 text-warm-yellow' },
  legendary: { bg: 'bg-lavender-light/30', border: 'border-lavender/50', label: '传说', labelBg: 'bg-lavender-light/50 text-lavender' },
}

export default function BlindBoxCard({ prizeName, prizeIcon, rarity, sourceAmount, date }: BlindBoxCardProps) {
  const config = rarityConfig[rarity]
  const dateStr = new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div
      id="save-template"
      className={`w-[320px] bg-cream rounded-3xl p-6 border-2 border-dashed border-border`}
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <img src="/logo/qiantu-logo.png" className="w-8 h-8 rounded-lg" alt="钱途" />
          <span className="text-sm font-bold text-text">钱途 · 盲盒奖品</span>
        </div>
        <span className="text-xs text-sub">{dateStr}</span>
      </div>

      {/* Prize display */}
      <div className={`${config.bg} rounded-2xl p-6 border ${config.border} mb-4 text-center`}>
        <span className="text-6xl block mb-3">{prizeIcon}</span>
        <p className="text-lg font-bold text-text mb-2">{prizeName}</p>
        <span className={`inline-block text-xs px-3 py-1 rounded-full font-bold ${config.labelBg}`}>
          {rarity === 'legendary' ? '✨ ' : rarity === 'rare' ? '⭐ ' : ''}{config.label}
        </span>
      </div>

      {/* Source info */}
      <div className="bg-white rounded-xl px-4 py-3 border border-border/50 mb-4">
        <p className="text-xs text-sub text-center">
          消费 ¥{sourceAmount.toFixed(2)} 获得 🌸
        </p>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-[10px] text-sub/60">✨ 钱途 · 让每一笔消费都有意义 ☁️</p>
      </div>
    </div>
  )
}
