# ARSOLVING — Brief per esperto UX/UI/FE
> Analisi dello stato attuale del sito. Documento di lavoro per orientare il prossimo ciclo di design e sviluppo.

---

## 1. Stack tecnico

| Layer | Tecnologia |
|---|---|
| Framework | **Astro 4** (SSG, zero JS client-side di default) |
| CSS | **Tailwind CSS v4** (con tema custom inline via `@theme`) |
| Font | **Cormorant Garamond** (heading, serif) + **Inter** (body, sans) |
| Animazioni | CSS puro: `@keyframes` + Intersection Observer per reveal-on-scroll |
| JS | Vanilla: `nav.js` (scroll navbar) + `reveal.js` (IntersectionObserver) |
| Build | Vite 8 |
| Deploy | AWS S3 + CloudFront (CDN, no SSR) |

Nessuna dipendenza UI esterna (no Bootstrap, no component library). Tutto custom.

---

## 2. Pagine esistenti

### `/` — Home
- Hero fullscreen dark navy con griglia dorata in overlay e radial gradient
- Logo rotante (float) + headline tipografica con split AR / SOLVING
- 2 CTA: "Scopri il gruppo" (solid gold) + "Contattaci" (outline)
- Sezione "Chi siamo breve" 2-col (testo + paragrafi)
- Probabilmente altre sezioni sotto (preview parziale): divisioni, servizi in anteprima

### `/il-gruppo/` — Il Gruppo
- Page hero dark con breadcrumb stilizzata
- Sezione Visione (2-col: testo long-form + blockquote + 4 value card)
- Sezione Posizionamento (3 card numerate 01/02/03 su bg cream)
- Sezione Brand Identity (logo animato con pulse ring + testo colori)
- CTA finale white

### `/services/` — Arsolving Services
*Divisione operativa: edifici, facility management, pulizie, verde*
- Page hero
- Intro 2-col approccio
- Grid 3-col dei 6 servizi (card con hover top-bar gradient + icon swap)
- Sezione "Il vantaggio" dark navy con lista bullet animata
- CTA

**Servizi presenti:** Edifici & Condomini · Isole Ecologiche · Pulizie Professionali · Gestione Aree Verdi · Manutenzione Ordinaria · Facility Management

### `/digital/` — Arsolving Digital
*Divisione comunicazione, branding, web, app, marketing*
- Page hero
- Intro 2-col approccio
- Grid 3-col dei 6 servizi (stessa card pattern, hover bar invertita gold→navy)
- Sezione **Portfolio** con 6 case study (card con immagine h-52 + tags + link esterno)
- CTA

**Servizi presenti:** Branding & Identità · Comunicazione Strategica · Graphic Design · Web & Siti · Applicazioni Web · Marketing Digitale

**Portfolio presente:** AgriPlanet Store · Girofacile · Sostanza Servizi · Hurka · De Marco Studio Legale · Vignaluna

### `/projects/` — Projects & Ventures
*Sviluppo iniziative, partnership strategiche*
- Page hero
- Sezione posizione 2-col (testo + quote card con bullet)
- Grid 2-col "Aree di sviluppo" (4 card con left-border gradient)
- Sezione CTA dark navy "Hai un'idea o una proposta?"

### `/contatti/` — Contatti
- Page hero
- Layout 2/5 + 3/5: colonna sinistra info (email, tel, sede) + 2 percorsi (servizi / partnership); colonna destra form
- Form: radio tipo richiesta · nome/azienda · email · select area · textarea · submit
- Form gestito lato client (nessun backend evidente nei file letti)

---

## 3. Design system attuale

### Palette
```
Navy dark   #141E38   → sfondi hero, navbar, footer
Navy        #1D2D50   → testi principali, elementi strutturali
Navy light  #253660   → accent secondario
Gold        #B5973A   → accento premium, CTA, decoratori
Gold light  #C9AC52   → hover gold
Gold pale   #F0E6C8   → bg input checked, accenti light
Cream       #F7F7F5   → bg sezioni alternate
White       #FFFFFF   → sezioni principali di contenuto
```

### Tipografia
- **Heading:** Cormorant Garamond — usato per titoli h1/h2, blockquote, tagline
- **Body:** Inter — testo corrente, label, nav, form
- Dimensioni sempre in `clamp()` → fluid typography già impostata
- Tracking molto marcato sulle label uppercase (`tracking-[0.24em]` e simili)
- Peso heading usato anche per decorativi (numeri 01/02/03 in `text-gray-100`)

