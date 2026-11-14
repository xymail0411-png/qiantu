import { spawn } from 'node:child_process'
import { mkdtempSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const playwrightChromium = () => {
  const root = join(homedir(), 'AppData', 'Local', 'ms-playwright')
  const dir = readdirSync(root).filter((d) => d.startsWith('chromium-')).sort().pop()
  return join(root, dir, 'chrome-win64', 'chrome.exe')
}
const CHROME = process.env.CHROME || playwrightChromium()
const APP = 'https://qiantu-v4sx67my80g.qoder.zone/'
const OUT = join(HERE, 'shots')
const PORT = 9333
mkdirSync(OUT, { recursive: true })

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const profile = mkdtempSync(join(tmpdir(), 'qiantu-shots-'))
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*',
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  `--user-data-dir=${profile}`, '--window-size=1440,900', APP,
], { stdio: 'ignore' })

async function connect() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
      const pages = list.filter((t) => t.type === 'page')
      const page = pages.find((t) => t.url.includes('qoder.zone'))
        || pages.find((t) => !t.url.startsWith('chrome')) || pages[0]
      if (page) { console.log('targets:', pages.map((p) => p.url).join(' , ')); return page.webSocketDebuggerUrl }
    } catch {}
    await wait(500)
  }
  throw new Error('chrome devtools endpoint not reachable')
}

let ws, msgId = 0
const pending = new Map()
function send(method, params = {}) {
  const id = ++msgId
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}
async function evl(expression, awaitPromise = false) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true })
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400))
  return r.result?.value
}
const tap = (label) => evl(
  `(() => { const bs = [...document.querySelectorAll('button')]; const t = ${JSON.stringify(label)}; ` +
  `const b = bs.find(x => x.textContent.trim() === t) || bs.find(x => x.textContent.includes(t)); ` +
  `if (!b) return 'NOT_FOUND'; b.scrollIntoView({block:'center'}); b.click(); return b.textContent.trim().slice(0,20); })()`)
const sig = async (name) => console.log('  sig', name, '=>', String(await evl('document.body.innerText.replace(/\\n+/g," ").slice(0,110)')))

async function shot(name, { full = false } = {}) {
  const args = { format: 'png' }
  if (full) {
    const { w, h } = await evl('({w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight})')
    args.captureBeyondViewport = true
    args.clip = { x: 0, y: 0, width: w, height: h, scale: 1 }
  }
  const { data } = await send('Page.captureScreenshot', args)
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(data, 'base64'))
  console.log('shot', name, '=>', (await evl('document.body.innerText.replace(/\\n+/g," ").slice(0,100)')))
}
async function setViewport(width, height, mobile) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile })
}
async function tallShot(name, width, height, mobile = false) {
  await setViewport(width, height, mobile)
  await goto(APP)
  await wait(1500)
  await shot(name)
}
async function goto(url) {
  await send('Page.navigate', { url })
  await waitApp(url)
  await wait(1200)
}
async function waitApp(label) {
  for (let i = 0; i < 60; i++) {
    const ok = await evl(`(() => location.href.startsWith(${JSON.stringify(APP)}) && (document.getElementById('root')?.children.length || 0) > 0)()`)
    if (ok) return true
    await wait(500)
  }
  throw new Error('app not committed before ' + label)
}

