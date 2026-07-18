/**
 * @fileoverview PitchPulse AI - Production Application Script
 * @version 2.0.0
 * @description GenAI-enabled stadium operations and fan experience hub
 *              for the FIFA World Cup 2026.
 */
'use strict';

(function PitchPulseApp() {

    // ─────────────────────────────────────────────
    // CONSTANTS — no magic numbers in logic below
    // ─────────────────────────────────────────────
    const CONSTANTS = Object.freeze({
        MIN_ECO_DESC_LENGTH: 8,
        XP_PER_LEVEL: 300,
        TELEMETRY_INTERVAL_MS: 10000,
        MIN_GATE_FLOW: 100,
        MAX_GATE_FLOW: 600,
        TRANSIT_UPDATE_INTERVAL_MS: 30000,
        GEMINI_TIMEOUT_MS: 30000
    });

    // ─────────────────────────────────────────────
    // APPLICATION STATE
    // ─────────────────────────────────────────────
    const appState = {
        currentTab: 'dashboard',
        apiKey: localStorage.getItem('gemini_api_key') || '',
        model: localStorage.getItem('gemini_model') || 'gemini-1.5-flash',
        theme: localStorage.getItem('pitchpulse_theme') || 'dark',
        userXP: parseInt(localStorage.getItem('eco_xp'), 10) || 120,
        userLevel: parseInt(localStorage.getItem('eco_level'), 10) || 1,
        incidents: [
            { id: 1, location: 'Gate B (Turnstile 3)', time: '10 mins ago', desc: 'Turnstile 3 scanner lag. IT Support dispatched. Replaced sensor.', status: 'resolved' },
            { id: 2, location: 'Section 104 Food Aisle', time: '2 mins ago', desc: 'High crowd density at hotdog stand bottleneck. Marshalling volunteers.', status: 'pending' }
        ]
    };

    // ─────────────────────────────────────────────
    // MAP NODE COORDINATES
    // ─────────────────────────────────────────────
    const NODE_COORDINATES = Object.freeze({
        'gate-a':          { x: 400, y: 50  },
        'gate-b':          { x: 750, y: 300 },
        'gate-c':          { x: 400, y: 550 },
        'gate-d':          { x: 50,  y: 300 },
        'block-101':       { x: 400, y: 150 },
        'block-102':       { x: 150, y: 300 },
        'block-103':       { x: 400, y: 450 },
        'block-104':       { x: 650, y: 300 },
        'node-restrooms':  { x: 235, y: 255 },
        'node-concessions':{ x: 565, y: 345 },
        'node-firstaid':   { x: 235, y: 345 },
        'node-recycle':    { x: 565, y: 255 }
    });

    // ─────────────────────────────────────────────
    // TRANSIT SIMULATION DATA
    // ─────────────────────────────────────────────
    const TRANSIT_DATA = [
        { line: 'NJ Transit Rail', route: 'Meadowlands → Secaucus Jn', gate: 'Gate A', status: 'ON TIME', departs: '+8 min', crowding: 'Low' },
        { line: 'NJ Transit Rail', route: 'Meadowlands → Penn Station', gate: 'Gate A', status: 'ON TIME', departs: '+22 min', crowding: 'Moderate' },
        { line: 'Coach Bus 156', route: 'MetLife → Newark Airport', gate: 'Gate C', status: 'DELAYED', departs: '+35 min', crowding: 'High' },
        { line: 'Rideshare (Lot G)', route: 'Pickup Zone — East Plaza', gate: 'Gate B', status: 'AVAILABLE', departs: '~4 min wait', crowding: 'Low' },
        { line: 'NJ Transit Rail', route: 'Meadowlands → Hoboken', gate: 'Gate A', status: 'ON TIME', departs: '+45 min', crowding: 'Low' }
    ];

    // ─────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────

    /**
     * Sanitizes a string input by trimming whitespace and escaping HTML entities.
     * Prevents XSS when user inputs are reflected back into text nodes.
     * @param {string} str - Raw input string.
     * @returns {string} Sanitized, trimmed string.
     */
    function sanitizeInput(str) {
        if (typeof str !== 'string') return '';
        return str.trim()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    /**
     * Unified error handler — logs contextual messages and renders UI feedback.
     * @param {string} context - Feature area name for logging.
     * @param {Error} error - The error instance.
     * @param {HTMLElement|null} feedbackEl - Optional element to render error text.
     */
    function handleError(context, error, feedbackEl = null) {
        console.error(`[PitchPulse] ${context}:`, error.message);
        if (feedbackEl) {
            feedbackEl.textContent = `⚠ ${context}: ${error.message}`;
        } else {
            alert(`${context}: ${error.message}`);
        }
    }

    /**
     * Safely updates the text content of an element by ID.
     * @param {string} id - Target element ID.
     * @param {string} text - Replacement text.
     */
    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    /**
     * Creates a Lucide icon element.
     * @param {string} iconName - Lucide icon name slug.
     * @param {string} [extraClass=''] - Optional CSS class string.
     * @returns {HTMLElement} The icon element (will be processed by lucide.createIcons).
     */
    function createIcon(iconName, extraClass = '') {
        const i = document.createElement('i');
        i.setAttribute('data-lucide', iconName);
        if (extraClass) i.className = extraClass;
        return i;
    }

    /**
     * Re-renders all Lucide icons in the document.
     */
    function refreshIcons() {
        if (window.lucide) window.lucide.createIcons();
    }

    // ─────────────────────────────────────────────
    // INITIALISATION
    // ─────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initTabNavigation();
        initTelemetryChart();
        initSpeechAPI();
        initMapInteractions();
        initFormsAndButtons();
        initTransitBoard();
        initEmergencySOS();
        updateEcoDisplay();
        renderIncidentLogs();
        refreshIcons();
    });

    // ─────────────────────────────────────────────
    // THEME
    // ─────────────────────────────────────────────

    /** Applies the saved or default theme class to the body element. */
    function initTheme() {
        document.body.className = `${appState.theme}-theme`;
        const sel = document.getElementById('themeSelect');
        if (sel) sel.value = appState.theme;
    }

    /**
     * Switches the active UI theme.
     * @param {string} theme - One of: 'dark' | 'light' | 'neon'.
     */
    function setTheme(theme) {
        appState.theme = theme;
        document.body.className = `${theme}-theme`;
        localStorage.setItem('pitchpulse_theme', theme);
    }

    // ─────────────────────────────────────────────
    // TAB NAVIGATION
    // ─────────────────────────────────────────────

    /** Binds all sidebar nav clicks and shortcut buttons to view switcher. */
    function initTabNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                switchTab(item.getAttribute('data-tab'));
            });
        });
        const buddyBtn = document.getElementById('goToBuddyBtn');
        if (buddyBtn) buddyBtn.addEventListener('click', () => switchTab('assistant'));
    }

    /**
     * Activates the requested content panel and updates the page header.
     * @param {string} tabId - Target tab identifier.
     */
    function switchTab(tabId) {
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.toggle('active', nav.getAttribute('data-tab') === tabId);
        });
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `tab-${tabId}`);
        });

        const headers = {
            'dashboard':     { title: 'Stadium Dashboard',           sub: 'Real-time crowd flows and wait-times' },
            'assistant':     { title: 'AI Stadium Buddy',            sub: 'Generative AI helper for World Cup visitors' },
            'navigation':    { title: 'Interactive Stadium Map',     sub: 'Custom wayfinding and accessibility paths' },
            'sustainability':{ title: 'Sustainability Hub',          sub: 'Log eco-friendly actions and earn rewards' },
            'operations':    { title: 'Operations Control Center',   sub: 'Real-time telemetry, dispatcher, and broadcast console' },
            'transit':       { title: 'Live Transit Board',          sub: 'Real-time departures and crowd advisories' },
            'emergency':     { title: 'Emergency SOS',               sub: 'Instant dispatch for medical and safety incidents' }
        };

        if (headers[tabId]) {
            setText('pageTitle', headers[tabId].title);
            setText('pageSubTitle', headers[tabId].sub);
        }
        appState.currentTab = tabId;
    }

    // ─────────────────────────────────────────────
    // TELEMETRY CHART
    // ─────────────────────────────────────────────
    let telemetryChart;

    /** Initialises the Chart.js line chart and starts periodic data simulation. */
    function initTelemetryChart() {
        const canvas = document.getElementById('telemetryChart');
        if (!canvas || !window.Chart) return;

        telemetryChart = new window.Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['17:00', '17:10', '17:20', '17:30', '17:40', '17:50'],
                datasets: [{
                    label: 'Gate Entry Rate (flow/min)',
                    data: [350, 420, 480, 510, 460, 450],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af', font: { family: 'Outfit' } } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af', font: { family: 'Outfit' } } }
                }
            }
        });

        setInterval(() => {
            if (!telemetryChart) return;
            const now = new Date();
            const label = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
            const current = telemetryChart.data.datasets[0].data;
            const last = current[current.length - 1];
            const delta = Math.floor(Math.random() * 60) - 30;
            const next = Math.max(CONSTANTS.MIN_GATE_FLOW, Math.min(CONSTANTS.MAX_GATE_FLOW, last + delta));

            telemetryChart.data.labels.shift();
            telemetryChart.data.labels.push(label);
            current.shift();
            current.push(next);
            telemetryChart.update();

            const el = document.getElementById('entryRateVal');
            if (el) {
                el.textContent = `${next} `;
                const span = document.createElement('span');
                span.className = 'unit';
                span.textContent = '/min';
                el.appendChild(span);
            }
        }, CONSTANTS.TELEMETRY_INTERVAL_MS);
    }

    // ─────────────────────────────────────────────
    // LIVE TRANSIT BOARD
    // ─────────────────────────────────────────────

    /** Renders the transit departure board and schedules periodic refresh. */
    function initTransitBoard() {
        renderTransitBoard();
        setInterval(updateTransitCountdowns, CONSTANTS.TRANSIT_UPDATE_INTERVAL_MS);
    }

    /** Builds the transit board table rows from TRANSIT_DATA. */
    function renderTransitBoard() {
        const container = document.getElementById('transitBoardContainer');
        if (!container) return;
        container.textContent = '';

        TRANSIT_DATA.forEach(row => {
            const card = document.createElement('div');
            card.className = `transit-row crowding-${row.crowding.toLowerCase()}`;

            const lineInfo = document.createElement('div');
            lineInfo.className = 'transit-line-info';

            const lineName = document.createElement('strong');
            lineName.textContent = row.line;

            const routeSpan = document.createElement('span');
            routeSpan.className = 'transit-route text-secondary';
            routeSpan.textContent = row.route;

            const gateTag = document.createElement('span');
            gateTag.className = 'transit-gate-tag';
            gateTag.textContent = row.gate;

            lineInfo.appendChild(lineName);
            lineInfo.appendChild(routeSpan);
            lineInfo.appendChild(gateTag);

            const statusBlock = document.createElement('div');
            statusBlock.className = 'transit-status-block';

            const departsEl = document.createElement('span');
            departsEl.className = 'transit-departs';
            departsEl.textContent = row.departs;

            const statusBadge = document.createElement('span');
            statusBadge.className = `transit-status-badge status-${row.status.toLowerCase().replace(' ', '-')}`;
            statusBadge.textContent = row.status;

            const crowdBadge = document.createElement('span');
            crowdBadge.className = `transit-crowd crowd-${row.crowding.toLowerCase()}`;
            crowdBadge.textContent = `${row.crowding} Crowd`;

            statusBlock.appendChild(departsEl);
            statusBlock.appendChild(statusBadge);
            statusBlock.appendChild(crowdBadge);

            card.appendChild(lineInfo);
            card.appendChild(statusBlock);
            container.appendChild(card);
        });
    }

    /** Simulates countdown updates on transit departures. */
    function updateTransitCountdowns() {
        const rows = document.querySelectorAll('.transit-departs');
        rows.forEach(el => {
            const match = el.textContent.match(/\+(\d+) min/);
            if (match) {
                const remaining = Math.max(1, parseInt(match[1], 10) - 1);
                el.textContent = `+${remaining} min`;
            }
        });
    }

    // ─────────────────────────────────────────────
    // EMERGENCY SOS
    // ─────────────────────────────────────────────

    /** Binds the Emergency SOS form submit and activation logic. */
    function initEmergencySOS() {
        const sosForm = document.getElementById('emergencySOSForm');
        if (!sosForm) return;

        sosForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitEmergencySOS();
        });
    }

    /** Processes an emergency SOS request with GenAI protocol generation. */
    async function submitEmergencySOS() {
        const sosType = document.getElementById('sosType').value;
        const sosLocation = sanitizeInput(document.getElementById('sosLocation').value);
        const sosDetails = sanitizeInput(document.getElementById('sosDetails').value);
        const sosBtn = document.getElementById('sosSubmitBtn');

        if (!sosLocation) {
            handleError('SOS Validation', new Error('Please enter a location for the emergency.'));
            return;
        }

        sosBtn.disabled = true;
        sosBtn.textContent = 'Dispatching...';

        const prompt = `
You are the Emergency Response Coordinator at MetLife Stadium during FIFA World Cup 2026.
A fan/staff member has triggered an Emergency SOS alert.

Emergency Type: ${sosType}
Location: ${sosLocation}
Additional Details: ${sosDetails || 'None provided'}

Provide a structured first-response protocol in JSON format:
{
  "priority": "CRITICAL" | "HIGH" | "MODERATE",
  "unitDispatched": "Name of the unit to dispatch (e.g. Medical Unit Alpha)",
  "eta": "Estimated arrival time (e.g. 2-3 minutes)",
  "immediateActions": ["Action 1", "Action 2", "Action 3"],
  "broadcastAlert": "Short public address announcement (max 100 chars)"
}`;

        try {
            let protocol;
            if (appState.apiKey) {
                const raw = await callGemini(prompt);
                const json = raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
                protocol = JSON.parse(json);
            } else {
                await new Promise(r => setTimeout(r, 1000));
                protocol = simulateSOSProtocol(sosType);
            }

            renderSOSResponse(protocol, sosLocation);

            // Log to incidents
            appState.incidents.unshift({
                id: appState.incidents.length + 1,
                location: sosLocation,
                time: 'Just now',
                desc: `[SOS - ${sosType}] ${sosDetails || 'Emergency alert triggered.'}`,
                status: 'pending'
            });
            renderIncidentLogs();

        } catch (err) {
            handleError('Emergency SOS', err);
        } finally {
            sosBtn.disabled = false;
            sosBtn.textContent = '';
            const icon = createIcon('alert-octagon');
            sosBtn.appendChild(icon);
            sosBtn.appendChild(document.createTextNode(' SEND EMERGENCY SOS'));
            refreshIcons();
        }
    }

    /**
     * Renders the GenAI emergency protocol response panel.
     * @param {object} protocol - Parsed JSON protocol object.
     * @param {string} location - Sanitized location string.
     */
    function renderSOSResponse(protocol, location) {
        const panel = document.getElementById('sosResponsePanel');
        if (!panel) return;

        panel.classList.remove('hidden');
        panel.textContent = '';

        const title = document.createElement('h4');
        title.className = 'sos-response-title';
        title.textContent = `🚨 Protocol Active — ${location}`;

        const priority = document.createElement('span');
        priority.className = `badge badge-severity ${protocol.priority.toLowerCase()}`;
        priority.textContent = protocol.priority;

        const unit = document.createElement('p');
        unit.className = 'sos-unit';
        unit.textContent = '';
        const unitLabel = document.createElement('strong');
        unitLabel.textContent = 'Dispatched: ';
        unit.appendChild(unitLabel);
        unit.appendChild(document.createTextNode(`${protocol.unitDispatched} — ETA: ${protocol.eta}`));

        const actionsTitle = document.createElement('h5');
        actionsTitle.textContent = 'Immediate Actions:';

        const actionsList = document.createElement('ol');
        actionsList.className = 'route-steps';
        protocol.immediateActions.forEach(action => {
            const li = document.createElement('li');
            li.textContent = action;
            actionsList.appendChild(li);
        });

        const alertBroadcast = document.createElement('blockquote');
        alertBroadcast.className = 'staff-alert-draft';
        alertBroadcast.textContent = protocol.broadcastAlert;

        panel.appendChild(title);
        panel.appendChild(priority);
        panel.appendChild(unit);
        panel.appendChild(actionsTitle);
        panel.appendChild(actionsList);
        panel.appendChild(alertBroadcast);
        panel.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Simulates emergency protocol when no API key is present.
     * @param {string} type - Emergency category string.
     * @returns {object} Protocol object.
     */
    function simulateSOSProtocol(type) {
        const protocols = {
            'medical': {
                priority: 'CRITICAL',
                unitDispatched: 'Medical Unit Alpha (Red Cross)',
                eta: '2-3 minutes',
                immediateActions: [
                    'Keep the affected fan calm and seated.',
                    'Clear a 3-meter radius around the fan immediately.',
                    'Do not move the fan unless instructed by medical staff.',
                    'Medical Unit Alpha is en route with defibrillator and stretcher.'
                ],
                broadcastAlert: 'ALERT: Medical team deployed to location. Please clear the area.'
            },
            'fire': {
                priority: 'CRITICAL',
                unitDispatched: 'Fire Safety Unit F-1 & Security Squad S-3',
                eta: '3-5 minutes',
                immediateActions: [
                    'Alert all nearby fans to move to the nearest emergency exit.',
                    'Do NOT use elevators — use stairwells only.',
                    'Fire unit F-1 dispatched with suppression equipment.',
                    'Activate stadium-wide evacuation broadcast for affected sector.'
                ],
                broadcastAlert: 'EMERGENCY: Please move calmly to your nearest emergency exit.'
            },
            'crowd': {
                priority: 'HIGH',
                unitDispatched: 'Crowd Control Unit C-2',
                eta: '2 minutes',
                immediateActions: [
                    'Open alternate exit/entry lanes at adjacent gates.',
                    'Activate crowd diversion displays at affected section.',
                    'Deploy stewards to form pedestrian corridors.',
                    'Broadcast advisory to redirect fan flow via PA system.'
                ],
                broadcastAlert: 'Advisory: Please use alternate gate. Stewards will guide you.'
            }
        };
        return protocols[type] || protocols['medical'];
    }

    // ─────────────────────────────────────────────
    // SPEECH API
    // ─────────────────────────────────────────────
    let recognition;
    let synth;

    /** Initialises HTML5 Web Speech Recognition and Synthesis engines. */
    function initSpeechAPI() {
        synth = window.speechSynthesis;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            const btn = document.getElementById('voiceInputBtn');
            if (btn) btn.style.display = 'none';
            return;
        }

        recognition = new SpeechRecognition();
        Object.assign(recognition, { continuous: false, lang: 'en-US', interimResults: false, maxAlternatives: 1 });

        const voiceBtn = document.getElementById('voiceInputBtn');
        const micIcon = document.getElementById('micIcon');

        voiceBtn.addEventListener('click', () => {
            if (voiceBtn.classList.contains('listening')) {
                recognition.stop();
            } else {
                voiceBtn.classList.add('listening');
                micIcon.setAttribute('data-lucide', 'mic-off');
                refreshIcons();
                recognition.start();
            }
        });

        recognition.onresult = (e) => {
            document.getElementById('chatInput').value = e.results[0][0].transcript;
            stopRecognition();
            sendChatMessage();
        };
        recognition.onerror = stopRecognition;
        recognition.onend = stopRecognition;
    }

    /** Resets microphone button and icon to idle state. */
    function stopRecognition() {
        const btn = document.getElementById('voiceInputBtn');
        const icon = document.getElementById('micIcon');
        if (btn && btn.classList.contains('listening')) {
            btn.classList.remove('listening');
            icon.setAttribute('data-lucide', 'mic');
            refreshIcons();
        }
    }

    /**
     * Speaks text using the Web Speech Synthesis API in the selected language.
     * @param {string} text - Plain text to be spoken.
     */
    function speakText(text) {
        if (!synth || !document.getElementById('voiceSynthesisToggle').checked) return;
        const LANG_MAP = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-PT' };
        synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = LANG_MAP[document.getElementById('chatLanguage').value] || 'en-US';
        synth.speak(utter);
    }

    // ─────────────────────────────────────────────
    // MAP INTERACTIONS
    // ─────────────────────────────────────────────

    /** Binds click and keyboard events to all SVG stadium nodes. */
    function initMapInteractions() {
        const svg = document.getElementById('stadiumSvg');
        if (!svg) return;

        svg.querySelectorAll('.gate-node, .seat-block, .poi-node').forEach(node => {
            const activate = () => {
                const isGate = node.id.includes('gate');
                if (isGate) {
                    svg.querySelectorAll('.gate-node').forEach(g => g.classList.remove('selected'));
                    document.getElementById('routeStart').value = node.id;
                } else {
                    svg.querySelectorAll('.seat-block, .poi-node').forEach(s => s.classList.remove('selected'));
                    document.getElementById('routeEnd').value = node.id;
                }
                node.classList.add('selected');
                document.getElementById('mapOverlayInfo').textContent = `Selected: ${node.getAttribute('data-name')}`;
                calculatePath(document.getElementById('routeStart').value, document.getElementById('routeEnd').value);
            };
            node.addEventListener('click', activate);
            node.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });
        });

        document.getElementById('generateRouteBtn').addEventListener('click', () => {
            calculatePath(document.getElementById('routeStart').value, document.getElementById('routeEnd').value);
        });

        document.getElementById('quickFindBtn').addEventListener('click', () => {
            const seat = sanitizeInput(document.getElementById('quickSeatInput').value).toLowerCase();
            switchTab('navigation');
            const MAP = { '101': 'block-101', 'north': 'block-101', '102': 'block-102', 'west': 'block-102', '103': 'block-103', 'south': 'block-103', '104': 'block-104', 'east': 'block-104' };
            const key = Object.keys(MAP).find(k => seat.includes(k));
            if (key) document.getElementById('routeEnd').value = MAP[key];
            calculatePath(document.getElementById('routeStart').value, document.getElementById('routeEnd').value);
        });
    }

    /**
     * Draws an SVG path between start and end nodes with step-by-step directions.
     * @param {string} startId - Starting node identifier.
     * @param {string} endId - Destination node identifier.
     */
    function calculatePath(startId, endId) {
        const pathElem = document.getElementById('activeNavigationPath');
        const start = NODE_COORDINATES[startId];
        const end = NODE_COORDINATES[endId];
        if (!start || !end || !pathElem) return;

        // Force animation restart
        pathElem.style.animation = 'none';
        pathElem.getBoundingClientRect();
        pathElem.style.animation = null;

        const isAda = document.getElementById('accessibilityRouteToggle').checked;
        let pathD, directions, distance, time;

        if (isAda && (startId === 'gate-d' || endId === 'block-102' || endId === 'node-firstaid')) {
            const elev = { x: 150, y: 250 };
            pathD = `M ${start.x},${start.y} Q ${elev.x},${elev.y} ${end.x},${end.y}`;
            directions = [
                'Use the wide ADA express entry lane (blue tactile indicators).',
                'Proceed to Section 102 West Tower via the accessible corridor.',
                'Take Elevator W1 to Level 2 (Concourse level).',
                'Follow illuminated ceiling guides to your ADA seating platform.'
            ];
            distance = 180; time = 4;
        } else {
            const cp = { x: (start.x + end.x) / 2 + 50, y: (start.y + end.y) / 2 - 30 };
            pathD = `M ${start.x},${start.y} Q ${cp.x},${cp.y} ${end.x},${end.y}`;
            const dest = document.getElementById('routeEnd').options[document.getElementById('routeEnd').selectedIndex].text;
            directions = [
                'Enter via gate check-in and scan your digital match ticket.',
                'Follow the main concourse perimeter pathway.',
                `Look for digital wayfinding signs directing you to: ${dest}.`,
                'Your destination is approximately 50 metres ahead on the left.'
            ];
            distance = 290; time = 3;
        }

        pathElem.setAttribute('d', pathD);
        pathElem.setAttribute('stroke', isAda ? '#10b981' : '#3b82f6');
        setText('routeEstTime', `${time} mins`);
        setText('routeEstDist', `${distance}m`);

        const list = document.getElementById('routeStepsList');
        list.textContent = '';
        directions.forEach(step => {
            const li = document.createElement('li');
            li.textContent = step;
            list.appendChild(li);
        });

        document.getElementById('routeDetailsPanel').classList.remove('hidden');
        setText('mapOverlayInfo', `Route ready · Est. ${time} min · ${distance}m`);
    }

    // ─────────────────────────────────────────────
    // SUSTAINABILITY / REWARDS
    // ─────────────────────────────────────────────

    /** Refreshes XP bar, level display, badges and vouchers based on current appState. */
    function updateEcoDisplay() {
        const maxXP = appState.userLevel * CONSTANTS.XP_PER_LEVEL;
        setText('userGreenLevel', appState.userLevel);
        setText('userGreenXp', `${appState.userXP} / ${maxXP} XP`);
        document.getElementById('xpProgressBar').style.width = `${Math.min(100, (appState.userXP / maxXP) * 100)}%`;

        const unlockBadge = (id, threshold) => {
            if (appState.userXP >= threshold) {
                const el = document.getElementById(id);
                if (el) { el.classList.add('earned'); el.classList.remove('locked'); }
            }
        };
        unlockBadge('badgeRecycler', 200);
        unlockBadge('badgeConserve', 300);

        const unlockVoucher = (id, threshold, msg) => {
            if (appState.userXP >= threshold) {
                const v = document.getElementById(id);
                if (v) {
                    v.classList.remove('disabled');
                    v.classList.add('unlocked');
                    const p = v.querySelector('p');
                    if (p) p.textContent = msg;
                }
            }
        };
        unlockVoucher('voucherSoda', 300, 'Unlocked! Present at any concession for a free refill.');
        unlockVoucher('voucherDiscount', 500, 'Unlocked! Scan barcode at official FIFA merchandise shops.');
    }

    // ─────────────────────────────────────────────
    // FORMS & BUTTONS
    // ─────────────────────────────────────────────

    /** Attaches all remaining form, button, and modal event listeners. */
    function initFormsAndButtons() {
        // Settings modal
        const modal = document.getElementById('settingsModal');
        document.getElementById('openSettingsBtn').addEventListener('click', () => {
            document.getElementById('geminiApiKey').value = appState.apiKey;
            document.getElementById('geminiModel').value = appState.model;
            modal.classList.add('open');
        });
        document.getElementById('closeSettingsBtn').addEventListener('click', () => modal.classList.remove('open'));
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            appState.apiKey = sanitizeInput(document.getElementById('geminiApiKey').value);
            appState.model = document.getElementById('geminiModel').value;
            appState.theme = document.getElementById('themeSelect').value;
            localStorage.setItem('gemini_api_key', appState.apiKey);
            localStorage.setItem('gemini_model', appState.model);
            setTheme(appState.theme);
            modal.classList.remove('open');
            alert('Configuration saved successfully!');
        });

        // Theme toggle
        document.getElementById('themeToggleBtn').addEventListener('click', () => {
            const next = { dark: 'light', light: 'neon', neon: 'dark' };
            const newTheme = next[appState.theme] || 'dark';
            setTheme(newTheme);
            document.getElementById('themeSelect').value = newTheme;
        });

        // Queue refresh
        document.getElementById('refreshWaitTimesBtn').addEventListener('click', refreshQueueTimes);

        // Chat
        document.getElementById('sendMessageBtn').addEventListener('click', sendChatMessage);
        document.getElementById('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendChatMessage(); });
        document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('chatInput').value = btn.textContent;
                sendChatMessage();
            });
        });

        // Sustainability form
        document.getElementById('sustainabilityForm').addEventListener('submit', e => { e.preventDefault(); submitEcoAction(); });

        // Incident form
        document.getElementById('incidentForm').addEventListener('submit', e => { e.preventDefault(); submitIncident(); });

        // Broadcast translator
        document.getElementById('translateBroadcastBtn').addEventListener('click', handleBroadcastTranslation);
    }

    /** Randomises all queue bar widths and wait-time labels. */
    function refreshQueueTimes() {
        document.querySelectorAll('.queue-item').forEach(item => {
            const name = item.querySelector('.queue-name').textContent;
            const isHeavy = name.includes('Gate C');
            const newTime = Math.floor(Math.random() * (isHeavy ? 35 : 23)) + (isHeavy ? 15 : 2);
            item.querySelector('.queue-time').textContent = `${newTime} mins`;
            const bar = item.querySelector('.queue-bar');
            bar.style.width = `${(newTime / (isHeavy ? 50 : 25)) * 100}%`;
            bar.className = 'queue-bar';
            const metric = item.querySelector('.queue-metric');
            if (newTime <= 10)      { bar.classList.add('green');  metric.className = 'queue-metric text-success'; metric.textContent = 'Low Wait'; }
            else if (newTime <= 25) { bar.classList.add('orange'); metric.className = 'queue-metric text-warning'; metric.textContent = 'Moderate Wait'; }
            else                    { bar.classList.add('red');    metric.className = 'queue-metric text-danger';  metric.textContent = 'Heavy Wait'; }
        });
    }

    // ─────────────────────────────────────────────
    // GEMINI API
    // ─────────────────────────────────────────────

    /**
     * Sends a text prompt to the Google Generative Language API.
     * @param {string} promptText - The constructed prompt string.
     * @returns {Promise<string>} Generated text response.
     * @throws {Error} Network or API error details.
     */
    async function callGemini(promptText) {
        if (!appState.apiKey) throw new Error('No API key configured. Using simulation mode.');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${appState.model}:generateContent?key=${appState.apiKey}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), CONSTANTS.GEMINI_TIMEOUT_MS);

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `HTTP ${res.status}`);
            }
            const data = await res.json();
            return data.candidates[0].content.parts[0].text;
        } finally {
            clearTimeout(timer);
        }
    }

    // ─────────────────────────────────────────────
    // GenAI FEATURE 1: CHAT BUDDY
    // ─────────────────────────────────────────────

    /** Processes the chat input, calls Gemini or mock, renders the reply. */
    async function sendChatMessage() {
        const input = document.getElementById('chatInput');
        const text = sanitizeInput(input.value);
        if (!text) return;
        input.value = '';

        appendChatMessage('user', text);
        const bubble = appendChatMessage('bot', 'Stadium Buddy is thinking…');
        bubble.classList.add('pulse-icon');

        const lang = document.getElementById('chatLanguage').value;
        const PROMPT = `You are Stadium Buddy, the official GenAI Assistant for the FIFA World Cup 2026 at MetLife Stadium.
Stadium metadata:
- Gate A: North, NJ Transit rail to Secaucus Jn. Gate B: East Plaza, concessions. Gate C: South, coach bus terminus. Gate D: West, ADA elevator access.
- Transit: NJ Transit rail → Gate A. Buses → Gate C. Rideshare (Lot G) → Gate B.
- Food: East Concourse Section 104 (hotdogs, tacos, halal, vegan).
- Restrooms: All levels. ADA restrooms at Section 102 and 104. Baby change facilities available.
- Eco: Smart recycling bins at Section 104 Eco-Recycling Center. Free water refills at Sections 101 & 103.
Answer the query precisely. Translate to language: ${lang}. Be friendly and brief.

Query: ${text}`;

        try {
            const reply = appState.apiKey
                ? await callGemini(PROMPT)
                : (await new Promise(r => setTimeout(r, 1000)), generateMockChatResponse(text, lang));
            bubble.classList.remove('pulse-icon');
            bubble.textContent = reply;
            speakText(reply);
        } catch (err) {
            bubble.classList.remove('pulse-icon');
            bubble.textContent = `⚠ ${err.message}`;
        }
    }

    /**
     * Creates and appends a chat message bubble to the messages container.
     * @param {string} sender - 'user' or 'bot'.
     * @param {string} text - Message display text.
     * @returns {HTMLElement} The bubble element for further updates.
     */
    function appendChatMessage(sender, text) {
        const container = document.getElementById('chatMessages');
        const wrap = document.createElement('div');
        wrap.className = `message ${sender}-msg`;
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;
        wrap.appendChild(bubble);
        container.appendChild(wrap);
        container.scrollTop = container.scrollHeight;
        return bubble;
    }

    /**
     * Returns a canned response matching the query topic in the chosen language.
     * @param {string} query - User's raw query string.
     * @param {string} lang - Two-letter language code.
     * @returns {string} Mock localised answer string.
     */
    function generateMockChatResponse(query, lang) {
        const q = query.toLowerCase();
        const R = {
            en: {
                transit: 'Exit via Gate A (North) for NJ Transit rail to Secaucus Junction. Buses at Gate C (South).',
                wheelchair: 'Fully accessible! ADA restrooms at Sections 102 & 104. Elevator at Gate D.',
                recycle: 'Smart recycling bins near Section 104 Eco-Center. Earn XP in the Sustainability Hub!',
                food: 'East Concourse (Section 104): hotdogs, tacos, halal, vegan options available.',
                default: "Hi! I'm Stadium Buddy. Ask me about gates, transit, food, restrooms or eco rewards!"
            },
            es: {
                transit: 'Salga por la Puerta A (Norte) para el tren NJ Transit. Autobuses en Puerta C (Sur).',
                wheelchair: '¡Totalmente accesible! Baños ADA en Secciones 102 y 104. Ascensor en Puerta D.',
                recycle: 'Contenedores de reciclaje cerca de la Sección 104. ¡Gane puntos en nuestra app!',
                food: 'Concourse Este (Sección 104): perritos calientes, tacos, opciones halal y veganas.',
                default: '¡Hola! Soy Stadium Buddy. ¡Pregúntame sobre puertas, transporte, comida o reciclaje!'
            },
            fr: {
                transit: 'Sortez par la Porte A (Nord) pour le train NJ Transit. Bus à la Porte C (Sud).',
                wheelchair: 'Entièrement accessible! WC ADA aux Sections 102 et 104. Ascenseur à la Porte D.',
                recycle: 'Bacs de recyclage intelligents près de la Section 104. Gagnez des XP dans notre appli!',
                food: 'Hall Est (Section 104): hot-dogs, tacos, repas halal et options végétaliennes.',
                default: 'Bonjour! Je suis Stadium Buddy. Posez-moi des questions sur les portes, les transports ou la restauration!'
            }
        };
        const dict = R[lang] || R.en;
        if (q.match(/transit|train|bus|shuttle/)) return dict.transit;
        if (q.match(/wheelchair|accessible|ada|disabled|restroom|toilet/)) return dict.wheelchair;
        if (q.match(/recycle|green|bottle|plastic|eco/)) return dict.recycle;
        if (q.match(/food|eat|taco|drink|concession/)) return dict.food;
        return dict.default;
    }

    // ─────────────────────────────────────────────
    // GenAI FEATURE 2: ECO AUDIT
    // ─────────────────────────────────────────────

    /** Submits a sustainability action for GenAI auditing and XP reward. */
    async function submitEcoAction() {
        const type = document.getElementById('actionType').value;
        const detail = sanitizeInput(document.getElementById('actionDetail').value);
        if (!detail) return;

        const btn = document.getElementById('logActionBtn');
        btn.disabled = true;
        btn.textContent = 'Auditing action…';

        const PROMPT = `You are a green-incentive auditor for FIFA World Cup 2026.
Verify this fan eco-action report. Output ONLY JSON:
{ "verified": bool, "assessment": "message", "savedCo2": float, "xpGained": int }
Category: ${type} | Description: "${detail}"`;

        try {
            const result = appState.apiKey
                ? JSON.parse((raw => raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1))(await callGemini(PROMPT)))
                : (await new Promise(r => setTimeout(r, 900)), simulateEcoAudit(type, detail));

            if (!result.verified) {
                alert('Audit failed. Please describe your eco-action in more detail.');
                return;
            }

            setText('auditAssessment', result.assessment);
            setText('savedCo2Val', `${result.savedCo2} kg`);
            setText('xpGainedVal', `${result.xpGained} XP`);

            appState.userXP += result.xpGained;
            if (appState.userXP >= appState.userLevel * CONSTANTS.XP_PER_LEVEL) {
                appState.userXP -= appState.userLevel * CONSTANTS.XP_PER_LEVEL;
                appState.userLevel++;
                alert(`🎉 Level up! You are now Green Champion Level ${appState.userLevel}!`);
            }
            localStorage.setItem('eco_xp', appState.userXP);
            localStorage.setItem('eco_level', appState.userLevel);
            updateEcoDisplay();
            document.getElementById('greenAuditCard').classList.remove('hidden');
            document.getElementById('actionDetail').value = '';

        } catch (err) {
            handleError('Eco Audit', err);
        } finally {
            btn.disabled = false;
            btn.textContent = '';
            btn.appendChild(createIcon('leaf'));
            btn.appendChild(document.createTextNode(' Validate & Log Action'));
            refreshIcons();
        }
    }

    /**
     * Returns simulated eco-audit results when API is offline.
     * @param {string} type - Action category.
     * @param {string} text - Fan description.
     * @returns {object} Audit result payload.
     */
    function simulateEcoAudit(type, text) {
        if (text.length < CONSTANTS.MIN_ECO_DESC_LENGTH) return { verified: false };
        const MAP = {
            recycling: { verified: true, assessment: 'PET bottle recycling verified! Great work reducing stadium waste.', savedCo2: 0.4, xpGained: 60 },
            transport: { verified: true, assessment: 'Rail transit confirmed! 90% less carbon vs. driving solo.', savedCo2: 2.1, xpGained: 100 },
            reusable:  { verified: true, assessment: 'Reusable flask confirmed! Prevents single-use cup waste.', savedCo2: 0.6, xpGained: 40 }
        };
        return MAP[type] || { verified: true, assessment: 'Eco action verified! Every action makes this the greenest World Cup.', savedCo2: 0.3, xpGained: 30 };
    }

    // ─────────────────────────────────────────────
    // GenAI FEATURE 3: INCIDENT COMMANDER
    // ─────────────────────────────────────────────

    /** Classifies a staff incident report and renders a dispatch recommendation. */
    async function submitIncident() {
        const desc = sanitizeInput(document.getElementById('incidentDescription').value);
        const loc = sanitizeInput(document.getElementById('incidentLocation').value) || 'Unspecified';
        if (!desc) return;

        const btn = document.getElementById('logIncidentBtn');
        btn.disabled = true;
        btn.textContent = 'Commander evaluating…';

        const PROMPT = `You are the GenAI Incident Commander at MetLife Stadium.
Evaluate this report. Output ONLY JSON:
{ "severity": "LOW"|"MODERATE"|"CRITICAL", "category": "string", "actionPlan": "string", "staffAlert": "string (max 80 chars)" }
Report: "${desc}"`;

        try {
            const rec = appState.apiKey
                ? JSON.parse((raw => raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1))(await callGemini(PROMPT)))
                : (await new Promise(r => setTimeout(r, 1000)), simulateIncidentCommander(desc));

            setText('recommendedSeverity', rec.severity);
            document.getElementById('recommendedSeverity').className = `badge badge-severity ${rec.severity.toLowerCase()}`;
            setText('recommendedCategory', rec.category);
            setText('recommendedActionPlan', rec.actionPlan);
            setText('recommendedStaffText', rec.staffAlert);
            document.getElementById('incidentAuditPanel').classList.remove('hidden');

            const oldBtn = document.getElementById('executeDispatchBtn');
            const newBtn = oldBtn.cloneNode(true);
            oldBtn.parentNode.replaceChild(newBtn, oldBtn);
            newBtn.addEventListener('click', () => {
                appState.incidents.unshift({ id: appState.incidents.length + 1, location: loc, time: 'Just now', desc, status: 'pending' });
                renderIncidentLogs();
                alert(`Dispatched! Alert: "${rec.staffAlert}"`);
                document.getElementById('incidentDescription').value = '';
                document.getElementById('incidentAuditPanel').classList.add('hidden');
            });
        } catch (err) {
            handleError('Incident Commander', err);
        } finally {
            btn.disabled = false;
            btn.textContent = '';
            btn.appendChild(createIcon('shield-alert'));
            btn.appendChild(document.createTextNode(' Submit Incident to GenAI Commander'));
            refreshIcons();
        }
    }

    /**
     * Classifies incident text into severity/category offline.
     * @param {string} text - Incident description.
     * @returns {object} Classification result.
     */
    function simulateIncidentCommander(text) {
        const t = text.toLowerCase();
        if (t.match(/spill|wet|leak|trash/))          return { severity: 'MODERATE', category: 'Maintenance & Safety', actionPlan: 'Dispatch janitorial team J-3 with hazard cones and wet-vacuum.', staffAlert: 'ALERT: Wet floor maintenance at Section 102. Deploy wet floor signs.' };
        if (t.match(/fight|crowd|blocked|bottleneck/)) return { severity: 'CRITICAL', category: 'Security & Crowd Control', actionPlan: 'Deploy security squad S-2 and open alternate pedestrian lanes.', staffAlert: 'CRITICAL: Security squad S-2 deployed. Redirect crowd via Gate A.' };
        if (t.match(/heart|faint|medical|injured/))    return { severity: 'CRITICAL', category: 'Medical Emergency', actionPlan: 'Dispatch Red Cross Unit M-1 with defibrillator and stretcher immediately.', staffAlert: 'CRITICAL: Medical Unit M-1 dispatched. Clear 3-metre radius.' };
        return { severity: 'LOW', category: 'General Operations', actionPlan: 'Assign local steward to investigate and report findings.', staffAlert: 'OPS: Steward requested for routine check at reported location.' };
    }

    /** Rebuilds the active incidents list using secure DOM methods. */
    function renderIncidentLogs() {
        const list = document.getElementById('activeIncidentsList');
        if (!list) return;
        list.textContent = '';
        appState.incidents.forEach(inc => {
            const card = document.createElement('div');
            card.className = `incident-log-item status-${inc.status}`;

            const meta = document.createElement('div');
            meta.className = 'log-meta';
            const loc = document.createElement('span');
            loc.className = 'log-location';
            loc.textContent = inc.location;
            const t = document.createElement('span');
            t.className = 'log-time';
            t.textContent = inc.time;
            meta.appendChild(loc);
            meta.appendChild(t);

            const desc = document.createElement('p');
            desc.className = 'log-desc';
            desc.textContent = inc.desc;

            const tag = document.createElement('span');
            tag.className = 'log-tag';
            tag.textContent = inc.status === 'resolved' ? 'Resolved' : 'Active Dispatch';

            card.appendChild(meta);
            card.appendChild(desc);
            card.appendChild(tag);
            list.appendChild(card);
        });
    }

    // ─────────────────────────────────────────────
    // GenAI FEATURE 4: BROADCAST TRANSLATOR
    // ─────────────────────────────────────────────

    /** Translates a stadium broadcast announcement into EN/ES/FR via Gemini. */
    async function handleBroadcastTranslation() {
        const text = sanitizeInput(document.getElementById('broadcastRawText').value);
        if (!text) return;

        const btn = document.getElementById('translateBroadcastBtn');
        btn.disabled = true;
        btn.textContent = 'Translating…';

        const PROMPT = `Translate this stadium announcement into ES (Spanish) and FR (French).
Output ONLY JSON: { "en": "...", "es": "...", "fr": "..." }
Announcement: "${text}"`;

        try {
            const result = appState.apiKey
                ? JSON.parse((raw => raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1))(await callGemini(PROMPT)))
                : (await new Promise(r => setTimeout(r, 900)), simulateTranslation(text));

            setText('transEn', result.en);
            setText('transEs', result.es);
            setText('transFr', result.fr);
            document.getElementById('broadcastTranslationsPanel').classList.remove('hidden');

            const ticker = document.getElementById('tickerContent');
            if (ticker) {
                ticker.textContent = `[EN]: ${result.en} | [ES]: ${result.es} | [FR]: ${result.fr}`;
                ticker.style.animation = 'none';
                ticker.getBoundingClientRect();
                ticker.style.animation = null;
            }
            speakText(result.en);
        } catch (err) {
            handleError('Broadcast Translation', err);
        } finally {
            btn.disabled = false;
            btn.textContent = '';
            btn.appendChild(createIcon('globe'));
            btn.appendChild(document.createTextNode(' GenAI Auto-Translate & Broadcast'));
            refreshIcons();
        }
    }

    /**
     * Returns simulated translation results offline.
     * @param {string} text - English announcement.
     * @returns {object} Multilingual translation object.
     */
    function simulateTranslation(text) {
        const t = text.toLowerCase();
        if (t.includes('gate b') && t.includes('busy')) return { en: text, es: 'La Puerta B está ocupada. Use la Puerta A o D para un ingreso más rápido.', fr: 'La porte B est occupée. Utilisez la porte A ou D pour une entrée plus rapide.' };
        if (t.includes('welcome')) return { en: text, es: '¡Bienvenidos al Estadio MetLife para la Copa Mundial FIFA 2026!', fr: 'Bienvenue au MetLife Stadium pour la Coupe du Monde FIFA 2026!' };
        return { en: text, es: `[ES] ${text}`, fr: `[FR] ${text}` };
    }

})(); // End IIFE PitchPulseApp
