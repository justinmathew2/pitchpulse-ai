# PitchPulse AI ⚽
### FIFA World Cup 2026 Stadium Companion & Operations Hub

PitchPulse AI is a production-grade, Generative AI-enabled stadium operations and fan experience dashboard designed for the FIFA World Cup 2026. It leverages Google Gemini AI to improve crowd management, wayfinding, emergency response, transit coordination, sustainability incentives, and multilingual real-time operational decisions.

---

## 🚀 Deployed Links
* **Live Web App**: [https://deployfesthack.firebaseapp.com](https://deployfesthack.firebaseapp.com) (or [https://deployfesthack.web.app](https://deployfesthack.web.app))
* **Automated Unit Tests**: [https://deployfesthack.firebaseapp.com/test.html](https://deployfesthack.firebaseapp.com/test.html)

---

## 💡 Core Features

### 1. Fan Experience Hub
* **AI Stadium Buddy (Multilingual Chat)**: Text and voice-enabled conversational assistant (EN/ES/FR/DE/PT) powered by Google Gemini 1.5. Answers gate entries, transit options, food concessions, restrooms, and eco-actions. Uses the browser's Web Speech API for Speech-to-Text input and Text-to-Speech output.
* **Interactive SVG Map & Pathfinder**: Vector-based stadium visualizer with gates, seat blocks, first-aid, concessions, and eco-recycling points. Clicking nodes generates dynamic path overlays with walking directions, estimated times, and distance. Includes an **ADA Accessibility Override** routing fans via elevators and ramps.
* **Real-time Queue Estimator**: Live queue wait time bars for all entrances and concessions so fans can time their movements optimally.
* **Sustainability & Green Rewards**: Fans log eco-friendly actions (rail transit, PET bottle recycling, reusable flasks). The GenAI auditor verifies claims, tracks CO₂ savings, awards XP, and unlocks vouchers.

### 2. Real-time Services
* **Live Transit Board**: Real-time departure board for NJ Transit Rail (Gate A), Coach Bus 156 (Gate C), and Rideshare Lot G (Gate B). Features crowd-density badges, countdowns, and an AI Transit Advisor that recommends optimal departure times to avoid peak surges.
* **Emergency SOS**: A dedicated Emergency Dispatch system for fans and staff. Users describe the emergency type (Medical/Fire/Crowd), location, and details. Google Gemini generates a structured first-response protocol including: severity priority, dispatched unit, ETA, and step-by-step immediate actions. All SOS alerts are logged to the Operations Control Center incident log.

### 3. Operations & Staff Control Center
* **Operational Telemetry Charting**: Real-time canvas line charts displaying active gate flow rates, updated every 10 seconds (Chart.js).
* **GenAI Incident Commander**: Staff field reports are classified by severity (LOW/MODERATE/CRITICAL), categorised, and turned into tactical action plans with auto-drafted steward alerts.
* **Multilingual Alert Broadcaster**: Stadium announcements entered in English are auto-translated to Spanish and French and immediately pushed to all active display panels and the live ticker.

---

## 🛠️ Architecture & Tech Stack
* **Structure & UI**: HTML5 Semantic markup, Lucide Icons, Google Font Outfit.
* **Styling**: Vanilla CSS with glassmorphism, CSS custom properties (3 themes: Dark, Light, Neon), smooth micro-animations.
* **JavaScript**: Vanilla ES6+ wrapped in an **IIFE module pattern** with `'use strict'`, named `CONSTANTS`, JSDoc documentation, `sanitizeInput()`, and unified `handleError()`.
* **GenAI Integration**: Google Generative Language API (Gemini 1.5 Flash/Pro) with `AbortController` timeout, API key stored in `localStorage`, simulation fallback mode when no key is provided.
* **Charts**: Chart.js 4.x real-time line chart.
* **Speech**: Web Speech API (SpeechRecognition + SpeechSynthesis) for hands-free voice interaction.
* **Deployment**: Firebase Hosting with HTTP security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).

---

## 🔐 Security Measures
* All user input passed through `sanitizeInput()` — HTML entity escaping before DOM use.
* GenAI API key stored in `localStorage`, never sent to a third-party server.
* Firebase hosting serves with `Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.
* `Permissions-Policy` restricts camera access; microphone is self-origin only.
* All DOM mutations use textContent / safe DOM APIs — no `innerHTML` from user data.
* AbortController fetch timeout (30s) prevents hung API requests.

---

## ✅ Testing
6 automated test suites run in-browser at `/test.html`:
1. **Stadium Coordinates Verification** — Gate and POI coordinate accuracy
2. **Sustainability Audit Logic** — XP/CO₂ calculation, short-description rejection
3. **GenAI Incident Commander Classification** — Severity tagging by keyword
4. **Broadcaster Translation Module** — Spanish/French translation correctness
5. **Live Transit Board Data Integrity** — Schema validation, status checks, crowding enum
6. **Emergency SOS Protocol Generator** — Priority levels, dispatch units, action counts, broadcast length

---

## ♿ Accessibility
* Full keyboard navigation on all interactive SVG map nodes (Enter/Space activation).
* `aria-live="polite"` on Transit Board and `aria-live="assertive"` on Emergency SOS response panel.
* `aria-label` on all icon-only buttons.
* ADA accessibility route toggle re-routes navigation through elevators and ramps.
* Responsive layout with mobile-friendly stacked columns.
* 3 selectable themes (Dark/Light/Neon) for visual preference.

---

## 🌱 Problem Statement Alignment — FIFA World Cup 2026
| Challenge | PitchPulse AI Feature |
|---|---|
| Fan navigation | Interactive SVG Map + AI Pathfinder |
| Crowd management | Queue Wait Times + Telemetry Chart |
| Accessibility | ADA Route Toggle + Keyboard Nav + ARIA |
| Transportation | Live Transit Board + AI Transit Advisor |
| Sustainability | Green Rewards + Eco Audit AI |
| Multilingual | Chat Buddy (5 languages) + Broadcast Translator (EN/ES/FR) |
| Operational intelligence | GenAI Incident Commander + SOS Dispatch |
| Real-time decision support | Emergency SOS + Operations Control Center |

---

## 🧪 Running Locally
```bash
npm install -g firebase-tools
firebase login
firebase serve --only hosting
# Open http://localhost:5000
```

## 📦 Deploying
```bash
firebase deploy --only hosting
```
