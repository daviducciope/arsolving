import sharp from 'sharp'

const W = 1200
const H = 630

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0E1D34"/>
      <stop offset="100%" stop-color="#1A2B4A"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#C7A24A"/>
      <stop offset="100%" stop-color="#D4B464"/>
    </linearGradient>
    <radialGradient id="glow" cx="15%" cy="80%" r="50%">
      <stop offset="0%" stop-color="#C7A24A" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#0E1D34" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Grid overlay -->
  <g opacity="0.04" stroke="white" stroke-width="1">
    ${Array.from({length: 17}, (_, i) => `<line x1="${i*72}" y1="0" x2="${i*72}" y2="${H}"/>`).join('')}
    ${Array.from({length: 9}, (_, i) => `<line x1="0" y1="${i*72}" x2="${W}" y2="${i*72}"/>`).join('')}
  </g>

  <!-- Left gold accent bar -->
  <rect x="72" y="100" width="4" height="430" fill="url(#gold)" rx="2"/>

  <!-- AR in white -->
  <text x="110" y="310"
    font-family="'Liberation Sans', 'Roboto', Arial, sans-serif"
    font-weight="900"
    font-size="210"
    letter-spacing="-4"
    fill="white"
    opacity="1">AR</text>

  <!-- SOLVING in gold -->
  <text x="110" y="490"
    font-family="'Liberation Sans', 'Roboto', Arial, sans-serif"
    font-weight="900"
    font-size="210"
    letter-spacing="-4"
    fill="#C7A24A">SOLVING</text>

  <!-- Right side content -->
  <!-- Divider line -->
  <rect x="780" y="100" width="1" height="430" fill="white" opacity="0.12"/>

  <!-- Premium Multiservice label -->
  <text x="820" y="160"
    font-family="'Liberation Sans', 'Roboto', Arial, sans-serif"
    font-weight="700"
    font-size="13"
    letter-spacing="5"
    fill="#C7A24A"
    text-transform="uppercase">PREMIUM MULTISERVICE</text>

  <!-- Tagline -->
  <text x="820" y="240"
    font-family="'Liberation Sans', 'Roboto', Arial, sans-serif"
    font-weight="700"
    font-size="32"
    fill="white"
    opacity="0.95">Qualsiasi problema.</text>
  <text x="820" y="285"
    font-family="'Liberation Sans', 'Roboto', Arial, sans-serif"
    font-weight="700"
    font-size="32"
    fill="white"
    opacity="0.95">Noi lo risolviamo.</text>

  <!-- Description -->
  <text x="820" y="360"
    font-family="'Liberation Sans', 'Roboto', Arial, sans-serif"
    font-weight="400"
    font-size="17"
    fill="white"
    opacity="0.55">Operativo, digitale, strategico.</text>
  <text x="820" y="385"
    font-family="'Liberation Sans', 'Roboto', Arial, sans-serif"
    font-weight="400"
    font-size="17"
    fill="white"
    opacity="0.55">Un solo interlocutore.</text>

  <!-- Gold arrow -->
  <g transform="translate(820, 450)">
    <circle cx="20" cy="20" r="20" fill="none" stroke="#C7A24A" stroke-width="1.5" opacity="0.7"/>
    <line x1="10" y1="20" x2="30" y2="20" stroke="#C7A24A" stroke-width="1.5" stroke-linecap="round"/>
    <polyline points="23,13 30,20 23,27" fill="none" stroke="#C7A24A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- URL bottom -->
  <text x="820" y="520"
    font-family="'Liberation Sans', 'Roboto', Arial, sans-serif"
    font-weight="400"
    font-size="15"
    fill="white"
    opacity="0.35">arsolving.it</text>

  <!-- Bottom gold line -->
  <rect x="0" y="${H - 4}" width="${W}" height="4" fill="url(#gold)"/>
</svg>
`

await sharp(Buffer.from(svg))
  .png()
  .toFile('public/og-image.png')

console.log('og-image.png generata con successo in public/')
