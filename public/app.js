/**
 * PitchPulse AI - Core Application Script
 * Enhanced for Code Quality, Security, Accessibility, and Alignment.
 */

// State Management
const appState = {
    currentTab: 'dashboard',
    apiKey: localStorage.getItem('gemini_api_key') || '',
    model: localStorage.getItem('gemini_model') || 'gemini-1.5-flash',
    theme: localStorage.getItem('pitchpulse_theme') || 'dark',
    userXP: parseInt(localStorage.getItem('eco_xp')) || 120,
    userLevel: parseInt(localStorage.getItem('eco_level')) || 1,
    incidents: [
        { id: 1, location: 'Gate B (Turnstile 3)', time: '10 mins ago', desc: 'Turnstile 3 scanner lag. IT Support dispatched. Replaced sensor.', status: 'resolved' },
        { id: 2, location: 'Section 104 Food Aisle', time: '2 mins ago', desc: 'High crowd density at hotdog stand bottleneck. Marshalling volunteers.', status: 'pending' }
    ]
};

// Map Coordinates for pathfinding
const nodeCoordinates = {
    'gate-a': { x: 400, y: 50 },
    'gate-b': { x: 750, y: 300 },
    'gate-c': { x: 400, y: 550 },
    'gate-d': { x: 50, y: 300 },
    'block-101': { x: 400, y: 150 },
    'block-102': { x: 150, y: 300 },
    'block-103': { x: 400, y: 450 },
    'block-104': { x: 650, y: 300 },
    'node-restrooms': { x: 235, y: 255 },
    'node-concessions': { x: 565, y: 345 },
    'node-firstaid': { x: 235, y: 345 },
    'node-recycle': { x: 565, y: 255 }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTabNavigation();
    initTelemetryChart();
    initSpeechAPI();
    initMapInteractions();
    initFormsAndButtons();
    updateEcoDisplay();
    renderIncidentLogs();
    
    // Lucide Icons Render
    if (window.lucide) {
        window.lucide.createIcons();
    }
});

/**
 * Initializes the default theme on body class lists.
 */
function initTheme() {
    document.body.className = `${appState.theme}-theme`;
    document.getElementById('themeSelect').value = appState.theme;
}

/**
 * Updates the theme class on the document body.
 * @param {string} theme - The theme string (light, dark, neon).
 */
function setTheme(theme) {
    appState.theme = theme;
    document.body.className = `${theme}-theme`;
    localStorage.setItem('pitchpulse_theme', theme);
}

/**
 * Initializes tab elements and triggers initial state routers.
 */
function initTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    document.getElementById('goToBuddyBtn').addEventListener('click', () => switchTab('assistant'));
}

/**
 * Routes view layouts and updates header metadata dynamically.
 * @param {string} tabId - Selected section identifier.
 */
function switchTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(nav => {
        if (nav.getAttribute('data-tab') === tabId) {
            nav.classList.add('active');
        } else {
            nav.classList.remove('active');
        }
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
        if (pane.id === `tab-${tabId}`) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });

    const pageTitle = document.getElementById('pageTitle');
    const pageSubTitle = document.getElementById('pageSubTitle');

    const headers = {
        'dashboard': { title: 'Stadium Dashboard', sub: 'Real-time crowd flows and wait-times' },
        'assistant': { title: 'AI Stadium Buddy', sub: 'Generative AI helper for World Cup visitors' },
        'navigation': { title: 'Interactive Stadium Map', sub: 'Custom wayfinding and accessibility paths' },
        'sustainability': { title: 'Sustainability Hub', sub: 'Log eco-friendly actions and earn rewards' },
        'operations': { title: 'Operations Control Center', sub: 'Real-time telemetry, dispatcher, and broadcast console' }
    };

    if (headers[tabId]) {
        pageTitle.textContent = headers[tabId].title;
        pageSubTitle.textContent = headers[tabId].sub;
    }

    appState.currentTab = tabId;
}

// Telemetry Simulation (Chart.js)
let telemetryChart;

/**
 * Renders telemetry chart and schedules random flows fluctuations.
 */
function initTelemetryChart() {
    const canvas = document.getElementById('telemetryChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (window.Chart) {
        telemetryChart = new window.Chart(ctx, {
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
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
                    }
                }
            }
        });
    }

    // Dynamic updates
    setInterval(() => {
        if (!telemetryChart) return;
        
        const now = new Date();
        const label = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const currentData = telemetryChart.data.datasets[0].data;
        const lastValue = currentData[currentData.length - 1];
        const change = Math.floor(Math.random() * 60) - 30;
        const newValue = Math.max(100, Math.min(600, lastValue + change));

        telemetryChart.data.labels.shift();
        telemetryChart.data.labels.push(label);
        
        telemetryChart.data.datasets[0].data.shift();
        telemetryChart.data.datasets[0].data.push(newValue);
        
        telemetryChart.update();

        // Secure DOM injection for entryRateVal (no innerHTML)
        const entryRateElem = document.getElementById('entryRateVal');
        if (entryRateElem) {
            entryRateElem.textContent = `${newValue} `;
            const span = document.createElement('span');
            span.className = 'unit';
            span.textContent = '/min';
            entryRateElem.appendChild(span);
        }
    }, 10000);
}

