# SE Connex v5 — Landing Page (React + Vite)

The exclusive operations platform for **SiamEast Solutions** customers.
Design direction: SE brand — deep navy + SE orange, modern product SaaS, with real
product screenshots in device mockups. Built to match the approved reference layout.

## Run it
```bash
npm install
npm run dev        # local dev server (http://localhost:5173)
npm run build      # production build → ./dist
npm run preview    # preview the production build
```
Deploy the contents of `./dist` to any static host (Nginx, S3/CloudFront, Netlify,
Vercel, or an existing web server). No backend required.

## The three things you'll most likely change
1. **Login URL (most important).** One constant near the top of `src/App.jsx`:
   ```js
   const LOGIN_URL = 'https://connex.siameastsolutions.com/login';
   ```
   Every "Sign In" / "Get Started" button uses it. Set the real portal address.
   (The placeholder domain is only a suggestion.)
2. **Corporate links.** The `SE` object in `src/App.jsx` holds every SiamEast
   Solutions link (About, Products, SE Shop, Investor Relations, Sustainability,
   Contact) plus the real social, phone and email — all verified against
   siameastsolutions.com.
3. **Brand tokens.** Colours, fonts and radii are CSS variables at the top of
   `src/styles.css` (`:root`):
   ```css
   --navy:#0a1a2e;  --panel:#0e2338;  --orange:#f2871f;  --orange-2:#ff9d3f;
   ```

## Structure
```
index.html            Loads Sora + Inter, mounts the app
src/main.jsx          React entry
src/App.jsx           The whole page (Nav, Hero, Security, Pillars, In-Action,
                      Impact, Exclusive, Explore, CTA, Footer) + icon set
src/styles.css        All styling (design tokens + sections, well commented)
public/assets/        Real product screenshots (device mockups + In-Action strip)
```

## Sections (top to bottom)
- **Hero** — headline, dual CTAs, four capability chips, laptop + phone mockups.
- **Security** — "Built for Security. Backed by SE."
- **One Platform** — Centralize · Collaborate · Track · Resolve.
- **See it in action** — three real portal screens (Digital Twin, Live Monitoring, Materials).
- **Impact** — 400 assets · 30% efficiency · Live Monitoring (NEW).
- **Exclusive** — for customers who purchase with SE.
- **Explore** — Asset Management · Issue Reporting · PM/CM · Service & Support.
- **CTA band** and **footer** with the SE corporate links.

## Notes
- **Fonts** load from Google Fonts in `index.html`; self-host if preferred.
- **Icons** are inline SVG (one stroke system) in `App.jsx` — no icon dependency.
- **Motion** is a gentle scroll-reveal; respects `prefers-reduced-motion`.
- **Images** use absolute paths (`/assets/...`). If you deploy under a sub-path,
  set `base` in `vite.config.js`.
- **Accessibility floor:** visible focus rings, alt text, reduced-motion, keyboard-navigable.
- The **EN·TH** experience and the login/demo destinations are the two things to wire
  to your real endpoints before go-live.

© 2026 SiamEast Solutions Public Company Limited · SET: SE
