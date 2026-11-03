import type { EquivalentItem } from '../db'

export const defaultEquivalents: Omit<EquivalentItem, 'id'>[] = [
  { name: '鸡蛋', price: 1.5, icon: '🥚', isCustom: false },
  { name: '矿泉水', price: 2, icon: '💧', isCustom: false },
  { name: '电影票', price: 40, icon: '🎬', isCustom: false },
]

export const experienceEquivalents: Omit<EquivalentItem, 'id'>[] = [
  { name: '奶茶', price: 15, icon: '🧋', isCustom: false },
  { name: '咖啡', price: 25, icon: '☕', isCustom: false },
  { name: '蛋糕', price: 30, icon: '🍰', isCustom: false },
  { name: '火锅', price: 80, icon: '🍲', isCustom: false },
  { name: '烧烤', price: 50, icon: '🍖', isCustom: false },
  { name: '披萨', price: 60, icon: '🍕', isCustom: false },
]
