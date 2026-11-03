import type { EquivalentItem } from '../db'

export const defaultEquivalents: Omit<EquivalentItem, 'id'>[] = [
  { name: '米饭', price: 2, icon: '🍚', isCustom: false },
  { name: '泡面', price: 5, icon: '🍜', isCustom: false },
  { name: '茶叶蛋', price: 2, icon: '🥚', isCustom: false },
  { name: '矿泉水', price: 2, icon: '💧', isCustom: false },
  { name: '馒头', price: 1.5, icon: '🫓', isCustom: false },
  { name: '包子', price: 2, icon: '🥟', isCustom: false },
  { name: '豆浆', price: 3, icon: '🥛', isCustom: false },
  { name: '煎饼', price: 6, icon: '🫓', isCustom: false },
]

export const experienceEquivalents: Omit<EquivalentItem, 'id'>[] = [
  { name: '奶茶', price: 15, icon: '🧋', isCustom: false },
  { name: '咖啡', price: 25, icon: '☕', isCustom: false },
  { name: '快餐', price: 20, icon: '🍔', isCustom: false },
  { name: '书籍', price: 45, icon: '📚', isCustom: false },
  { name: '电影票', price: 40, icon: '🎬', isCustom: false },
  { name: 'T恤', price: 80, icon: '👕', isCustom: false },
]