### Pattern di layout ricorrenti
1. **Page hero** — full-width dark, breadcrumb gold + h1 + sub
2. **2-col intro** — reveal left (heading) + reveal right (body copy)
3. **Feature grid** — 3-col cards su bg cream con hover top-bar animated
4. **Dark section** — navy-dark con radial gradient, contenuto centered o 2-col
5. **CTA finale** — white centered, heading + sub + single button gold
6. **Navbar** — fixed, transparent → blur/solid on scroll (gestita da `nav.js`)
7. **Footer** — 4-col: brand + tagline · navigazione · contatti · brand Sostanza

### Micro-interazioni
- `reveal` on scroll (IntersectionObserver, translate-y + fade, stagger delay-1→5)
- Hover card: `hover:-translate-y-0.5` + `hover:shadow-md/lg`
- Hover top-bar gradient: `scale-x-0 → scale-x-100 origin-left`
- Icon swap: `bg-navy text-gold → bg-gold text-navy-dark` on group-hover
- Navbar: trasparente → `bg-navy-dark/90 backdrop-blur` allo scroll
- Float animation sul logo hero
- Pulse ring sul logo di brand identity

---

## 4. Punti di forza

- **Identità visiva coerente** — palette ristretta, applicata con disciplina su tutte le pagine
- **Tipografia di carattere** — il contrasto Cormorant/Inter funziona per il posizionamento premium
- **Pattern replicato con consistenza** — le 6 pagine condividono la stessa grammatica visiva
- **Performance** — Astro SSG, zero JS framework overhead, CSS Tailwind purgato
- **Mobile** — hamburger menu implementato, layout responsive con `clamp()` fluid

---

## 5. Criticità / aree di lavoro

### UX & Contenuto
- **Telefono placeholder** (`+39 000 000 0000`) ancora mock — va compilato o rimosso
- **Sede generica** ("Italia") — se il presidio è territoriale, è utile essere più precisi
- **Form contatti senza backend** — nessun endpoint visibile; il form non invia nulla allo stato attuale
- **Portfolio immagini esterne** — le thumbnail del portfolio Digital puntano a `stacomunicazionedesign.it`, dipendenza fragile
- **Girofacile** nel portfolio è senza immagine e senza link — sezione incompleta
- **Home incompleta** — la pagina `/` ha solo hero + chi siamo breve; probabilmente mancano le sezioni divisioni/servizi/portfolio preview

### UI & Visual
- **Logo.jpeg** come favicon — qualità e formato non ottimali per favicon (meglio SVG o PNG square ottimizzato)
- **Nessuna pagina di errore 404** custom
- **Open Graph / Social preview** — `og:image` non configurato nel layout Base
- **Animazioni reveal** — `opacity: 0` di partenza può causare FOUC se JS non carica; manca `noscript` fallback

### FE & Architettura
- **Form handling** — da implementare (Formspree, EmailJS, Lambda, ecc.)
- **i18n** — solo italiano; nessuna struttura per eventuale versione EN
- **Analytics** — nessuno script di tracking visibile
- **Accessibilità** — `aria-expanded` sul hamburger presente ✓; verificare focus management mobile menu, contrasto testo `text-white/22` e `text-white/48` (potrebbero non passare WCAG AA)

---

## 6. Direzione consigliata per il prossimo ciclo

In ordine di priorità/impatto:

1. **Completare la Home** — aggiungere sezione divisioni (Services / Digital / Projects) e preview portfolio o social proof
2. **Attivare il form** — scegliere un provider serverless e collegarlo
3. **Compilare i dati reali** — telefono, sede specifica, portfolio Girofacile
4. **Self-hosting immagini portfolio** — spostare le thumbnail in `/public/portfolio/`
5. **SEO base** — aggiungere `og:image`, `og:type`, Twitter card nel layout Base
6. **404 page** — creare `src/pages/404.astro` con navigazione di recupero
7. **Favicon** — generare set SVG + PNG (32/192/512) da logo
8. **Accessibilità** — audit contrasti sezioni dark con testo `text-white/25`-`text-white/48`
9. **Analytics** — decidere provider (Plausible, GA4, Fathom) e aggiungere al layout

---

## 7. Note sul posizionamento (per coerenza copy/design)

Il brand si posiziona come **Premium Multiservice Group** — non un'agenzia, non un'impresa generalista. La comunicazione attuale rispecchia questo (tono istituzionale, font classico, palette sobria). Le evoluzioni UI devono restare in questo perimetro: **no carousels rumorosi, no illustrazioni flat, no gradient sgargianti**. Il lusso qui è nell'essenzialità.

Il payoff ufficiale è **"Global Vision / Arsolv' Mindset"** — compare nel footer ma non è sfruttato nel resto della comunicazione visiva.
