// Navbar scroll behaviour
const nav = document.getElementById('navbar')
if (nav) {
  const onScroll = () => {
    if (window.scrollY > 48) {
      nav.style.background = '#141e38'
      nav.style.boxShadow = '0 2px 24px rgba(0,0,0,0.28)'
    } else {
      nav.style.background = 'transparent'
      nav.style.boxShadow = 'none'
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
}

// Mobile menu
const hamburger = document.getElementById('hamburger')
const mobileMenu = document.getElementById('mobile-menu')
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('hidden')
    hamburger.setAttribute('aria-expanded', String(!open))
  })
  mobileMenu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => mobileMenu.classList.add('hidden'))
  )
}
