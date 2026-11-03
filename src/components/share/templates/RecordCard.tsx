import { allCategories } from '../../../data/categories'

interface RecordCardProps {
  category: string
  amount: number
  type: 'expense' | 'income'
  note?: string
  mood?: string
  date: string
  equivalent?: string
}

export default function RecordCard({ category, amount, type, note, mood, date, equivalent }: RecordCardProps) {
  const icon = allCategories.find((c) => c.label === category)?.icon || '📝'
  const dateStr = new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div
      id="save-template"
      className="w-[320px] bg-cream rounded-3xl p-6 border-2 border-dashed border-border"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <img src="/logo/qiantu-logo.png" className="w-8 h-8 rounded-lg" alt="钱途" />
          <span className="text-sm font-bold text-text">钱途 · 记账卡片</span>
        </div>
        <span className="text-xs text-sub">{dateStr}</span>
      </div>

      {/* Main content */}
      <div className="bg-white rounded-2xl p-5 border border-border/50 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <p className="text-base font-bold text-text">{category}</p>
            {mood && <span className="text-lg">{mood}</span>}
          </div>
          <div className="ml-auto text-right">
            <p className={`text-xl font-extrabold ${type === 'expense' ? 'text-expense' : 'text-income'}`}>
              {type === 'expense' ? '-' : '+'}¥{amount.toFixed(2)}
            </p>
          </div>
        </div>
        {note && (
          <p className="text-sm text-sub mb-2">📝 {note}</p>
        )}
        {equivalent && (
          <div className="bg-coral-light/15 rounded-xl px-3 py-2 mt-2">
            <p className="text-xs text-coral font-medium">{equivalent}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-[10px] text-sub/60">✨ 钱途 · 让每一笔消费都有意义 ☁️</p>
      </div>
    </div>
  )
}
