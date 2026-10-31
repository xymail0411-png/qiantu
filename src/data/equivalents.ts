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
  { name: '电影票', price: 50, icon: '🎬', isCustom: false },
  { name: 'KTV 小时', price: 40, icon: '🎤', isCustom: false },
  { name: '保龄球', price: 60, icon: '🎳', isCustom: false },
  { name: '网吧小时', price: 8, icon: '🖥️', isCustom: false },
  { name: '密室逃脱', price: 120, icon: '🔐', isCustom: false },
  { name: '剧本杀', price: 150, icon: '🎭', isCustom: false },
]
