<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import config from './config.js'
import HeartCanvas from './components/HeartCanvas.vue'
import Foto from './components/Foto.vue'
import Celebracao from './components/Celebracao.vue'

// navbar
const scrolled = ref(false)
const onScroll = () => (scrolled.value = window.scrollY > 40)
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

// galeria
const aberta = ref(null)

// carta
const paragrafos = computed(() => config.carta.split(/\n\s*\n|\n/).filter((l) => l.trim()))

// cadeado: 'fechado' → 'chave' → 'aberto'
const cadeado = ref('fechado')
const chaveInput = ref(null)
const tentativa = ref('')
const erroChave = ref(false)
const tremer = ref(false)
const normalizar = (t) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

async function pedirChave() {
  cadeado.value = 'chave'
  await nextTick()
  chaveInput.value?.focus()
}

function abrir() {
  if (normalizar(tentativa.value) === normalizar(config.chave)) {
    erroChave.value = false
    cadeado.value = 'abrindo'
    setTimeout(() => (cadeado.value = 'aberto'), 700)
  } else {
    erroChave.value = true
    tremer.value = false
    requestAnimationFrame(() => (tremer.value = true))
  }
}

// música: tem de começar dentro do clique, senão o telemóvel bloqueia
let musica
function disseSim() {
  aceitou.value = true
  if (!config.musica) return
  const inicio = config.musicaInicio || 0
  if (!musica) {
    musica = new Audio(`${import.meta.env.BASE_URL}${config.musica}#t=${inicio}`)
    // repete a partir do mesmo ponto, não do 0
    musica.addEventListener('ended', () => {
      musica.currentTime = inicio
      musica.play().catch(() => {})
    })
    musica.addEventListener('loadedmetadata', () => {
      if (musica.currentTime < inicio) musica.currentTime = inicio
    })
  }
  musica.play().catch(() => {})
}

// pergunta
const area = ref(null)
const naoBtn = ref(null)
const tentativas = ref(0)
const naoPos = ref(null)
const aceitou = ref(false)

const textoNao = computed(() => config.respostasNao[Math.min(tentativas.value, config.respostasNao.length - 1)])
const escalaSim = computed(() => 1 + Math.min(tentativas.value, 8) * 0.12)

function fugir() {
  const box = area.value.getBoundingClientRect()
  const btn = naoBtn.value.getBoundingClientRect()
  const maxX = Math.max(0, box.width - btn.width)
  const maxY = Math.max(0, box.height - btn.height)
  let x, y
  // evita cair no mesmo sítio
  do {
    x = Math.random() * maxX
    y = Math.random() * maxY
  } while (naoPos.value && Math.hypot(x - naoPos.value.x, y - naoPos.value.y) < 80 && maxX > 120)
  naoPos.value = { x, y }
  tentativas.value++
}
</script>