// Speech Recognition & Text-to-Speech API
let recognition;
let synth;

/**
 * Initializes HTML5 Web Speech engines for microphone inputs and text readouts.
 */
function initSpeechAPI() {
    synth = window.speechSynthesis;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        const voiceBtn = document.getElementById('voiceInputBtn');
        const micIcon = document.getElementById('micIcon');

        voiceBtn.addEventListener('click', () => {
            if (voiceBtn.classList.contains('listening')) {
                recognition.stop();
            } else {
                voiceBtn.classList.add('listening');
                micIcon.setAttribute('data-lucide', 'mic-off');
                if (window.lucide) window.lucide.createIcons();
                recognition.start();
            }
        });

        recognition.onresult = (event) => {
            const result = event.results[0][0].transcript;
            document.getElementById('chatInput').value = result;
            stopRecognition();
            sendChatMessage();
        };

        recognition.onerror = () => {
            stopRecognition();
        };

        recognition.onend = () => {
            stopRecognition();
        };
    } else {
        const voiceBtn = document.getElementById('voiceInputBtn');
        if (voiceBtn) voiceBtn.style.display = 'none';
    }
}

/**
 * Resets speech microphone status and renders static icons.
 */
function stopRecognition() {
    const voiceBtn = document.getElementById('voiceInputBtn');
    const micIcon = document.getElementById('micIcon');
    if (voiceBtn && voiceBtn.classList.contains('listening')) {
        voiceBtn.classList.remove('listening');
        micIcon.setAttribute('data-lucide', 'mic');
        if (window.lucide) window.lucide.createIcons();
    }
}

/**
 * Triggers browser speech synthesizer.
 * @param {string} text - Plain text announcement string.
 */
function speakText(text) {
    if (!synth || !document.getElementById('voiceSynthesisToggle').checked) return;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const langSelect = document.getElementById('chatLanguage').value;
    const langMap = { 'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE', 'pt': 'pt-PT' };
    utter.lang = langMap[langSelect] || 'en-US';
    synth.speak(utter);
}

// Stadium Map & Pathway Drawing
/**
 * Configures event listeners, mouse clicks, and keyboard inputs on SVG nodes.
 */
function initMapInteractions() {
    const svg = document.getElementById('stadiumSvg');
    if (!svg) return;
    const svgNodes = svg.querySelectorAll('.gate-node, .seat-block, .poi-node');

    // Click triggers routing path
    svgNodes.forEach(node => {
        const clickHandler = () => {
            const nodeId = node.id;
            const nodeName = node.getAttribute('data-name');
            
            const routeStart = document.getElementById('routeStart');
            const routeEnd = document.getElementById('routeEnd');

            if (nodeId.includes('gate')) {
                routeStart.value = nodeId;
                svg.querySelectorAll('.gate-node').forEach(g => g.classList.remove('selected'));
                node.classList.add('selected');
            } else {
                routeEnd.value = nodeId;
                svg.querySelectorAll('.seat-block, .poi-node').forEach(s => s.classList.remove('selected'));
                node.classList.add('selected');
            }
            
            // Secure text overlay update
            document.getElementById('mapOverlayInfo').textContent = `Selected: ${nodeName}`;
            calculatePath(routeStart.value, routeEnd.value);
        };

        node.addEventListener('click', clickHandler);

        // Accessibility: Keyboard Enter/Space handles
        node.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                clickHandler();
            }
        });
    });

    document.getElementById('generateRouteBtn').addEventListener('click', () => {
        const start = document.getElementById('routeStart').value;
        const end = document.getElementById('routeEnd').value;
        calculatePath(start, end);
    });

    document.getElementById('quickFindBtn').addEventListener('click', () => {
        const seat = document.getElementById('quickSeatInput').value.toLowerCase();
        switchTab('navigation');
        if (seat.includes('101') || seat.includes('north')) {
            document.getElementById('routeEnd').value = 'block-101';
        } else if (seat.includes('102') || seat.includes('west')) {
            document.getElementById('routeEnd').value = 'block-102';
        } else if (seat.includes('103') || seat.includes('south')) {
            document.getElementById('routeEnd').value = 'block-103';
        } else if (seat.includes('104') || seat.includes('east')) {
            document.getElementById('routeEnd').value = 'block-104';
        }
        calculatePath(document.getElementById('routeStart').value, document.getElementById('routeEnd').value);
    });
}

/**
 * Calculates coordinates, updates the SVG paths, and generates accessibility instructions.
 * @param {string} startId - Entry point identifier.
 * @param {string} endId - Destination point identifier.
 */
