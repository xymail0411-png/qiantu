import Dexie, { type Table } from 'dexie'

export interface Transaction {
  id?: number
  date: string
  category: string
  amount: number
  type: 'expense' | 'income'
  note?: string
  createdAt: number
}

export interface Goal {
  id?: number
  title: string
  targetAmount: number
  currentAmount: number
  deadline: string
  createdAt: number
}

export interface WishlistItem {
  id?: number
  name: string
  price: number
  icon: string
  addedAt: number
}

export interface EquivalentItem {
  id?: number
  name: string
  price: number
  icon: string
  isCustom: boolean
}

export interface Prize {
  id?: number
  name: string
  icon: string
  rarity: 'common' | 'rare' | 'legendary'
  probability: number
}

export interface Achievement {
  id?: number
  prizeId: number
  prizeName: string
  prizeIcon: string
  rarity: string
  unlockedAt: number
  sourceAmount: number
}

export interface Badge {
  id?: number
  name: string
  icon: string
  requiredCount: number
  currentCount: number
  unlockedAt?: number
}

export interface BoxRecord {
  id?: number
  date: string
  prizeId: number
  openedAt: number
}

class QianTuDB extends Dexie {
  transactions!: Table<Transaction>
  goals!: Table<Goal>
  wishlist!: Table<WishlistItem>
  equivalents!: Table<EquivalentItem>
  prizes!: Table<Prize>
  achievements!: Table<Achievement>
  badges!: Table<Badge>
  boxHistory!: Table<BoxRecord>

  constructor() {
    super('QianTu')
    this.version(1).stores({
      transactions: '++id, date, category, type, createdAt',
      goals: '++id, createdAt',
      wishlist: '++id, addedAt',
      equivalents: '++id, isCustom',
      prizes: '++id, rarity',
      achievements: '++id, prizeId, unlockedAt',
      badges: '++id, name',
      boxHistory: '++id, date, openedAt',
    })
  }
}

export const db = new QianTuDB()
