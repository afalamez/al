<script setup>
// Partículas formam as iniciais → explodem → juntam-se num coração que bate
// → implodem de volta às iniciais. O rato/dedo empurra as partículas.
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  text: { type: String, default: '♥' },
})

const canvas = ref(null)

const TEXT_MS = 2800
const HEART_MS = 7500
const EXPLODE_MS = 1500
const IMPLODE_MS = 1600
const REPEL_RADIUS = 110
const AMBIENT = 70
const COLORS = ['#ff2d3d', '#e11d2e', '#ff6b78', '#b3001b', '#ffd1d6']
const PHYS = {
  text: { spring: 0.014, damping: 0.88 },
  explode: { spring: 0.0028, damping: 0.968 },
  heart: { spring: 0.03, damping: 0.84 },
  implode: { spring: 0.02, damping: 0.87 },
}

let ctx, raf, resizeObs, visObs, parent
const s = {
  width: 0,
  height: 0,
  particles: [],
  ripples: [],
  stage: 'text',
  stageStart: 0,
  spread: 0,
  pointer: { x: -9999, y: -9999, active: false },
  visible: true,
  reduced: false,
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function center() {
  return { x: s.width / 2, y: s.height * 0.4 }
}

// Desenha uma forma num canvas escondido e devolve os pixels preenchidos.
function sampleShape(draw) {
  const w = Math.round(s.width)
  const h = Math.round(s.height)
  const off = document.createElement('canvas')
  off.width = w
  off.height = h
  const c = off.getContext('2d', { willReadFrequently: true })
  c.fillStyle = '#fff'
  draw(c)
  const { data } = c.getImageData(0, 0, w, h)
  const pts = []
  const step = 3
  for (let y = 0; y < h; y += step)
    for (let x = 0; x < w; x += step) if (data[(y * w + x) * 4 + 3] > 128) pts.push({ x, y })
  return shuffle(pts)
}

function textPoints() {
  const { x, y } = center()
  return sampleShape((c) => {
    let size = Math.min(s.height * 0.3, 240)
    c.font = `800 ${size}px 'Playfair Display', Georgia, serif`
    const measured = c.measureText(props.text).width
    if (measured > s.width * 0.86) size *= (s.width * 0.86) / measured
    c.font = `800 ${size}px 'Playfair Display', Georgia, serif`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText(props.text, x, y)
  })
}

function heartPoints() {
  const { x, y } = center()
  const size = Math.min(s.width * 0.42, s.height * 0.5) / 34
  return sampleShape((c) => {
    c.beginPath()
    for (let t = 0; t <= Math.PI * 2; t += 0.02) {
      const hx = 16 * Math.sin(t) ** 3
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
      c.lineTo(x + hx * size, y - hy * size - size * 1.5)
    }
    c.closePath()
    c.fill()
  })
}

function fit(pts, n) {
  const out = []
  for (let i = 0; i < n; i++) {
    const p = pts[i % pts.length] || center()
    const jitter = i >= pts.length ? 2 : 0
    out.push({ x: p.x + (Math.random() - 0.5) * jitter, y: p.y + (Math.random() - 0.5) * jitter })
  }
  return out
}

function build() {
  const area = s.width * s.height
  const n = Math.round(Math.min(1500, Math.max(550, area / 850)))
  const tp = fit(textPoints(), n)
  const hp = fit(heartPoints(), n)
  s.particles = []
  for (let i = 0; i < n; i++) {
    s.particles.push({
      shape: true,
      x: Math.random() * s.width,
      y: Math.random() * s.height,
      vx: 0,
      vy: 0,
      textX: tp[i].x,
      textY: tp[i].y,
      heartX: hp[i].x,
      heartY: hp[i].y,
      homeX: tp[i].x,
      homeY: tp[i].y,
      r: 0.9 + Math.random() * 1.3,
      color: i % 9 === 0 ? 4 : i % 4,
      phase: Math.random() * Math.PI * 2,
    })
  }
  for (let i = 0; i < AMBIENT; i++) {
    s.particles.push({
      shape: false,
      x: Math.random() * s.width,
      y: Math.random() * s.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 0.8 + Math.random() * 1.6,
      color: Math.floor(Math.random() * COLORS.length),
      phase: 0,
    })
  }
}

function explode(now) {
  const c = center()
  for (const p of s.particles) {
    if (!p.shape) continue
    const force = 5 + Math.random() * 11
    const a = Math.atan2(p.y - c.y, p.x - c.x) + (Math.random() - 0.5) * 0.9
    p.vx += Math.cos(a) * force
    p.vy += Math.sin(a) * force
    p.homeX = p.heartX
    p.homeY = p.heartY
  }
  const reach = Math.hypot(s.width, s.height) * 0.6
  s.ripples.push({ ...c, start: now, duration: 1100, reach, width: 3 })
  s.ripples.push({ ...c, start: now + 140, duration: 1400, reach: reach * 0.7, width: 1.5 })
  setStage('heart', now)
}

function implode(now) {
  const c = center()
  for (const p of s.particles) {
    if (!p.shape) continue
    p.homeX = p.textX
    p.homeY = p.textY
    const dx = p.x - c.x
    const dy = p.y - c.y
    const d = Math.hypot(dx, dy) || 1
    p.vx += (-dy / d) * 2.4
    p.vy += (dx / d) * 2.4
  }
  setStage('text', now)
}

function setStage(stage, now) {
  s.stage = stage
  s.stageStart = now
}

// Batida dupla "tum-tum"
function heartbeat(now) {
  const p = (now % 1150) / 1150
  return Math.exp(-(((p - 0.08) / 0.05) ** 2)) + 0.6 * Math.exp(-(((p - 0.26) / 0.06) ** 2))
}

function update(now) {
  const t = now - s.stageStart
  if (s.stage === 'text' && t > TEXT_MS) explode(now)
  else if (s.stage === 'heart' && t > HEART_MS) implode(now)

  const elapsed = now - s.stageStart
  s.spread += ((s.stage === 'heart' && elapsed < EXPLODE_MS ? 1 : 0) - s.spread) * 0.06

  let phys = PHYS[s.stage]
  if (s.stage === 'heart' && elapsed < EXPLODE_MS) phys = PHYS.explode
  if (s.stage === 'text' && elapsed < IMPLODE_MS) phys = PHYS.implode

  const c = center()
  const beat = s.stage === 'heart' && elapsed > EXPLODE_MS ? heartbeat(now) : 0
  const scale = 1 + beat * 0.07
  const { x: px, y: py, active } = s.pointer

  for (const p of s.particles) {
    if (active) {
      const dx = p.x - px
      const dy = p.y - py
      const d = Math.hypot(dx, dy)
      if (d < REPEL_RADIUS && d > 0) {
        const f = ((REPEL_RADIUS - d) / REPEL_RADIUS) * 1.4
        p.vx += (dx / d) * f
        p.vy += (dy / d) * f
      }
    }
    if (p.shape) {
      const wob = Math.sin(now / 600 + p.phase) * 0.6
      const hx = c.x + (p.homeX - c.x) * scale + wob
      const hy = c.y + (p.homeY - c.y) * scale + Math.cos(now / 700 + p.phase) * 0.6
      p.vx += (hx - p.x) * phys.spring
      p.vy += (hy - p.y) * phys.spring
      p.vx *= phys.damping
      p.vy *= phys.damping
    } else {
      p.vx += (Math.random() - 0.5) * 0.03
      p.vy += (Math.random() - 0.5) * 0.03
      p.vx *= 0.985
      p.vy *= 0.985
      if (p.x < 0 || p.x > s.width) p.vx *= -1
      if (p.y < 0 || p.y > s.height) p.vy *= -1
    }
    p.x += p.vx
    p.y += p.vy
  }
  s.ripples = s.ripples.filter((r) => now - r.start < r.duration)
}

function drawLinks(linkDist) {
  // grelha espacial para ligar partículas próximas (efeito constelação)
  const cell = linkDist
  const grid = new Map()
  const list = s.particles
  for (let i = 0; i < list.length; i++) {
    const p = list[i]
    const key = ((p.x / cell) | 0) + ',' + ((p.y / cell) | 0)
    let arr = grid.get(key)
    if (!arr) grid.set(key, (arr = []))
    arr.push(i)
  }
  const max2 = linkDist * linkDist
  ctx.lineWidth = 0.6
  ctx.strokeStyle = '#e11d2e'
  for (let i = 0; i < list.length; i += 2) {
    const a = list[i]
    const cx = (a.x / cell) | 0
    const cy = (a.y / cell) | 0
    for (let gx = cx - 1; gx <= cx + 1; gx++)
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        const arr = grid.get(gx + ',' + gy)
        if (!arr) continue
        for (const j of arr) {
          if (j <= i) continue
          const b = list[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < max2) {
            ctx.globalAlpha = (1 - d2 / max2) * 0.22
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
  }
  ctx.globalAlpha = 1
}

function draw(now) {
  ctx.clearRect(0, 0, s.width, s.height)
  ctx.globalCompositeOperation = 'lighter'

  drawLinks(16 + 44 * s.spread)

  // brilho no centro durante a batida
  if (s.stage === 'heart') {
    const c = center()
    const glow = 0.12 + heartbeat(now) * 0.18
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.min(s.width, s.height) * 0.45)
    g.addColorStop(0, `rgba(225,29,46,${glow})`)
    g.addColorStop(1, 'rgba(225,29,46,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s.width, s.height)
  }

  for (let ci = 0; ci < COLORS.length; ci++) {
    ctx.fillStyle = COLORS[ci]
    ctx.beginPath()
    for (const p of s.particles) {
      if (p.color !== ci) continue
      ctx.moveTo(p.x + p.r, p.y)
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    }
    ctx.fill()
  }

  for (const r of s.ripples) {
    const k = (now - r.start) / r.duration
    if (k < 0) continue
    const e = 1 - (1 - k) ** 3
    ctx.strokeStyle = `rgba(255,77,94,${(1 - k) * 0.7})`
    ctx.lineWidth = r.width
    ctx.beginPath()
    ctx.arc(r.x, r.y, r.reach * e, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalCompositeOperation = 'source-over'
}

function loop(now) {
  raf = requestAnimationFrame(loop)
  if (!s.visible) return
  update(now)
  draw(now)
}

function resize() {
  const rect = parent.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  s.width = rect.width
  s.height = rect.height
  canvas.value.width = Math.round(rect.width * dpr)
  canvas.value.height = Math.round(rect.height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  build()
  const now = performance.now()
  s.ripples = []
  if (s.reduced) {
    for (const p of s.particles) if (p.shape) ((p.x = p.homeX = p.heartX), (p.y = p.homeY = p.heartY))
    setStage('heart', now - EXPLODE_MS)
    draw(now)
  } else {
    setStage('text', now)
  }
}

function onMove(e) {
  const rect = canvas.value.getBoundingClientRect()
  const pt = e.touches ? e.touches[0] : e
  s.pointer.x = pt.clientX - rect.left
  s.pointer.y = pt.clientY - rect.top
  s.pointer.active = true
}
function onLeave() {
  s.pointer.active = false
}

onMounted(async () => {
  parent = canvas.value.parentElement
  ctx = canvas.value.getContext('2d')
  s.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // espera a fonte para as iniciais saírem bonitas
  try {
    await document.fonts.load("800 100px 'Playfair Display'")
  } catch {}
  resize()
  let lastW = s.width
  resizeObs = new ResizeObserver(() => {
    // ignorar mudanças só de altura (barra do browser no telemóvel)
    const w = parent.getBoundingClientRect().width
    if (Math.abs(w - lastW) > 2) {
      lastW = w
      resize()
    }
  })
  resizeObs.observe(parent)
  visObs = new IntersectionObserver(([e]) => (s.visible = e.isIntersecting))
  visObs.observe(parent)
  parent.addEventListener('pointermove', onMove)
  parent.addEventListener('pointerleave', onLeave)
  parent.addEventListener('touchmove', onMove, { passive: true })
  parent.addEventListener('touchend', onLeave)
  if (!s.reduced) raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  resizeObs?.disconnect()
  visObs?.disconnect()
  parent?.removeEventListener('pointermove', onMove)
  parent?.removeEventListener('pointerleave', onLeave)
  parent?.removeEventListener('touchmove', onMove)
  parent?.removeEventListener('touchend', onLeave)
})
</script>

<template>
  <canvas ref="canvas" class="heart-canvas" aria-hidden="true"></canvas>
</template>

<style scoped>
.heart-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  z-index: -2;
}
</style>