function calculatePath(startId, endId) {
    const pathElem = document.getElementById('activeNavigationPath');
    const startCoord = nodeCoordinates[startId];
    const endCoord = nodeCoordinates[endId];

    if (!startCoord || !endCoord || !pathElem) return;

    pathElem.style.animation = 'none';
    pathElem.offsetHeight; // trigger reflow
    pathElem.style.animation = null;

    const isAda = document.getElementById('accessibilityRouteToggle').checked;
    
    let pathD = '';
    let directions = [];
    let distance = 0;
    let time = 0;

    if (isAda && (startId === 'gate-d' || endId === 'block-102' || startId === 'gate-a' || endId === 'node-firstaid')) {
        const elevatorCoord = { x: 150, y: 250 };
        pathD = `M ${startCoord.x},${startCoord.y} Q ${elevatorCoord.x},${elevatorCoord.y} ${endCoord.x},${endCoord.y}`;
        directions = [
            'Proceed through the wide ADA express entry lane.',
            'Follow the tactile blue pathway indicators toward Section 102 West Tower.',
            'Take the glass elevator (Elevator W1) to Level 2 (Concourse level).',
            'Follow the dynamic illuminated ceiling guides to your seating zone / ADA platform.'
        ];
        distance = 180;
        time = 4;
    } else {
        const concourseControl = { x: (startCoord.x + endCoord.x) / 2 + 50, y: (startCoord.y + endCoord.y) / 2 - 30 };
        pathD = `M ${startCoord.x},${startCoord.y} Q ${concourseControl.x},${concourseControl.y} ${endCoord.x},${endCoord.y}`;
        
        const destName = document.getElementById('routeEnd').options[document.getElementById('routeEnd').selectedIndex].text;
        directions = [
            'Enter via Gate check-in and scan your digital match ticket.',
            'Follow the main concourse perimeter clockwise.',
            'Pass concessions and look for directional signage for: ' + destName + '.',
            'Your destination is approximately 50 meters ahead on the left.'
        ];
        distance = 290;
        time = 3;
    }

    pathElem.setAttribute('d', pathD);
    pathElem.setAttribute('stroke', isAda ? '#10b981' : '#3b82f6');

    document.getElementById('routeEstTime').textContent = `${time} mins`;
    document.getElementById('routeEstDist').textContent = `${distance}m`;
    
    const list = document.getElementById('routeStepsList');
    list.innerHTML = ''; // Safe clear
    directions.forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        list.appendChild(li);
    });

    document.getElementById('routeDetailsPanel').classList.remove('hidden');

    // Secure overlay updates (no innerHTML)
    const overlay = document.getElementById('mapOverlayInfo');
    overlay.textContent = '';
    
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', 'info');
    icon.className = 'inline-icon';
    overlay.appendChild(icon);
    
    const strong = document.createElement('strong');
    strong.textContent = ` ${time} min`;
    
    overlay.appendChild(document.createTextNode(' Route generated! Est. time: '));
    overlay.appendChild(strong);
    overlay.appendChild(document.createTextNode('.'));
    
    if (window.lucide) window.lucide.createIcons();
}

/**
 * Recomputes eco level metrics and updates progress bars.
 */
function updateEcoDisplay() {
    document.getElementById('userGreenLevel').textContent = appState.userLevel;
    document.getElementById('userGreenXp').textContent = `${appState.userXP} / ${appState.userLevel * 300} XP`;
    const percent = Math.min(100, (appState.userXP / (appState.userLevel * 300)) * 100);
    document.getElementById('xpProgressBar').style.width = `${percent}%`;

    const recyclers = document.getElementById('badgeRecycler');
    const conserve = document.getElementById('badgeConserve');
    const sodaVoucher = document.getElementById('voucherSoda');
    const discountVoucher = document.getElementById('voucherDiscount');

    if (appState.userXP >= 200) {
        recyclers.classList.add('earned');
        recyclers.classList.remove('locked');
    }
    if (appState.userXP >= 300) {
        conserve.classList.add('earned');
        conserve.classList.remove('locked');
        sodaVoucher.classList.remove('disabled');
        sodaVoucher.classList.add('unlocked');
        sodaVoucher.querySelector('p').textContent = 'Unlocked! Present at any concession for a free refill.';
    }
    if (appState.userXP >= 500) {
        discountVoucher.classList.remove('disabled');
        discountVoucher.classList.add('unlocked');
        discountVoucher.querySelector('p').textContent = 'Unlocked! Scan barcode at official FIFA shops.';
    }
}

/**
 * Binds DOM form elements, clicks, and configuration buttons.
 */