const DAYS = [...Array(14)].map((_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`)
const EXP = {
  '2026-11-01': [['餐饮', 25, '食堂午餐'], ['交通', 7, '地铁'], ['学习', 45, '专业书']],
  '2026-11-02': [['餐饮', 32, ''], ['饮品', 15, '奶茶']],
  '2026-11-03': [['餐饮', 28, ''], ['零食', 12, ''], ['交通', 4, '公交']],
  '2026-11-04': [['餐饮', 45, '火锅'], ['娱乐', 30, '电影']],
  '2026-11-05': [['餐饮', 22, ''], ['日用', 18, '洗发水']],
  '2026-11-06': [['餐饮', 30, ''], ['饮品', 8, ''], ['交通', 7, '']],
  '2026-11-07': [['餐饮', 26, ''], ['服饰', 89, '卫衣']],
  '2026-11-08': [['餐饮', 35, ''], ['学习', 15, '打印费']],
  '2026-11-09': [['餐饮', 20, ''], ['饮品', 15, '咖啡'], ['通讯', 30, '话费']],
  '2026-11-10': [['餐饮', 42, '聚餐'], ['娱乐', 25, '']],
  '2026-11-11': [['餐饮', 28, ''], ['购物', 156, '双11 数码配件']],
  '2026-11-12': [['餐饮', 33, ''], ['交通', 7, ''], ['零食', 10, '']],
  '2026-11-13': [['餐饮', 27, ''], ['饮品', 12, '']],
  '2026-11-14': [['餐饮', 25, '午餐'], ['饮品', 15, '奶茶'], ['交通', 7, '地铁']],
}
const INC = {
  '2026-11-01': [['兼职', 1500, '线上兼职结算']],
  '2026-11-05': [['红包', 500, '']],
  '2026-11-08': [['工资', 1200, '实习工资']],
  '2026-11-12': [['理财', 100, '']],
}
const MOODS = ['😊', '😐', '🤩', '😴', '🥳']
const transactions = []
const dayMs = 86400000
DAYS.forEach((date, di) => {
  const push = ([category, amount, note], i) => transactions.push({
    date, category, amount, type: 'expense', note: note || undefined,
    mood: MOODS[(di + i) % MOODS.length], createdAt: Date.parse(date) + (9 + i * 3) * 3600000 + di * 1000,
  })
  ;(EXP[date] || []).forEach(push)
  ;(INC[date] || []).forEach(([category, amount, note], i) => transactions.push({
    date, category, amount, type: 'income', note: note || undefined,
    createdAt: Date.parse(date) + (8 + i) * 3600000,
  }))
})

const PRIZES = {
  1: ['一粒米', '🍚', 'common'], 2: ['一根头发', '💇', 'common'], 3: ['一块砖头', '🧱', 'common'],
  4: ['一片树叶', '🍂', 'common'], 5: ['一颗石子', '🪨', 'common'], 6: ['一滴水', '💧', 'common'],
  7: ['一根火柴', '🔥', 'common'], 8: ['一颗纽扣', '🔘', 'common'], 9: ['房屋', '🏠', 'rare'],
  11: ['游轮', '🚢', 'rare'], 15: ['钻石', '💎', 'rare'], 17: ['飞机', '✈️', 'legendary'],
  20: ['城堡', '🏰', 'legendary'],
}
const BOX = {
  '2026-11-01': 1, '2026-11-02': 4, '2026-11-03': 2, '2026-11-04': 9, '2026-11-05': 5,
  '2026-11-06': 3, '2026-11-07': 17, '2026-11-08': 8, '2026-11-09': 11, '2026-11-10': 6,
  '2026-11-11': 15, '2026-11-12': 7, '2026-11-13': 20,
}
const boxHistory = []
const achievements = []
Object.entries(BOX).forEach(([date, pid], i) => {
  const openedAt = Date.parse(date) + 20 * 3600000
  boxHistory.push({ date, prizeId: pid, openedAt })
  const [prizeName, prizeIcon, rarity] = PRIZES[pid]
  achievements.push({
    prizeId: pid, prizeName, prizeIcon, rarity, unlockedAt: openedAt,
    sourceAmount: (EXP[date]?.[i % (EXP[date]?.length || 1)] || [0, 15])[1],
  })
})

const seed = {
  goals: [{ title: '毕业旅行基金', targetAmount: 4000, currentAmount: 0, deadline: '2027-06-30', achievedMilestones: [], startBalance: 0, createdAt: Date.parse('2026-11-01') }],
  transactions, boxHistory, achievements,
  wishlist: [
    { name: '蓝牙耳机', price: 299, icon: '🎧', rating: 5, addedAt: Date.parse('2026-11-02') },
    { name: '掌机', price: 1499, icon: '🎮', rating: 4, addedAt: Date.parse('2026-11-05') },
    { name: '全套专业书', price: 180, icon: '📚', rating: 3, addedAt: Date.parse('2026-11-09') },
    { name: '生日蛋糕', price: 88, icon: '🍰', rating: 2, addedAt: Date.parse('2026-11-11') },
  ],
  equivalents: [
    { name: '鸡蛋', price: 1.5, icon: '🥚', isCustom: false },
    { name: '矿泉水', price: 2, icon: '💧', isCustom: false },
    { name: '电影票', price: 40, icon: '🎬', isCustom: false },
    { name: '奶茶', price: 15, icon: '🧋', isCustom: true },
    { name: '咖啡', price: 25, icon: '☕', isCustom: true },
  ],
}

const SEED_JS = `(async () => {
  const db = await new Promise((res, rej) => { const r = indexedDB.open('QianTu'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) })
  const fill = (name, rows) => new Promise((res, rej) => {
    const t = db.transaction(name, 'readwrite'); const s = t.objectStore(name)
    s.clear(); rows.forEach(r => s.add(r)); t.oncomplete = () => res(name); t.onerror = () => rej(t.error)
  })
  const data = ${JSON.stringify(seed)}
  for (const [name, rows] of Object.entries(data)) await fill(name, rows)
  return 'SEEDED ' + Object.entries(data).map(([k, v]) => k + ':' + v.length).join(' ')
})()`

try {
  const url = await connect()
  ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id)
      pending.delete(m.id)
      m.error ? reject(new Error(m.error.message)) : resolve(m.result)
    }
  }
  await send('Page.enable')
  await send('Runtime.enable')
  await setViewport(1440, 900, false)
  await goto(APP)
  console.log(await evl(SEED_JS, true))

  await goto(APP)
  await wait(2500)

  // 01 主页：目标进度 + 50% 里程碑旗帜 + 时间线
  await shot('01-home-goal-milestone')

  // 02 记账页：分类网格
  await tap('✏️')
  await wait(700)
  await shot('02-category-grid')

  // 03 金额键盘 + 快捷金额 + 心情
  await tap('餐饮')
  await wait(700)
  await shot('03-amount-keypad')

  // 04 保存后即时等价提示（1.5 秒窗口）
  await evl(`(() => { const bs=[...document.querySelectorAll('button')]; ['1','8'].forEach(t => bs.filter(b=>b.textContent.trim()===t).pop()?.click()); return 'ok' })()`)
  await wait(300)
  await tap('确认记账')
  await wait(420)
  await shot('04-equivalent-hint')

  // 05 消费趋势弹窗
  await goto(APP)
  await wait(2000)
  await tap('消费趋势')
  await wait(1000)
  await shot('05-spending-trend')

  // 06 年度报告
  await goto(APP)
  await wait(2000)
  await tap('2026年')
  await wait(1400)
  await shot('06-year-report', { full: true })

  // 07 值多少：换算 + 愿望清单
  await setViewport(1440, 1750, false)
  await goto(APP)
  await tap('值多少')
  await wait(1600)
  await shot('07-convert-equivalents')

  // 08 开盲盒：入口与打卡/徽章墙
  await setViewport(1440, 900, false)
  await goto(APP)
  await wait(2000)
  await tap('开盲盒')
  await wait(1500)
  await shot('08-game-before-open')

  // 09 盲盒开启动画
  await tap('点击开启')
  await wait(220)
  await shot('09-blindbox-opening')

  // 10 盲盒结果
  await wait(1400)
  await shot('10-blindbox-result')

  // 11 盲盒卡片保存模板
  await tap('保存图片')
  await wait(1500)
  await shot('11-save-card-template')

  // 12 成就墙 + 徽章（长屏一次拍全）
  await setViewport(1440, 2150, false)
  await goto(APP)
  await tap('开盲盒')
  await wait(1500)
  console.log('  expand', await tap('展开全部'))
  await wait(700)
  await shot('12-achievements-badges')

  // 13 移动端主页（真实手机视口）
  await setViewport(430, 932, true)
  await goto(APP)
  await shot('13-mobile-home')

  console.log('DONE')
} finally {
  ws?.close()
  chrome.kill()
}
