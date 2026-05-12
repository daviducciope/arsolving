// Navbar scroll behaviour — class-based
const nav = document.getElementById('navbar')
if (nav) {
  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 40)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
}

// Mobile menu
const hamburger = document.getElementById('hamburger')
const mobileMenu = document.getElementById('mobile-menu')
if (hamburger && mobileMenu) {
  const toggle = (force) => {
    const open = force !== undefined ? force : mobileMenu.classList.contains('hidden')
    mobileMenu.classList.toggle('hidden', !open)
    hamburger.setAttribute('aria-expanded', String(open))
    hamburger.classList.toggle('menu-open', open)
    document.body.style.overflow = open ? 'hidden' : ''
  }

  hamburger.addEventListener('click', () => toggle())

  mobileMenu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => toggle(false))
  )

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') toggle(false)
  })

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) toggle(false)
  })
}
