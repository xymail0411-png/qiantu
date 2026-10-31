import type { Prize } from '../db'

export const defaultPrizes: Omit<Prize, 'id'>[] = [
  // 普通 60%
  { name: '一粒米', icon: '🍚', rarity: 'common', probability: 0.075 },
  { name: '一根头发', icon: '💇', rarity: 'common', probability: 0.075 },
  { name: '一块砖头', icon: '🧱', rarity: 'common', probability: 0.075 },
  { name: '一片树叶', icon: '🍂', rarity: 'common', probability: 0.075 },
  { name: '一颗石子', icon: '🪨', rarity: 'common', probability: 0.075 },
  { name: '一滴水', icon: '💧', rarity: 'common', probability: 0.075 },
  { name: '一根火柴', icon: '🔥', rarity: 'common', probability: 0.075 },
  { name: '一颗纽扣', icon: '🔘', rarity: 'common', probability: 0.075 },

  // 稀有 30%
  { name: '房屋', icon: '🏠', rarity: 'rare', probability: 0.05 },
  { name: '汽车', icon: '🚗', rarity: 'rare', probability: 0.05 },
  { name: '游轮', icon: '🚢', rarity: 'rare', probability: 0.0375 },
  { name: '钢琴', icon: '🎹', rarity: 'rare', probability: 0.0375 },
  { name: '恐龙化石', icon: '🦕', rarity: 'rare', probability: 0.0375 },
  { name: '金条', icon: '🥇', rarity: 'rare', probability: 0.0375 },
  { name: '钻石', icon: '💎', rarity: 'rare', probability: 0.0375 },
  { name: '古董花瓶', icon: '🏺', rarity: 'rare', probability: 0.0375 },

  // 传说 10%
  { name: '飞机', icon: '✈️', rarity: 'legendary', probability: 0.0167 },
  { name: '火箭', icon: '🚀', rarity: 'legendary', probability: 0.0167 },
  { name: '星球', icon: '🪐', rarity: 'legendary', probability: 0.0166 },
  { name: '城堡', icon: '🏰', rarity: 'legendary', probability: 0.0125 },
  { name: '时光机', icon: '⏰', rarity: 'legendary', probability: 0.0125 },
  { name: '神龙', icon: '🐉', rarity: 'legendary', probability: 0.0125 },
  { name: '魔法杖', icon: '🪄', rarity: 'legendary', probability: 0.0125 },
  { name: '彩虹桥', icon: '🌈', rarity: 'legendary', probability: 0.01 },
]
