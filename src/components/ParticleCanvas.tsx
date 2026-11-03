import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  decay: number
  rotation: number
  rotationSpeed: number
  shape: 'circle' | 'star' | 'sparkle'
}

const RARITY_CONFIG = {
  common: {
    count: 12,
    colors: ['#F0E6D8', '#E8DDD0', '#FFF8F0', '#D4C9C0'],
    shapes: ['circle' as const],
    sizeRange: [3, 6],
    speedRange: [2, 5],
  },
  rare: {
    count: 24,
    colors: ['#FFD93D', '#FFB347', '#FF9B9B', '#FFD700'],
    shapes: ['circle' as const, 'star' as const],
    sizeRange: [4, 8],
    speedRange: [3, 7],
  },
  legendary: {
    count: 48,
    colors: ['#FF9B9B', '#B8A9FF', '#7FD8A8', '#FFD93D', '#FF7EB3', '#A8D8EA'],
    shapes: ['circle' as const, 'star' as const, 'sparkle' as const],
    sizeRange: [4, 10],
    speedRange: [4, 10],
  },
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rotation: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
    const method = i === 0 ? 'moveTo' : 'lineTo'
    ctx[method](Math.cos(angle) * r, Math.sin(angle) * r)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rotation: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.beginPath()
  ctx.moveTo(0, -r)
  ctx.quadraticCurveTo(r * 0.3, -r * 0.3, r, 0)
  ctx.quadraticCurveTo(r * 0.3, r * 0.3, 0, r)
  ctx.quadraticCurveTo(-r * 0.3, r * 0.3, -r, 0)
  ctx.quadraticCurveTo(-r * 0.3, -r * 0.3, 0, -r)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export default function ParticleCanvas({
  rarity,
  active,
  onComplete,
}: {
  rarity: 'common' | 'rare' | 'legendary'
  active: boolean
  onComplete: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animFrameRef = useRef<number>(0)

  useEffect(() => {
    if (!active || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const config = RARITY_CONFIG[rarity]

    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)

    const cx = canvas.offsetWidth / 2
    const cy = canvas.offsetHeight / 2

    particlesRef.current = []
    for (let i = 0; i < config.count; i++) {
      const angle = (Math.PI * 2 * i) / config.count + (Math.random() - 0.5) * 0.5
      const speed = config.speedRange[0] + Math.random() * (config.speedRange[1] - config.speedRange[0])
      const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0])
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        alpha: 1,
        decay: 0.008 + Math.random() * 0.008,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        shape: config.shapes[Math.floor(Math.random() * config.shapes.length)],
      })
    }

    let running = true
    const animate = () => {
      if (!running) return
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      let alive = 0
      for (const p of particlesRef.current) {
        if (p.alpha <= 0) continue
        alive++
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.1
        p.alpha -= p.decay
        p.rotation += p.rotationSpeed

        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.fillStyle = p.color

        if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        } else if (p.shape === 'star') {
          drawStar(ctx, p.x, p.y, p.size, p.rotation)
        } else {
          drawSparkle(ctx, p.x, p.y, p.size * 1.5, p.rotation)
        }
      }

      ctx.globalAlpha = 1

      if (alive > 0) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        onComplete()
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      running = false
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [active, rarity, onComplete])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  )
}