function initFormsAndButtons() {
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');

    openSettingsBtn.addEventListener('click', () => {
        document.getElementById('geminiApiKey').value = appState.apiKey;
        document.getElementById('geminiModel').value = appState.model;
        settingsModal.classList.add('open');
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('open');
    });

    saveSettingsBtn.addEventListener('click', () => {
        appState.apiKey = document.getElementById('geminiApiKey').value.trim();
        appState.model = document.getElementById('geminiModel').value;
        appState.theme = document.getElementById('themeSelect').value;
        
        localStorage.setItem('gemini_api_key', appState.apiKey);
        localStorage.setItem('gemini_model', appState.model);
        setTheme(appState.theme);
        
        settingsModal.classList.remove('open');
        alert('Configuration saved successfully!');
    });

    document.getElementById('themeToggleBtn').addEventListener('click', () => {
        const nextTheme = appState.theme === 'dark' ? 'light' : appState.theme === 'light' ? 'neon' : 'dark';
        setTheme(nextTheme);
        document.getElementById('themeSelect').value = nextTheme;
    });

    document.getElementById('refreshWaitTimesBtn').addEventListener('click', () => {
        document.querySelectorAll('.queue-item').forEach(item => {
            const minTime = item.querySelector('.queue-name').textContent.includes('Gate C') ? 15 : 2;
            const maxTime = item.querySelector('.queue-name').textContent.includes('Gate C') ? 50 : 25;
            const newTime = Math.floor(Math.random() * (maxTime - minTime)) + minTime;
            item.querySelector('.queue-time').textContent = `${newTime} mins`;
            
            const bar = item.querySelector('.queue-bar');
            let width = (newTime / maxTime) * 100;
            bar.style.width = `${width}%`;
            
            bar.className = 'queue-bar';
            const metric = item.querySelector('.queue-metric');
            if (newTime <= 10) {
                bar.classList.add('green');
                metric.className = 'queue-metric text-success';
                metric.textContent = 'Low Wait';
            } else if (newTime <= 25) {
                bar.classList.add('orange');
                metric.className = 'queue-metric text-warning';
                metric.textContent = 'Moderate Wait';
            } else {
                bar.classList.add('red');
                metric.className = 'queue-metric text-danger';
                metric.textContent = 'Heavy Wait';
            }
        });
    });

    document.getElementById('sendMessageBtn').addEventListener('click', sendChatMessage);
    document.getElementById('chatInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });

    document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('chatInput').value = btn.textContent;
            sendChatMessage();
        });
    });

    document.getElementById('sustainabilityForm').addEventListener('submit', (e) => {
        e.preventDefault();
        submitEcoAction();
    });

    document.getElementById('incidentForm').addEventListener('submit', (e) => {
        e.preventDefault();
        submitIncident();
    });

    document.getElementById('translateBroadcastBtn').addEventListener('click', handleBroadcastTranslation);
}

/**
 * Handles communication with the Google Gemini endpoint using Fetch.
 * @param {string} promptText - Constructed request text.
 * @returns {Promise<string>} Generated text content.
 */
async function callGemini(promptText) {
    if (!appState.apiKey) {
        throw new Error('No Gemini API key supplied. Falling back to simulation engine.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${appState.model}:generateContent?key=${appState.apiKey}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
        })
    });

    if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `API HTTP Error ${response.status}`);
    }

    const resJson = await response.json();
    return resJson.candidates[0].content.parts[0].text;
}

// --- GenAI Feature 1: Chat Buddy ---
/**
 * Processes message sending, loading indicator states, speech prompts, and appends outputs securely.
 */
async function sendChatMessage() {
    const inputField = document.getElementById('chatInput');
    const chatText = inputField.value.trim();
    if (!chatText) return;

    inputField.value = '';
    
    appendChatMessage('user', chatText);

    // Secure Bot Typing bubble
    const typingBubble = appendChatMessage('bot', 'Stadium Buddy is typing...');
    typingBubble.classList.add('pulse-icon');

    const lang = document.getElementById('chatLanguage').value;

    const systemContext = `
You are Stadium Buddy, the official GenAI Assistant for the FIFA World Cup 2026 at MetLife Stadium.
Here is the stadium metadata:
- Gates: Gate A (North, main train arrivals), Gate B (East, plaza, close to concessions), Gate C (South, shuttle and bus terminus), Gate D (West, dedicated accessibility entrance with elevator access).
- Transit: NJ Transit rail connects Gate A to Secaucus Junction. Coach buses terminate at Gate C. Rideshare pickup/dropoff is at Lot G (near Gate B).
- Concessions: Food stands are located in East Concourse (Section 104, offering hotdogs, tacos, halal food, and vegetarian choices).
- Restrooms: Located near all seating blocks. ADA-accessible restrooms with baby changing facilities are near Section 102 (West concourse) and Section 104.
- Sustainability: Fans get rewarded for recycling plastic bottles (PET) at green smart bins located at the Eco-Recycling Center (near Section 104). Bringing reusable flasks is encouraged (free water refilling stations at Section 101 and Section 103).

Instructions:
1. Provide a short, precise answer to the fan's query based ONLY on the metadata above.
2. If it relates to directions, offer clear walking directions.
3. Be friendly and helpful.
4. Translate the response into the language specified: Language Code: ${lang}.
`;

    try {
        let responseText = '';
        if (appState.apiKey) {
            responseText = await callGemini(`${systemContext}\n\nUser Query: ${chatText}`);
        } else {
            await new Promise(r => setTimeout(r, 1200));
            responseText = generateMockChatResponse(chatText, lang);
        }

        typingBubble.classList.remove('pulse-icon');
        typingBubble.textContent = responseText;
        speakText(responseText);
    } catch (err) {
        typingBubble.classList.remove('pulse-icon');
        typingBubble.textContent = '';
        
        const errorIcon = document.createElement('i');
        errorIcon.setAttribute('data-lucide', 'alert-triangle');
        errorIcon.className = 'text-danger';
        typingBubble.appendChild(errorIcon);
        typingBubble.appendChild(document.createTextNode(` Error: ${err.message}`));
        if (window.lucide) window.lucide.createIcons();
    }
}

