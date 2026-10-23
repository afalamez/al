<script setup>
// Ecrã final: fogo-de-artifício de corações depois do "Sim".
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Foto from './Foto.vue'
import config from '../config.js'

const emit = defineEmits(['fechar'])
const canvas = ref(null)
const COLORS = ['#ff2d3d', '#e11d2e', '#ff6b78', '#ffd1d6', '#b3001b']

let ctx, raf, w, h, nextBurst = 0
const hearts = []
const hoje = (config.sim.data ? new Date(config.sim.data + 'T12:00') : new Date()).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })

function heartPath(x, y, size) {
  const s = size
  ctx.moveTo(x, y + s * 0.3)
  ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3)
  ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s)
  ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3)
  ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3)
}

function burst(x, y, n = 46) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.2
    const v = 3 + Math.random() * 6
    hearts.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 1.5,
      size: 8 + Math.random() * 14,
      life: 1,
      decay: 0.006 + Math.random() * 0.008,
      color: COLORS[(Math.random() * COLORS.length) | 0],
    })
  }
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  w = window.innerWidth
  h = window.innerHeight
  canvas.value.width = w * dpr
  canvas.value.height = h * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function loop(now) {
  raf = requestAnimationFrame(loop)
  if (now > nextBurst) {
    burst(w * (0.15 + Math.random() * 0.7), h * (0.15 + Math.random() * 0.45))
    nextBurst = now + 650 + Math.random() * 700
  }
  // chuva suave de corações
  if (Math.random() < 0.25) {
    hearts.push({
      x: Math.random() * w,
      y: -20,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 1 + Math.random() * 1.5,
      size: 6 + Math.random() * 10,
      life: 1,
      decay: 0.002,
      color: COLORS[(Math.random() * COLORS.length) | 0],
    })
  }
  ctx.clearRect(0, 0, w, h)
  for (let i = hearts.length - 1; i >= 0; i--) {
    const p = hearts[i]
    p.vy += 0.06
    p.vx *= 0.99
    p.x += p.vx
    p.y += p.vy
    p.life -= p.decay
    if (p.life <= 0 || p.y > h + 40) {
      hearts.splice(i, 1)
      continue
    }
    ctx.globalAlpha = Math.max(0, p.life)
    ctx.fillStyle = p.color
    ctx.beginPath()
    heartPath(p.x, p.y, p.size)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  resize()
  window.addEventListener('resize', resize)
  burst(w / 2, h * 0.4, 90)
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) raf = requestAnimationFrame(loop)
  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="celebracao" role="dialog" aria-modal="true" :aria-label="config.sim.titulo">
    <canvas ref="canvas" aria-hidden="true"></canvas>
    <div class="conteudo">
      <div class="foto"><Foto :src="config.sim.foto" :alt="`${config.nomeDele} e ${config.nomeDela}`" /></div>
      <span class="script">{{ config.nomeDele }} &amp; {{ config.nomeDela }}</span>
      <h2 class="gradient-text">{{ config.sim.titulo }}</h2>
      <p>{{ config.sim.texto }}</p>
      <time>{{ hoje }}</time>
      <button class="btn btn-ghost" type="button" @click="emit('fechar')">Voltar à página</button>
    </div>
  </div>
</template>

<style scoped>
.celebracao {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  overflow-y: auto;
  padding: 24px 16px;
  background: radial-gradient(circle at 50% 40%, #3a0710f2, #050505fa 70%);
  animation: entrar 0.6s ease both;
}
canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.conteudo {
  position: relative;
  max-width: 520px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  animation: subir 0.9s 0.2s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.foto {
  width: min(62vw, 240px);
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--red);
  box-shadow: 0 0 0 8px #e11d2e22, 0 0 60px #e11d2e88;
  animation: pulsar 1.15s ease-in-out infinite;
}
.foto :deep(img) { object-position: 72% 50%; }
.script { font-size: clamp(30px, 6vw, 44px); line-height: 1; margin-top: 8px; }
h2 { font-size: clamp(38px, 8vw, 64px); line-height: 1.05; }
p { color: var(--text-h); font-size: 18px; }
time { color: var(--text); font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; }
.btn { margin-top: 10px; }

@keyframes entrar { from { opacity: 0; } }
@keyframes subir { from { opacity: 0; transform: translateY(40px) scale(0.95); } }
@keyframes pulsar {
  0%, 100% { transform: scale(1); }
  10% { transform: scale(1.05); }
  25% { transform: scale(1); }
  38% { transform: scale(1.03); }
}
</style>
