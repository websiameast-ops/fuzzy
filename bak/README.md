# SE Connex — Customer Portal (v2 Preview)

A frontend prototype of the SE Connex customer portal for SiamEast Solutions PCL, built with React 18, TypeScript (strict), Vite, react-router-dom, and Recharts. All data is local mock data — there is no backend.

## Running the project

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default `http://localhost:5173`).

To produce a production build:

```bash
npm run build
npm run preview
```

## Demo login

- **Email:** `demo@seconnex.co.th`
- **Password:** `demo123`

After signing in you'll choose between two demo companies (Demo Industrial Co., Ltd. and Eastern Water Systems Co., Ltd.) — each has its own equipment, contracts, requests, and history. You can switch companies at any time from the top bar.

## What's included

- Full bilingual (English / Thai) interface with a persistent language toggle
- Dashboard, News & Offers, My Equipment, **My Sites — Map** (now with equipment search), **Live Monitoring (IoT)** (now with 3-phase smart-meter readings, pump process data, and optimization recommendations), **Factory Digital Twin**, Service History, Requests (with a full "report a problem" wizard and a **timeline-vs-plan comparison**), Contracts & MA, PM Schedule, Work Sign-off & Rating, Energy & Carbon (with sensor uncertainty + evidence-status panels), and Profile/Settings (including user management and notification preferences)
- QR-scan simulation, IoT/energy views on connected equipment, PM confirm/reschedule flows, e-signature capture, and a full 8-step sign-off + rating flow
- **My Sites — Map**: a schematic (non-geographic) view of your installations, colour-coded by live health, with a search box to find equipment by type, code, or location — matches jump straight to that site's panel. Clicking a pin opens a Site 360 summary via a `?site=` query param — shareable and back-button safe — with a link through to the full site detail page
- **Live Monitoring**: read-only telemetry for connected equipment, with device-type tabs and a per-device panel (`?device=` in the URL) that adapts to the equipment type — smart energy meters show per-phase voltage/current, active/reactive/apparent power, power factor and frequency; pumps show pressure, flow, temperature, ON/OFF status and running hours. Each device panel also includes a rule-based **"Recommendations to optimize operation"** list (e.g. low power factor → capacitor bank, high bearing temperature → lubrication check, phase imbalance → wiring check). Alarm details open in a deep-linkable modal (`?alarm=`) with a one-click "open a request about this" action
- **Factory Digital Twin**: a summary of the SE-supplied equipment powering the factory (solar, pumps, metering, monitoring), broken down by area/site and by product category, with equipment-level detail and a plain-language note about where metering and pump figures may overlap
- **Requests**: the ticket detail page now shows a **"Timeline vs. plan"** card — target first-response and completion dates computed from the request's priority, compared against actual progress (or, if still open, against today) with "ahead / on track / behind plan" badges. The requests list also gets a compact "vs. plan" column for quick scanning
- Cross-link loops wired throughout: asset → new request (pre-filled) · site → equipment at that site · alarm → open request · contract renewal → ticket · PM visit → service report · completed job → e-signature & rating
- Responsive layout: full sidebar navigation on desktop, collapsible overlay sidebar + bottom navigation with a "Report" FAB on mobile
- All interactive elements are wired to local state (via React Context) so actions like submitting a request, confirming a PM visit, or signing off a job persist for the rest of the session

### Scoping note

This build covers **Shell A (Customer Portal)** only. The IA document also describes **Shell B (Connected Ops console, `/ops`)** — an internal, staff-only console for SE Operators covering all customers. Per the document's own rule ("Shell B is a sibling shell, not a section — never draw it as a branch of `/portal`"), it's a separate application with a different audience and role gate, so it isn't part of this customer-facing build. It could be scaffolded as its own app reusing the same design tokens if needed.

## Theme & branding

- Primary color: SE Connex blue (`#145DA0`); accent color: orange (`#F2871F`), used for the mobile "Report" button, the notification badge, and other secondary highlights.
- The logo is a generated SVG lockup (blue ring + orange node, "SE Connex" wordmark) at `public/assets/se-connex-logo.svg`. Swap in the official brand file at the same path to override it automatically.

## Logo asset

No official SE Connex / SiamEast Solutions logo file was provided, so this build ships a generated blue/orange SVG lockup at `public/assets/se-connex-logo.svg` (visible in the sidebar and on the login screen). The app looks for a logo at, in order:

```
public/assets/se-connex-logo.svg
public/assets/se-connex-logo.png
```

Drop the official logo file into `public/assets/` (same filename) to override the generated one automatically — no code changes needed. If both files are ever removed, a clearly labelled placeholder ("SE Connex logo asset required") is shown instead of a fabricated logo.

## Notes

- This is a **prototype for demonstration purposes**. All companies, equipment, tickets, contracts, and energy/carbon figures are fictional demo data — this is also noted in the app footer.
- The "today" reference date used throughout the mock data and relative-time calculations is **14 July 2026**.
- Export/download buttons show a confirmation toast but do not produce real files, since there is no backend in this prototype.
