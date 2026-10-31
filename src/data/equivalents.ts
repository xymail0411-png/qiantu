import type { EquivalentItem } from '../db'

export const defaultEquivalents: Omit<EquivalentItem, 'id'>[] = [
  { name: '奶茶', price: 18, icon: '🧋', isCustom: false },
  { name: '星巴克', price: 35, icon: '☕', isCustom: false },
  { name: '电影票', price: 50, icon: '🎬', isCustom: false },
  { name: '外卖', price: 25, icon: '🍱', isCustom: false },
  { name: '技术书', price: 100, icon: '📚', isCustom: false },
]
