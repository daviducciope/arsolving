import './style.css'

/* ── Navbar scroll ── */
const nav = document.getElementById('navbar')
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    nav.style.background = '#141e38'
    nav.style.boxShadow = '0 2px 24px rgba(0,0,0,0.3)'
  } else {
    nav.style.background = 'transparent'
    nav.style.boxShadow = 'none'
  }
})

/* ── Mobile hamburger ── */
const hamburger = document.getElementById('hamburger')
const mobileMenu = document.getElementById('mobile-menu')
hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('hidden')
})
mobileMenu.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => mobileMenu.classList.add('hidden'))
)

/* ── Reveal on scroll ── */
const io = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) }
  }),
  { threshold: 0.1 }
)
document.querySelectorAll('.reveal').forEach(el => io.observe(el))

/* ── Animated counters ── */
function animateCounter(el) {
  const target = parseFloat(el.dataset.target)
  const suffix = el.dataset.suffix || ''
  const duration = 1800
  const start = performance.now()
  const isFloat = target % 1 !== 0
  const update = (now) => {
    const p = Math.min((now - start) / duration, 1)
    const ease = 1 - Math.pow(1 - p, 3)
    el.textContent = (isFloat ? (target * ease).toFixed(1) : Math.floor(target * ease)) + suffix
    if (p < 1) requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
}

const counterObs = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) { animateCounter(e.target); counterObs.unobserve(e.target) }
  }),
  { threshold: 0.5 }
)
document.querySelectorAll('[data-target]').forEach(el => counterObs.observe(el))

/* ── Contact form ── */
document.getElementById('contact-form').addEventListener('submit', e => {
  e.preventDefault()
  const btn = e.target.querySelector('button[type=submit]')
  const orig = btn.textContent
  btn.textContent = 'Messaggio inviato ✓'
  btn.disabled = true
  btn.style.background = '#16a34a'
  setTimeout(() => {
    btn.textContent = orig
    btn.disabled = false
    btn.style.background = ''
    e.target.reset()
  }, 3500)
})