/**
 * Securely constructs and appends message elements to avoid HTML injections (XSS).
 * @param {string} sender - Bubble style mapping (user or bot).
 * @param {string} text - Message content text.
 * @returns {HTMLElement} Created message bubble node.
 */
function appendChatMessage(sender, text) {
    const chatContainer = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-msg`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;
    
    msgDiv.appendChild(bubble);
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return bubble;
}

/**
 * Returns mock assistant responses when API key is missing.
 * @param {string} query - User search string.
 * @param {string} lang - Multi-language ISO tag.
 * @returns {string} Response text.
 */
function generateMockChatResponse(query, lang) {
    const q = query.toLowerCase();
    
    const responses = {
        en: {
            transit: 'To reach public transit, exit via Gate A (North) to board the NJ Transit rail shuttle directly connecting to Secaucus Junction. For regional buses, use Gate C (South).',
            wheelchair: 'MetLife Stadium is fully accessible! Wheelchair-accessible restrooms are located on all levels, including Section 102 (West Concourse) and Section 104 (East Concourse) near the accessible platforms. Elevator access is available at Gate D.',
            recycle: 'You can recycle your plastic PET bottles and cans at the smart Eco-Recycling Center near Section 104. Log this action in the Sustainability Hub to earn points toward free drink rewards!',
            food: 'Food concourses are in the East Concourse (Section 104). It features standard stadium concessions, local taco trucks, halal selections, and vegan burger stands.',
            default: "Hello! I'm Stadium Buddy. I can help with transit (rail, buses at Gate C), gates (A, B, C, D), food stands, restrooms, and green recycling initiatives. What would you like to locate?"
        },
        es: {
            transit: 'Para el transporte público, salga por la Puerta A (Norte) para el tren NJ Transit hacia Secaucus Junction. Para autobuses, use la Puerta C (Sur).',
            wheelchair: '¡El estadio es totalmente accesible! Los baños adaptados están cerca de la Sección 102 (Oeste) y Sección 104 (Este). Los ascensores están en la Puerta D.',
            recycle: 'Puede reciclar sus botellas de plástico PET en el Centro de Reciclaje Ecológico cerca de la Sección 104 y ganar puntos de recompensa en nuestra app.',
            food: 'Las opciones de comida están en el Concourse Este (Sección 104), con tacos, opciones halal y hamburguesas veganas.',
            default: '¡Hola! Soy Stadium Buddy. Puedo asistirle con transporte, accesibilidad, reciclaje y concesiones. ¿Cómo puedo ayudarle hoy?'
        },
        fr: {
            transit: 'Pour le transit, sortez par la Porte A (Nord) pour le train NJ Transit vers Secaucus Junction. Pour les bus, utilisez la Porte C (Sud).',
            wheelchair: 'Le stade est entièrement accessible! Des toilettes accessibles se trouvent près de la Section 102 (Ouest) et de la Section 104 (Est). Ascenseurs à la Porte D.',
            recycle: 'Recyclez vos bouteilles en plastique PET au Centre Éco-Recyclage près de la Section 104 pour accumuler des récompenses durables.',
            food: 'Les stands de nourriture sont situés dans le hall Est (Section 104), proposant des tacos, des repas halal et des options végétaliennes.',
            default: 'Bonjour! Je suis Stadium Buddy. Je peux vous aider avec le transport, l\'accessibilité, le recyclage et la restauration. Comment puis-je vous aider?'
        }
    };

    const dict = responses[lang] || responses['en'];

    if (q.includes('transit') || q.includes('train') || q.includes('bus') || q.includes('shuttle')) {
        return dict.transit;
    } else if (q.includes('wheelchair') || q.includes('accessible') || q.includes('ada') || q.includes('disabled') || q.includes('toilet') || q.includes('restroom')) {
        return dict.wheelchair;
    } else if (q.includes('recycle') || q.includes('green') || q.includes('bottle') || q.includes('plastic') || q.includes('eco')) {
        return dict.recycle;
    } else if (q.includes('food') || q.includes('eat') || q.includes('taco') || q.includes('drink') || q.includes('concession')) {
        return dict.food;
    }
    return dict.default;
}

// --- GenAI Feature 2: Eco Action Audit ---
/**
 * Submits descriptive actions to Gemini API for authentication, carbon checks, and XP updates.
 */
async function submitEcoAction() {
    const actionType = document.getElementById('actionType').value;
    const detail = document.getElementById('actionDetail').value.trim();
    if (!detail) return;

    const logBtn = document.getElementById('logActionBtn');
    logBtn.disabled = true;
    logBtn.textContent = 'Auditing action...';

    const systemPrompt = `
You are a green-incentive auditor for the FIFA World Cup 2026 sustainability program.
Review the following fan report of a green action (e.g. recycling, public transit).
Verify if the action seems authentic and realistic for a stadium visit.
Output strictly in JSON format with fields:
- verified: true or false (boolean)
- assessment: a short friendly message confirming the carbon saving impact, thanking the fan.
- savedCo2: number of kg of CO2 saved (estimation float between 0.1 and 3.0)
- xpGained: integer XP awarded (between 20 and 100)

Fan action category: ${actionType}
Fan description: "${detail}"
`;

    try {
        let auditResult = {};
        if (appState.apiKey) {
            const rawText = await callGemini(systemPrompt);
            const cleanJsonText = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
            auditResult = JSON.parse(cleanJsonText);
        } else {
            await new Promise(r => setTimeout(r, 1000));
            auditResult = simulateEcoAudit(actionType, detail);
        }

        if (auditResult.verified) {
            document.getElementById('auditAssessment').textContent = auditResult.assessment;
            document.getElementById('savedCo2Val').textContent = `${auditResult.savedCo2} kg`;
            document.getElementById('xpGainedVal').textContent = `${auditResult.xpGained} XP`;
            
            // Add carbon securely
            const curCarbon = parseFloat(document.getElementById('carbonSavedVal').textContent.replace(',', ''));
            const newCarbon = (curCarbon + auditResult.savedCo2).toFixed(1);
            
            const carbonSavedValElem = document.getElementById('carbonSavedVal');
            carbonSavedValElem.textContent = `${newCarbon} `;
            const span = document.createElement('span');
            span.className = 'unit';
            span.textContent = 'kg';
            carbonSavedValElem.appendChild(span);

            // Add XP
            appState.userXP += auditResult.xpGained;
            if (appState.userXP >= appState.userLevel * 300) {
                appState.userXP -= appState.userLevel * 300;
                appState.userLevel++;
                alert(`CONGRATULATIONS! You advanced to Green Champion Level ${appState.userLevel}!`);
            }
            
            localStorage.setItem('eco_xp', appState.userXP);
            localStorage.setItem('eco_level', appState.userLevel);
            updateEcoDisplay();
            
            document.getElementById('greenAuditCard').classList.remove('hidden');
        } else {
            alert('Green action audit failed. Please provide a more descriptive and realistic record of your eco-friendly action.');
        }

        document.getElementById('actionDetail').value = '';

    } catch (err) {
        alert('Eco audit service error: ' + err.message);
    } finally {
        logBtn.disabled = false;
        logBtn.textContent = '';
        
        const leafIcon = document.createElement('i');
        leafIcon.setAttribute('data-lucide', 'leaf');
        logBtn.appendChild(leafIcon);
        logBtn.appendChild(document.createTextNode(' Validate & Log Action'));
        if (window.lucide) window.lucide.createIcons();
    }
}

/**
 * Simulated Eco verification audits logic when API key is offline.
 * @param {string} type - Action categorization.
 * @param {string} text - User action explanation.
 * @returns {object} Audit payload.
 */
function simulateEcoAudit(type, text) {
    const lowercase = text.toLowerCase();
    if (lowercase.length < 8) {
        return { verified: false };
    }
    
    if (type === 'recycling') {
        return {
            verified: true,
            assessment: 'Verification Successful! Thank you for recycling your PET bottles at the Smart bin. Recycling reduces stadium municipal waste significantly.',
            savedCo2: 0.4,
            xpGained: 60
        };
    } else if (type === 'transport') {
        return {
            verified: true,
            assessment: 'Verification Successful! Rail transit produces 90% fewer carbon emissions per passenger compared to individual car trips. You are a true transit hero!',
            savedCo2: 2.1,
            xpGained: 100
        };
    } else if (type === 'reusable') {
        return {
            verified: true,
            assessment: 'Verification Successful! Refilling water flasks prevents disposable cup manufacturing footprints. Stay hydrated!',
            savedCo2: 0.6,
            xpGained: 40
        };
    }
    return {
        verified: true,
        assessment: 'Verification Successful! Small actions from millions of fans make this the greenest World Cup tournament.',
        savedCo2: 0.3,
        xpGained: 30
    };
}

// --- GenAI Feature 3: Operations Incident Commander ---
/**
 * Evaluates operational incident reports and presents AI dispatch recommendations.
 */
async function submitIncident() {
    const desc = document.getElementById('incidentDescription').value.trim();
    const loc = document.getElementById('incidentLocation').value.trim() || 'Unspecified';

    if (!desc) return;

    const submitBtn = document.getElementById('logIncidentBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Commander evaluating...';

    const systemPrompt = `
You are the GenAI Incident Commander for stadium safety & event operations at MetLife Stadium.
Review the staff incident report below and recommend resources to deploy.
Output strictly in JSON format with fields:
- severity: "LOW", "MODERATE", or "CRITICAL"
- category: e.g. "Maintenance", "Security", "Medical", "Crowd Flow"
- actionPlan: 1-2 sentence tactical action plan for dispatcher dispatching personnel.
- staffAlert: A concise alert message to broadcast to nearby stewards' terminals (max 80 chars).

Report Description: "${desc}"
`;

    try {
        let recommendation = {};
        if (appState.apiKey) {
            const rawText = await callGemini(systemPrompt);
            const cleanJsonText = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
            recommendation = JSON.parse(cleanJsonText);
        } else {
            await new Promise(r => setTimeout(r, 1200));
            recommendation = simulateIncidentCommander(desc);
        }

        // Show Dispatch Plan securely
        document.getElementById('recommendedSeverity').textContent = recommendation.severity;
        document.getElementById('recommendedSeverity').className = `badge badge-severity ${recommendation.severity.toLowerCase()}`;
        document.getElementById('recommendedCategory').textContent = recommendation.category;
        document.getElementById('recommendedActionPlan').textContent = recommendation.actionPlan;
        document.getElementById('recommendedStaffText').textContent = recommendation.staffAlert;

        document.getElementById('incidentAuditPanel').classList.remove('hidden');

        const execBtn = document.getElementById('executeDispatchBtn');
        const newExecBtn = execBtn.cloneNode(true);
        execBtn.parentNode.replaceChild(newExecBtn, execBtn);

        newExecBtn.addEventListener('click', () => {
            const newIncident = {
                id: appState.incidents.length + 1,
                location: loc,
                time: 'Just now',
                desc: desc,
                status: 'pending'
            };
            appState.incidents.unshift(newIncident);
            renderIncidentLogs();

            alert(`Resource Dispatched!\nMessage broadcasted: "${recommendation.staffAlert}"`);
            
            document.getElementById('incidentDescription').value = '';
            document.getElementById('incidentLocation').value = '';
            document.getElementById('incidentAuditPanel').classList.add('hidden');
        });

    } catch (err) {
        alert('Incident evaluation service error: ' + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '';
        
        const alertIcon = document.createElement('i');
        alertIcon.setAttribute('data-lucide', 'shield-alert');
        submitBtn.appendChild(alertIcon);
        submitBtn.appendChild(document.createTextNode(' Submit Incident to GenAI Commander'));
        if (window.lucide) window.lucide.createIcons();
    }
}

/**
 * Helper to classify incident reports when API key is offline.
 * @param {string} text - Report description.
 * @returns {object} Recommendation fields.
 */
function simulateIncidentCommander(text) {
    const t = text.toLowerCase();
    
    if (t.includes('spill') || t.includes('wet') || t.includes('leak') || t.includes('trash')) {
        return {
            severity: 'MODERATE',
            category: 'Maintenance & Safety',
            actionPlan: 'Dispatch janitorial cleanup team J-3 with hazard cones and wet-vacuum. Inspect section immediately.',
            staffAlert: 'ALERT: Wet floor maintenance needed in Section 102. Deploy wet signs.'
        };
    } else if (t.includes('fight') || t.includes('drunk') || t.includes('rowdy') || t.includes('unruly') || t.includes('crowd') || t.includes('blocked')) {
        return {
            severity: 'CRITICAL',
            category: 'Security & Crowd Control',
            actionPlan: 'Dispatch rapid-response security squad S-2 and redirect pedestrian flow using local stewards.',
            staffAlert: 'CRITICAL ALERT: Security squad S-2 deploy. Heavy crowding and bottleneck at Gate B.'
        };
    } else if (t.includes('heart') || t.includes('faint') || t.includes('breathe') || t.includes('medical') || t.includes('injured')) {
        return {
            severity: 'CRITICAL',
            category: 'Medical Emergency',
            actionPlan: 'Dispatch Red Cross response team M-1 with emergency bag and stretcher. Escort to location.',
            staffAlert: 'CRITICAL ALERT: Medical support dispatched to Row F. Assist entrance clearance.'
        };
    }
    
    return {
        severity: 'LOW',
        category: 'General Operations',
        actionPlan: 'Assign area steward to investigate location and check operational conditions. No specialist crew required.',
        staffAlert: 'OPERATIONAL ALERT: Local steward requested to inspect Row F for routine feedback.'
    };
}

/**
 * Renders operational incidents securely without innerHTML.
 */
function renderIncidentLogs() {
    const list = document.getElementById('activeIncidentsList');
    if (!list) return;
    list.textContent = ''; // Safe Clear

    appState.incidents.forEach(inc => {
        const item = document.createElement('div');
        item.className = `incident-log-item status-${inc.status}`;
        
        const meta = document.createElement('div');
        meta.className = 'log-meta';
        
        const locationSpan = document.createElement('span');
        locationSpan.className = 'log-location';
        locationSpan.textContent = inc.location;
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'log-time';
        timeSpan.textContent = inc.time;
        
        meta.appendChild(locationSpan);
        meta.appendChild(timeSpan);
        
        const descP = document.createElement('p');
        descP.className = 'log-desc';
        descP.textContent = inc.desc;
        
        const statusSpan = document.createElement('span');
        statusSpan.className = 'log-tag';
        statusSpan.textContent = inc.status === 'resolved' ? 'Resolved' : 'Active Dispatch';
        
        item.appendChild(meta);
        item.appendChild(descP);
        item.appendChild(statusSpan);
        
        list.appendChild(item);
    });
}

// --- GenAI Feature 4: Broadcast Translator ---
/**
 * Translates stadium broadcast announcements into English, Spanish, and French simultaneously.
 */
async function handleBroadcastTranslation() {
    const text = document.getElementById('broadcastRawText').value.trim();
    if (!text) return;

    const translateBtn = document.getElementById('translateBroadcastBtn');
    translateBtn.disabled = true;
    translateBtn.textContent = 'Translating broadcasts...';

    const systemPrompt = `
You are the main multilingual broadcaster for the FIFA World Cup 2026 stadium announcements.
Translate this public announcement into Spanish (ES) and French (FR). Keep it polite, clear, and professional.
Output strictly in JSON format with fields:
- en: (the original English announcement)
- es: (Spanish translation)
- fr: (French translation)

Announcement: "${text}"
`;

    try {
        let result = {};
        if (appState.apiKey) {
            const rawText = await callGemini(systemPrompt);
            const cleanJsonText = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
            result = JSON.parse(cleanJsonText);
        } else {
            await new Promise(r => setTimeout(r, 1000));
            result = simulateTranslation(text);
        }

        // Show translations securely
        document.getElementById('transEn').textContent = result.en;
        document.getElementById('transEs').textContent = result.es;
        document.getElementById('transFr').textContent = result.fr;
        
        document.getElementById('broadcastTranslationsPanel').classList.remove('hidden');

        // Broadcast to main ticker tickerContent
        const ticker = document.getElementById('tickerContent');
        if (ticker) {
            ticker.textContent = `[EN]: ${result.en} | [ES]: ${result.es} | [FR]: ${result.fr}`;
            ticker.style.animation = 'none';
            ticker.offsetHeight;
            ticker.style.animation = null;
        }

        speakText(result.en);
    } catch (err) {
        alert('Broadcast Translation failed: ' + err.message);
    } finally {
        translateBtn.disabled = false;
        translateBtn.textContent = '';
        
        const globeIcon = document.createElement('i');
        globeIcon.setAttribute('data-lucide', 'globe');
        translateBtn.appendChild(globeIcon);
        translateBtn.appendChild(document.createTextNode(' GenAI Auto-Translate & Broadcast'));
        if (window.lucide) window.lucide.createIcons();
    }
}

/**
 * Returns mock translation arrays when API key is offline.
 * @param {string} text - Draft notification text.
 * @returns {object} Translations object.
 */
function simulateTranslation(text) {
    const lowercase = text.toLowerCase();
    
    if (lowercase.includes('gate b') && lowercase.includes('busy')) {
        return {
            en: text,
            es: 'La Puerta B está ocupada actualmente. Utilice la Puerta A o D para un ingreso más rápido.',
            fr: 'La porte B est actuellement occupée. Veuillez utiliser la porte A ou D pour une entrée plus rapide.'
        };
    } else if (lowercase.includes('welcome')) {
        return {
            en: text,
            es: '¡Bienvenidos al Estadio MetLife! ¡Disfruten de los partidos de la Copa Mundial!',
            fr: 'Bienvenue au MetLife Stadium! Profitez des matchs de la Coupe du Monde!'
        };
    }

    return {
        en: text,
        es: '[Español] ' + text + ' (Traducido por IA)',
        fr: '[Français] ' + text + ' (Traduit par IA)'
    };
}
