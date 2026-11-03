import { db } from '../db'
import { allCategories } from '../data/categories'

function getCategoryIcon(label: string): string {
  return allCategories.find((c) => c.label === label)?.icon || '📝'
}

export async function exportToCSV(): Promise<void> {
  const transactions = await db.transactions.orderBy('createdAt').reverse().toArray()

  if (transactions.length === 0) return

  const BOM = '\uFEFF'
  const headers = ['日期', '分类', '类型', '金额', '备注', '心情', '记录时间']
  const rows = transactions.map((t) => {
    const icon = getCategoryIcon(t.category)
    const type = t.type === 'expense' ? '支出' : '收入'
    const time = new Date(t.createdAt).toLocaleString('zh-CN')
    const note = (t.note || '').replace(/"/g, '""')
    const mood = t.mood || ''
    return [t.date, `${icon} ${t.category}`, type, t.amount.toFixed(2), note, mood, time]
  })

  const csv = [
    headers.join(','),
    ...rows.map((r) => r.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `钱途记账_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