<template>
  <header class="navbar" :class="{ scrolled }">
    <nav>
      <a href="#inicio" class="brand"><span class="gradient-text">{{ config.iniciais }}</span></a>
      <ul>
        <li><a href="#historia">Nós</a></li>
        <li><a href="#galeria">Fotos</a></li>
        <li><a href="#carta">Carta</a></li>
        <li><a href="#pergunta" class="destaque">❤</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <!-- HERO -->
    <section id="inicio" class="hero">
      <HeartCanvas :text="config.iniciais" />
      <div class="hero-overlay"></div>
      <div class="hero-inner">
        <span class="script hero-etiqueta">{{ config.hero.etiqueta }}</span>
        <h1 v-if="config.hero.titulo">{{ config.hero.titulo }}</h1>
        <p class="hero-sub">{{ config.hero.subtitulo }}</p>
        <div class="hero-acoes">
          <a href="#historia" class="btn btn-primary">Começar ↓</a>
        </div>
      </div>
      <div class="scroll-hint" aria-hidden="true"><span></span></div>
    </section>

    <!-- NOSSA HISTÓRIA -->
    <section id="historia" class="section">
      <div class="section-head" v-reveal>
        <span class="script">a nossa</span>
        <h2>História</h2>
      </div>
      <ol class="timeline">
        <li v-for="(m, i) in config.historia" :key="i" class="momento" :class="{ invertido: i % 2 }" v-reveal>
          <div class="momento-foto"><Foto :src="m.foto" :alt="m.titulo" /></div>
          <div class="momento-texto">
            <span class="data">{{ m.data }}</span>
            <h3>{{ m.titulo }}</h3>
            <p>{{ m.texto }}</p>
          </div>
        </li>
      </ol>
    </section>

    <!-- GALERIA -->
    <section id="galeria" class="section">
      <div class="section-head" v-reveal>
        <span class="script">momentos</span>
        <h2>Contigo</h2>
      </div>
      <div class="galeria">
        <button
          v-for="(g, i) in config.galeria"
          :key="i"
          type="button"
          class="polaroid"
          :style="{ '--rot': `${(i % 3) * 2.5 - 2.5}deg`, '--d': `${(i % 3) * 180}ms`, '--flut': `${i * 0.7}s` }"
          v-reveal
          @click="aberta = g"
        >
          <div class="polaroid-foto"><Foto :src="g.foto" :alt="g.legenda" /></div>
          <span class="script">{{ g.legenda }}</span>
        </button>
      </div>
    </section>

    <!-- CARTA -->
    <section id="carta" class="section">
      <div class="carta" v-reveal>
        <span class="selo" aria-hidden="true">❤</span>
        <p v-for="(p, i) in paragrafos" :key="i">{{ p }}</p>
        <p class="assinatura script">— {{ config.nomeDele }}</p>
      </div>
    </section>

    <!-- PERGUNTA -->
    <section id="pergunta" class="section pergunta">
      <!-- cadeado -->
      <div v-if="cadeado !== 'aberto'" class="cofre" v-reveal>
        <span class="script">{{ config.nomeDela }},</span>
        <button v-if="cadeado === 'fechado'" type="button" class="btn btn-primary abrir" @click="pedirChave">
          {{ config.botaoAbrir }}
        </button>
        <form v-else class="chave" :class="{ abrindo: cadeado === 'abrindo' }" @submit.prevent="abrir">
          <label for="chave">{{ config.pedidoChave }}</label>
          <div class="chave-linha" :class="{ erro: tremer }" @animationend="tremer = false">
            <input
              id="chave"
              ref="chaveInput"
              v-model="tentativa"
              type="text"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              placeholder="••••••"
            />
            <button type="submit" class="btn btn-primary btn-cadeado" aria-label="Abrir cadeado">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path class="arco" d="M7 11V7a5 5 0 0 1 10 0v4" />
                <rect x="4" y="11" width="16" height="10" rx="2.5" fill="currentColor" fill-opacity=".18" />
                <circle cx="12" cy="16" r="1.4" fill="currentColor" stroke="none" />
              </svg>
            </button>
          </div>
          <p class="msg-erro" aria-live="polite">{{ erroChave ? config.chaveErrada : '' }}</p>
        </form>
      </div>

      <template v-else>
      <div class="section-head revelar">
        <span class="script">{{ config.nomeDela }},</span>
        <h2 class="pergunta-titulo">{{ config.pergunta }}</h2>
      </div>
      <div ref="area" class="pergunta-area revelar">
        <button
          type="button"
          class="btn btn-primary sim"
          :style="{ transform: `scale(${escalaSim})` }"
          @click="disseSim"
        >
          {{ config.botaoSim }}
        </button>
        <button
          ref="naoBtn"
          type="button"
          class="btn btn-ghost nao"
          :class="{ solto: naoPos }"
          :style="naoPos ? { left: naoPos.x + 'px', top: naoPos.y + 'px' } : null"
          @mouseenter="fugir"
          @click.prevent="fugir"
        >
          {{ textoNao }}
        </button>
      </div>
      </template>
    </section>
  </main>

  <footer class="rodape">
    Feito com <span class="gradient-text">❤</span> por {{ config.nomeDele }}, só para ti.
    <small v-if="config.creditoMusica" class="credito">{{ config.creditoMusica }}</small>
  </footer>

  <!-- lightbox -->
  <Transition name="fade">
    <div v-if="aberta" class="lightbox" @click="aberta = null">
      <figure @click.stop>
        <Foto :src="aberta.foto" :alt="aberta.legenda" />
        <figcaption class="script">{{ aberta.legenda }}</figcaption>
      </figure>
      <button class="fechar" type="button" aria-label="Fechar" @click="aberta = null">×</button>
    </div>
  </Transition>

  <Celebracao v-if="aceitou" @fechar="aceitou = false" />
