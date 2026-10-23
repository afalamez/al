import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

const app = createApp(App)

// v-reveal: aparece suavemente ao entrar no ecrã
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }
  },
  { threshold: 0.15 },
)

app.directive('reveal', {
  mounted(el, binding) {
    el.classList.add('reveal')
    if (binding.value) el.style.transitionDelay = `${binding.value}ms`
    observer.observe(el)
  },
  unmounted(el) {
    observer.unobserve(el)
  },
})

app.mount('#app')
