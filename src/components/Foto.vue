<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
})

const falhou = ref(!props.src)
watch(() => props.src, (v) => (falhou.value = !v))

const url = (p) => (/^(https?:|data:|\/)/.test(p) ? p : import.meta.env.BASE_URL + p)
const eVideo = (p) => /\.(mp4|webm|mov|m4v)$/i.test(p)

// Vídeo toca sozinho, sem som.
// - O Vue não escreve o atributo "muted" no HTML e o iPhone exige-o → forçamos à mão.
// - O iPhone não carrega nada até alguém chamar play() → chamamos logo e quando fica visível.
// - Em modo de poupança de bateria o telemóvel bloqueia o autoplay → tenta outra vez ao 1.º toque.
const video = ref(null)
let visObs
const tocar = () => video.value?.play().catch(() => {})
const aoTocarNoEcra = () => tocar()

onMounted(() => {
  const v = video.value
  if (!v) return
  v.muted = true
  v.defaultMuted = true
  v.setAttribute('muted', '')
  v.setAttribute('playsinline', '')
  v.setAttribute('webkit-playsinline', '')
  tocar()
  visObs = new IntersectionObserver(([e]) => e.isIntersecting && tocar())
  visObs.observe(v)
  for (const ev of ['touchstart', 'touchend', 'click', 'scroll'])
    window.addEventListener(ev, aoTocarNoEcra, { passive: true })
})

onBeforeUnmount(() => {
  visObs?.disconnect()
  for (const ev of ['touchstart', 'touchend', 'click', 'scroll'])
    window.removeEventListener(ev, aoTocarNoEcra)
})
</script>

<template>
  <video
    v-if="!falhou && eVideo(src)"
    ref="video"
    :src="url(src)"
    :aria-label="alt"
    autoplay
    muted
    loop
    playsinline
    disablepictureinpicture
    preload="auto"
    @canplay="tocar"
    @error="falhou = true"
  ></video>
  <img v-else-if="!falhou" :src="url(src)" :alt="alt" loading="lazy" @error="falhou = true" />
  <div v-else class="foto-vazia" role="img" :aria-label="alt">
    <span class="coracao">❤</span>
    <small>{{ src ? `public/${src}` : 'sem foto' }}</small>
  </div>
</template>

<style scoped>
img,
video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
video { pointer-events: none; }
.foto-vazia {
  width: 100%;
  height: 100%;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background:
    radial-gradient(circle at 50% 40%, #e11d2e33, transparent 65%),
    linear-gradient(160deg, #1a0a0d, #070707);
  color: #ffffff59;
  text-align: center;
  padding: 12px;
}
.coracao {
  font-size: 42px;
  color: var(--red);
  filter: drop-shadow(0 0 12px #e11d2e88);
  animation: bater 1.2s ease-in-out infinite;
}
small { font-size: 11px; word-break: break-all; }
@keyframes bater {
  0%, 100% { transform: scale(1); }
  15% { transform: scale(1.18); }
  30% { transform: scale(1); }
  45% { transform: scale(1.1); }
}
</style>