</template>

<style scoped>
/* NAVBAR */
.navbar {
  position: fixed;
  inset: 0 0 auto;
  z-index: 20;
  border-bottom: 1px solid transparent;
  transition: background 0.3s, border-color 0.3s;
}
.navbar.scrolled {
  background: #050505cc;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom-color: var(--border);
}
.navbar nav {
  max-width: 1120px;
  margin: 0 auto;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.brand { font: 700 20px var(--serif); text-decoration: none; white-space: nowrap; }
.navbar ul { display: flex; gap: clamp(14px, 3vw, 28px); list-style: none; margin: 0; padding: 0; }
.navbar ul a { color: var(--text); text-decoration: none; font-size: 15px; transition: color 0.2s; }
.navbar ul a:hover { color: var(--text-h); }
.navbar .destaque { color: var(--red-2); }

/* HERO */
.hero {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 96px 16px clamp(72px, 10vh, 110px);
  overflow: hidden;
  background: radial-gradient(ellipse at 50% 40%, #1a0508 0%, #050505 65%);
  cursor: crosshair;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: linear-gradient(to bottom, transparent 55%, #050505d9 78%, var(--bg) 100%);
}
.hero-inner {
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  animation: subir 1s 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.hero-etiqueta { font-size: clamp(28px, 4vw, 38px); line-height: 1; }
.hero h1 { font-size: clamp(30px, 5.4vw, 56px); line-height: 1.08; letter-spacing: -0.02em; }
.hero-sub { max-width: 480px; font-style: italic; }
.hero-acoes { margin-top: 12px; }
.scroll-hint {
  position: absolute;
  bottom: 22px;
  left: 50%;
  translate: -50% 0;
  width: 22px;
  height: 36px;
  border: 1.5px solid #ffffff40;
  border-radius: 12px;
}
.scroll-hint span {
  position: absolute;
  left: 50%;
  top: 6px;
  width: 3px;
  height: 7px;
  margin-left: -1.5px;
  border-radius: 2px;
  background: var(--red);
  animation: desce 1.6s infinite;
}

/* TIMELINE */
.timeline { list-style: none; margin: 0; padding: 0; position: relative; display: grid; gap: clamp(48px, 8vw, 96px); }
.timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(var(--red-border), transparent);
}
.momento { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(28px, 6vw, 72px); align-items: center; position: relative; }
.momento::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  translate: -50% -50%;
  border-radius: 50%;
  background: var(--red);
  box-shadow: 0 0 0 6px #e11d2e2a, 0 0 20px var(--red);
}
.momento.invertido .momento-foto { order: 2; }
.momento-foto {
  aspect-ratio: 4 / 5;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.momento-foto :deep(img),
.momento-foto :deep(video) { transition: transform 0.8s; }
.momento:hover .momento-foto :deep(img),
.momento:hover .momento-foto :deep(video) { transform: scale(1.04); }
.momento-texto {
  border-left: 2px solid var(--red-border);
  padding-left: 18px;
  transform-origin: left center;
  transition: transform 0.8s, border-color 0.8s;
}
.momento:hover .momento-texto { transform: scale(1.04); border-left-color: var(--red); }

/* entrada ao descer: o texto entra de lado, linha a linha */
.momento.reveal .momento-texto > * {
  opacity: 0;
  transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}
.momento.reveal .momento-texto > * { transform: translateX(40px); }
.momento.reveal.invertido .momento-texto > * { transform: translateX(-40px); }
.momento.reveal .momento-texto > :nth-child(1) { transition-delay: 0.25s; }
.momento.reveal .momento-texto > :nth-child(2) { transition-delay: 0.4s; }
.momento.reveal .momento-texto > :nth-child(3) { transition-delay: 0.55s; }
.momento.reveal.is-visible .momento-texto > * { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .momento.reveal .momento-texto > * { opacity: 1; transform: none; transition: none; }
  .polaroid.reveal,
  .polaroid.reveal .script,
  .polaroid.reveal .polaroid-foto :deep(img) { opacity: 1; transform: none; filter: none; clip-path: none; animation: none; transition: none; }
}
.data { display: block; color: var(--red-2); font-size: 13px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
.momento-texto h3 { font-size: clamp(24px, 3vw, 32px); margin: 6px 0 10px; }

/* GALERIA */
.galeria { --gap: clamp(16px, 3vw, 32px); display: flex; flex-wrap: wrap; justify-content: center; gap: var(--gap); }
.galeria .polaroid { width: calc((100% - 2 * var(--gap)) / 3); }
.polaroid {
  background: #f4efef;
  border: 0;
  padding: 10px 10px 4px;
  border-radius: 4px;
  cursor: zoom-in;
  rotate: var(--rot);
  box-shadow: 0 18px 40px -14px #000, 0 0 0 1px #0000000d;
  transition: rotate 0.4s, scale 0.4s, box-shadow 0.4s;
}
.polaroid:hover { rotate: 0deg; scale: 1.06; box-shadow: 0 30px 70px -14px #e11d2e88; z-index: 1; }
.polaroid-foto { position: relative; aspect-ratio: 1; overflow: hidden; background: #000; }
.polaroid .script { display: block; color: #8b0a17; font-size: 26px; line-height: 1.6; }

/* 1. a polaroid cai na mesa a rodar */
.polaroid.reveal {
  opacity: 0;
  transform: translateY(-90px) rotate(calc(var(--rot) * -5)) scale(1.12);
  transition:
    opacity 0.5s ease var(--d),
    transform 1.1s cubic-bezier(0.34, 1.45, 0.64, 1) var(--d),
    rotate 0.4s, scale 0.4s, box-shadow 0.4s;
}
.polaroid.reveal.is-visible { opacity: 1; transform: none; animation: flutuar 6s ease-in-out var(--flut) infinite; }

/* 2. a foto "revela" como uma polaroid verdadeira */
.polaroid.reveal .polaroid-foto :deep(img),
.polaroid.reveal .polaroid-foto :deep(video) {
  filter: sepia(1) brightness(1.9) contrast(0.5) blur(6px);
  transform: scale(1.08);
  transition: filter 2.4s ease calc(var(--d) + 0.5s), transform 2.4s ease calc(var(--d) + 0.5s);
}
.polaroid.reveal.is-visible .polaroid-foto :deep(img),
.polaroid.reveal.is-visible .polaroid-foto :deep(video) { filter: none; transform: none; }

/* 3. a legenda escreve-se da esquerda para a direita */
.polaroid.reveal .script {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 1.3s cubic-bezier(0.65, 0, 0.35, 1) calc(var(--d) + 1.4s);
}
.polaroid.reveal.is-visible .script { clip-path: inset(0 0 0 0); }

/* brilho que passa por cima ao passar o rato */
.polaroid-foto::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 30%, #ffffff55 50%, transparent 70%);
  translate: -120% 0;
  transition: translate 0.9s ease;
  pointer-events: none;
}
.polaroid:hover .polaroid-foto::after { translate: 120% 0; }

@keyframes flutuar {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -6px; }
}

/* CARTA */
.carta {
  position: relative;
  max-width: 680px;
  margin: 0 auto;
  padding: clamp(36px, 6vw, 64px) clamp(24px, 6vw, 64px);
  border-radius: 24px;
  background: linear-gradient(160deg, #160709, #0b0b0b);
  border: 1px solid var(--red-border);
  box-shadow: 0 30px 80px -30px #e11d2e55;
  color: var(--text-h);
  font-family: var(--serif);
  font-style: italic;
  font-size: clamp(17px, 2vw, 20px);
  line-height: 1.75;
  display: grid;
  gap: 16px;
}
.selo {
  position: absolute;
  top: -26px;
  left: 50%;
  translate: -50% 0;
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--gradient);
  color: #fff;
  font-size: 22px;
  font-style: normal;
  box-shadow: 0 0 30px #e11d2e99;
}
.assinatura { text-align: right; font-size: 34px; font-style: normal; }

/* PERGUNTA */
#carta { padding-bottom: 0; }
.pergunta { text-align: center; display: flex; flex-direction: column; justify-content: center; padding-top: clamp(48px, 7vw, 72px); }
.pergunta-titulo { font-size: clamp(36px, 7vw, 72px); line-height: 1.05; }
.pergunta-area {
  position: relative;
  height: 260px;
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}
.sim { font-size: 20px; padding: 16px 40px; transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s; animation: brilho 1.6s infinite; }
.nao { transition: left 0.3s ease, top 0.3s ease; white-space: nowrap; }
.nao.solto { position: absolute; }

/* CADEADO */
.cofre { display: flex; flex-direction: column; align-items: center; gap: 20px; }
.cofre .script { font-size: clamp(34px, 6vw, 52px); line-height: 1; }
.abrir { font-size: 20px; padding: 18px 44px; animation: brilho 1.6s infinite; }
.chave { width: min(100%, 420px); display: grid; gap: 14px; animation: subir 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
.chave label { color: var(--text-h); font-family: var(--serif); font-size: 20px; }
.chave-linha {
  display: flex;
  gap: 8px;
  padding: 6px;
  border-radius: 999px;
  border: 1px solid var(--red-border);
  background: #ffffff08;
  transition: border-color 0.3s, box-shadow 0.3s;
}
.chave-linha:focus-within { border-color: var(--red); box-shadow: 0 0 0 4px #e11d2e2a; }
.chave-linha.erro { animation: tremer 0.45s; border-color: var(--red-2); }
.chave-linha input {
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
  color: var(--text-h);
  font: 500 18px var(--sans);
  padding: 0 16px;
  letter-spacing: 0.08em;
}
.btn-cadeado { padding: 12px 18px; }
.btn-cadeado .arco { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); transform-origin: 17px 11px; }
.chave.abrindo .btn-cadeado .arco { transform: translate(5px, -3px) rotate(28deg); }
.chave.abrindo { animation: sumir 0.7s 0.25s ease both; }
.msg-erro { min-height: 1.6em; color: var(--red-2); font-size: 15px; }
.revelar { animation: subir 0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }
.pergunta-area.revelar { animation-delay: 0.25s; }

/* RODAPÉ */
.rodape { text-align: center; padding: 40px 16px 56px; font-size: 14px; border-top: 1px solid var(--border); }
.credito { display: block; margin-top: 8px; font-size: 11px; opacity: 0.5; }

/* LIGHTBOX */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: #000000e6;
  display: grid;
  place-items: center;
  padding: 16px;
  cursor: zoom-out;
}
.lightbox figure { margin: 0; width: min(90vw, 560px); cursor: default; animation: abrirFoto 0.6s cubic-bezier(0.34, 1.4, 0.64, 1) both; }
@keyframes abrirFoto { from { opacity: 0; transform: scale(0.8) rotate(-4deg); } }
.lightbox figure :deep(img),
.lightbox figure :deep(.foto-vazia) { border-radius: 12px; max-height: 78vh; aspect-ratio: auto; }
.lightbox figcaption { text-align: center; font-size: 34px; margin-top: 10px; }
.fechar {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: #ffffff10;
  color: #fff;
  font-size: 26px;
  cursor: pointer;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes subir { from { opacity: 0; transform: translateY(30px); } }
@keyframes desce { 0% { opacity: 0; transform: translateY(0); } 40% { opacity: 1; } 100% { opacity: 0; transform: translateY(12px); } }
@keyframes tremer { 20%, 60% { transform: translateX(-8px); } 40%, 80% { transform: translateX(8px); } }
@keyframes sumir { to { opacity: 0; transform: scale(0.9); } }
@keyframes brilho { 0%, 100% { box-shadow: 0 10px 30px -8px #e11d2eaa; } 50% { box-shadow: 0 10px 50px 0 #e11d2eee; } }

/* TELEMÓVEL */
@media (max-width: 760px) {
  .timeline::before, .momento::after { left: 12px; }
  .momento { grid-template-columns: 1fr; padding-left: 36px; gap: 20px; }
  .momento.invertido .momento-foto { order: 0; }
  .galeria .polaroid { width: calc((100% - var(--gap)) / 2); }
  .pergunta-area { height: 320px; flex-direction: column; }
}
@media (max-width: 420px) {
  .navbar ul { gap: 12px; }
  .navbar ul li:not(:last-child) { display: none; }
}
</style>
