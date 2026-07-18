# PitchPulse AI ⚽
### FIFA World Cup 2026 Stadium Companion & Operations Hub

PitchPulse AI is a Generative AI-enabled stadium operation and fan experience dashboard designed for the FIFA World Cup 2026. The solution leverages AI to improve crowd flow management, stadium navigation, sustainability incentives, and real-time operational decisions for stadium staff.

---

## 🚀 Deployed Links
* **Live Web App**: [https://deployfesthack.firebaseapp.com](https://deployfesthack.firebaseapp.com) (or [https://deployfesthack.web.app](https://deployfesthack.web.app))
* **Automated Unit Tests**: [https://deployfesthack.firebaseapp.com/test.html](https://deployfesthack.firebaseapp.com/test.html)

---

## 💡 Core Features

### 1. Fan Experience Hub
* **AI Stadium Buddy (Multilingual Chat)**: A text and voice-enabled conversational assistant that answers fan queries on gate entries, nearby food concessions, restrooms, and transportation. Uses the browser's Web Speech API for **Speech-to-Text** input and **Text-to-Speech** output.
* **Interactive SVG Map & Pathfinder**: A vector-based stadium visualizer showing gates, blocks, first-aid, concessions, and eco-recycling points. Clicking points generates dynamic path overlays with walking directions, estimated times, and distance statistics. Includes an **Accessibility Override (ADA)** that routes fans through elevators and ramps.
* **Real-time Queue Estimator**: Shows live queue wait times for entrances and food vendors to help fans schedule their movements.
* **Sustainability & Green Rewards**: Fans log eco-friendly actions (e.g. taking public rail or recycling PET bottles). The AI audits these claims, updates carbon savings metrics, and unlocks food/merchandise vouchers.

### 2. Operations & Staff Control Center
* **Operational Telemetry Charting**: Real-time canvas line charts displaying active gate flow rates (powered by Chart.js).
* **GenAI Incident Commander**: Staff type in field reports (e.g., "spill near Section 102"). The AI instantly evaluates the severity, tags the category, designs a tactical action plan, and drafts warning text notifications for nearby stewards.
* **Multilingual Alert Broadcaster**: Stadium announcements entered in English are auto-translated (English, Spanish, French) and immediately broadcasted to all active fan screens.

---

## 🛠️ Architecture & Tech Stack
* **Structure & UI**: HTML5 Semantic markup, Lucide Icons, Google Font Outfit.
* **Styling**: Vanilla CSS3 custom properties supporting Dark Mode, Light Mode, and Neon themes, featuring smooth glassmorphism.
* **Logic**: Vanilla JS ES6 handling route paths, voice utilities, state parameters, and HTTP fetch requests to the Gemini Developer API.
* **Testing**: A dedicated `/test.html` runner.
* **Hosting**: Firebase Hosting (free tier) for static delivery.

---

## 🎯 Verification Criteria Mapping

### Code Quality
* Clean, modular logic separation with no heavy framework overhead. High code readability and comment coverage.

### Security
* Uses a **Settings Modal** to allow users to input their own Gemini API key (stored securely in `localStorage` in the browser client). No hardcoded credentials exist in public repositories.
* Includes a robust offline simulator fallback that allows complete verification without an active API key.

### Efficiency
* Formulated as a Single Page Application (SPA). Zero server overhead, minimal build bundles, and responsive SVG layout transformations.

### Testing
* Custom unit test runner (`/test.html`) verifying:
  1. Seating coordinate mappings.
  2. Sustainability character checks and level progress math.
  3. Incident Commander dispatcher classifications (Critical, Moderate, Low).
  4. Language translation arrays.

### Accessibility (A11y)
* Complies with WCAG guidelines:
  * Form inputs use matching `<label>` elements.
  * Correct ARIA attributes (`aria-label`, `role="dialog"`, `aria-modal`) for interactive modal controls.
  * Interactive Speech recognition and text readouts support visually and physically impaired fans.

### Problem Statement Alignment
* Addresses key tournament hurdles: multilingual communication, gate flow congestion, transport directions, ADA accessibility routes, safety dispatch, and carbon footprint accountability.
