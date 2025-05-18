import * as Auth from "./utils/auth.js";
import { NOTIFICATIONS } from "./utils/notifications.js";
import { GOOGLE_SHEETS_API_KEY, GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SHEETS_LIST_NAME } from './utils/config.js';

const outputElement = document.getElementById('output');
let outputTextElement;
let isDefaultTextVisible = true;
let recording = false;
let currentNotificationIndex = 0;
let notificationTimeout;
let defaultMicIconSrc;

async function loadWebhook() {
    let webhookUrl = localStorage.getItem('webhookUrl');
    if (!webhookUrl) {
        try {
            const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/${GOOGLE_SHEETS_LIST_NAME}!A:B?key=${GOOGLE_SHEETS_API_KEY}`);
            const data = await response.json();
            const webhookRow = data.values.find(row => row[0] === "Webhook");
            if (!webhookRow || !webhookRow[1]) {
                throw new Error("Webhook URL nenalezeno v tabulce");
            }
            webhookUrl = webhookRow[1];
            localStorage.setItem('webhookUrl', webhookUrl);
            showNotification({
                message: "Webhook úspěšně nastaven.",
                severity: "ok",
                duration: 4000
            });
        } catch (error) {
            console.error("❌ Chyba při načítání webhooku:", error);
            showNotification({
                message: "Webhook není k dispozici, kontaktujte správce.",
                severity: "ok",
                duration: 6000
            });
            return null;
        }
    }
    return webhookUrl;
}

let WEBHOOK_URL;
(async () => {
    WEBHOOK_URL = await loadWebhook();
    if (!WEBHOOK_URL) {
        console.error("🔗 Webhook není nastaven, apka nemůže pokračovat.");
        return;
    }
    console.log("🔗 Webhook URL načten:", WEBHOOK_URL);
})();

// SpeechRecognition API
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'cs-CZ';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

recognition.onresult = (event) => {
    const command = event.results[0][0].transcript;
    processCommand(command);
};

recognition.onerror = (event) => {
    console.error("❌ Chyba při rozpoznávání hlasu:", event.error);
    showMessage("Chyba při rozpoznávání hlasu. Zkuste to znovu.");
};

function startListening() {
    recognition.start();
    console.log("🎙️ Poslech spuštěn...");
}

function stopListening() {
    recognition.stop();
    console.log("🎙️ Poslech zastaven.");
}

function processCommand(command) {
    console.log("🎙️ Rozpoznaný příkaz:", command);

    if (!command || typeof command !== 'string' || command.trim() === '') {
        console.error("❌ Nevalidní příkaz:", command);
        showMessage("Příkaz není platný. Zkuste to znovu.");
        return;
    }

    const normalizedCommand = command.trim();
    const payload = { command: normalizedCommand };
    console.log("📤 Odesílaná data na Make.com:", payload);

    fetch('https://hook.eu1.make.com/4jibyt5oj7j96mnuaiow2mnofgpfhomo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`❌ Chyba HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("✅ Odpověď od Make.com:", data);

            const { response_type, response_data } = data;

            if (response_type && response_data) {
                // Podporované typy médií
                const supportedTypes = ["audio", "video", "url", "document", "gif", "excel", "pdf"];
                if (supportedTypes.includes(response_type)) {
                    const encodedUrl = encodeURIComponent(response_data);
                    window.location.href = `media-results.html?type=${response_type}&url=${encodedUrl}`;
                } else if (response_type === "notification") {
                    showNotification(response_data); // Zpracování notifikace
                } else if (normalizedCommand.includes("vypni mikrofon")) {
                    stopListening();
                } else if (normalizedCommand.includes("zapni mikrofon")) {
                    startListening();
                } else {
                    showMessage("Nerozpoznaný typ odpovědi. Zkuste to znovu.");
                }
            } else {
                showMessage("Odpověď od Make.com není úplná. Zkuste to znovu.");
            }
        })
        .catch(error => {
            console.error(error);
            showMessage("Chyba při zpracování příkazu. Zkuste to znovu.");
        });
}

function showMessage(message) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    setTimeout(() => {
        messageDiv.textContent = '';
    }, 3000);
}

function showNotification(notification) {
    clearTimeout(notificationTimeout);

    const severityClass = notification.severity ? `notification-${notification.severity}` : 'notification-normal';
    const totalDuration = notification.duration || 8000;
    const fadeOutStart = totalDuration - 2000;

    outputElement.classList.remove('visible');
    outputElement.classList.add('hidden');

    outputTextElement.textContent = notification.message;
    outputElement.className = severityClass;

    if (notification.severity === 'urgent' || notification.severity === 'warning') {
        outputElement.classList.add('blink');
    }

    outputElement.classList.remove('hidden');
    outputElement.classList.add('visible');

    setTimeout(() => {
        outputElement.classList.remove('visible');
        outputElement.classList.add('fade-out');
    }, fadeOutStart);

    notificationTimeout = setTimeout(() => {
        outputElement.classList.remove('blink', 'fade-out', 'visible');
        outputTextElement.textContent = '';
        setTimeout(() => {
            showDefaultText();
        }, 100);
    }, totalDuration);

    isDefaultTextVisible = false;
}

function showDefaultText() {
    outputElement.classList.remove('visible');
    outputElement.classList.add('hidden');

    outputTextElement.textContent = 'Řekněte v app příkaz, např. "Zobraz vytížení", "Přehrát video školení", nebo "Spusť audio návod".';
    outputElement.className = 'default-text';

    outputElement.classList.remove('hidden');
    outputElement.classList.add('visible');

    isDefaultTextVisible = true;
}

if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
    console.error('❌ Hlasové rozpoznávání není podporováno.');
    alert('Hlasové rozpoznávání není podporováno. Zkuste to v Chrome nebo na jiném zařízení.');
    throw new Error('SpeechRecognition not supported');
}

let isProcessing = false;
let latestRequestTimestamp = 0;

const isMobile = /Mobi|Android/i.test(navigator.userAgent);

recognition.onerror = (event) => {
    console.error('❌ Chyba při hlasovém rozpoznávání:', event.error);
    alert(`Chyba při rozpoznávání hlasu: ${event.error}. Zkontrolujte povolení mikrofonu.`);
    document.querySelector('.microphone-container').classList.remove('recording');
    isProcessing = false;
    showDefaultText();
};

recognition.onend = () => {
    console.log('🔇 Hlasové rozpoznávání ukončeno.');
    if (isDefaultTextVisible) {
        showDefaultText();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    outputTextElement = outputElement.querySelector('.output-text');
    if (!outputTextElement) {
        console.error('❌ Prvek .output-text nebyl nalezen.');
        return;
    }

    const micIcon = document.getElementById('microphoneIcon');
    defaultMicIconSrc = micIcon?.src || '';
    if (!micIcon) {
        console.error('❌ Prvek #microphoneIcon nebyl nalezen.');
        return;
    }

    micIcon.addEventListener('click', () => {
        console.log('🎤 Klik na mikrofon detekován!');
        if (isProcessing) {
            console.log('⏳ Jiný požadavek se již zpracovává. Počkejte prosím.');
            return;
        }
        console.log('🎤 Spouštím hlasové rozpoznávání...');
        if (!recognition) {
            console.error('❌ SpeechRecognition není inicializováno.');
            alert('Hlasové rozpoznávání není k dispozici. Zkuste obnovit stránku nebo zkontrolovat prohlížeč.');
            return;
        }
        recognition.start();
        const micContainer = document.querySelector('.microphone-container');
        micContainer.classList.add('recording');
        console.log('🎙️ Třída .recording přidána na .microphone-container');
        isProcessing = true;

        const recordingIconSrc = 'images/microphone-transparent-192.png';

        recognition.onstart = function () {
            recording = true;
            if (micIcon && recordingIconSrc) {
                micIcon.src = recordingIconSrc;
            }
            if (micIcon) {
                micIcon.classList.add('pulsate');
            }
        };

        recognition.onspeechend = function () {
            recognition.stop();
            recording = false;
        };
    });

    console.log('✅ Event listener pro mikrofon byl přiřazen.');
    showDefaultText();
});

recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.trim().toLowerCase();
    console.log(`🎙️ Rozpoznaný příkaz: ${command}`);
    outputTextElement.textContent = `Rozpoznáno: ${command}`;
    recognition.stop();
    handleCommand(command);
};

async function handleCommand(command) {
    const webhookUrl = localStorage.getItem('webhookUrl') || '';
    const output = document.getElementById('output');
    if (!webhookUrl) {
        output.style.display = 'flex';
        output.innerText = '⚠️ Nastavte webhook URL.';
        console.error('Webhook URL není nastaven');
        resetMicIcon();
        return;
    }

    if (command.toLowerCase().includes("kontrola dat")) {
        // ... (existující logika pro kontrolu dat) ...
        return;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: command })
        });

        const text = await response.text();
        console.log("📜 Surová odpověď:", text);

        if (!text) {
            console.log("ℹ️ Žádná odpověď z Make (např. notification).");
            output.style.display = 'flex';
            output.innerText = `Příkaz '${command}' zpracován, žádná akce.`;
            resetMicIcon();
            return;
        }

        let result;
        try {
            result = JSON.parse(text);
            console.log("✅ Zpracovaná odpověď (JSON):", result);
        } catch (error) {
            console.error("❌ Chyba při parsování JSON odpovědi:", error, "Odpověď:", text);
            output.style.display = 'flex';
            output.innerText = `⚠️ Server vrátil chybu: ${text}`;
            resetMicIcon();
            return;
        }

        if (result.response_type === "notification" && result.response_data) {
            showNotification(result.response_data);
            resetMicIcon();
            return;
        }

        if (result.message) {
            console.log("🔔 Notifikace detekována:", result.message);
            showNotification({
                message: result.message,
                severity: result.severity || "normal",
                duration: result.duration || 3000
            });
            resetMicIcon();
            return;
        }

        const url = result.response_data;
        if (result.response_type === "url" && Array.isArray(url)) {
            console.log("📋 Seznam URL detekován:", url);
            output.style.display = 'flex';
            output.innerText = `Nalezeno více URL: ${url.join(', ')}`;
        } else if (result.response_type === "url" && typeof url === "string" && url) {
            console.log("🚀 Přesměrování na jednu URL:", url);
            output.style.display = 'flex';
            output.innerText = `Přesměrování na ${url}...`;
            if (url.includes("lookerstudio.google.com")) {
                window.location.href = `looker-results.html?reportUrl=${encodeURIComponent(url)}`;
            } else {
                window.location.href = url;
            }
        } else if (result.response_type === "audio" || result.response_type === "video") {
            console.log("🎥 Detekován mediální obsah:", url);
            window.location.href = `media-results.html?mediaUrl=${encodeURIComponent(url)}`;
        } else {
            console.log("ℹ️ Neznámý typ odpovědi nebo chybějící URL:", result);
            output.style.display = 'flex';
            output.innerText = `Příkaz '${command}' nebyl rozpoznán serverem. Zkuste jiný příkaz.`;
        }
    } catch (error) {
        console.error("❌ Chyba při připojení k Make:", error);
        output.style.display = 'flex';
        output.innerText = "⚠️ Chyba při připojení k Make.";
    } finally {
        resetMicIcon();
    }
}

function resetMicIcon() {
    const micContainer = document.querySelector('.microphone-container');
    const micIcon = document.getElementById('microphoneIcon');
    if (micContainer) {
        micContainer.classList.remove('recording');
        console.log('🎙️ Třída .recording odebrána z .microphone-container');
    }
    if (micIcon) {
        micIcon.classList.remove('recording', 'pulsate');
        micIcon.style.opacity = '1 !important';
        if (defaultMicIconSrc) {
            micIcon.src = defaultMicIconSrc;
        }
    }
    recording = false;
    isProcessing = false;
}

function displayContent(url) {
    const output = document.getElementById('output');
    const outputText = output.querySelector('.output-text');
    outputText.textContent = `Načítám obsah: ${url}`;

    if (!url || typeof url !== 'string') {
        output.innerHTML = '<span class="output-text"><span class="status">Soubor nenalezen</span><br><span class="hint">Řekněte příkaz, např. "Zobraz vytížení", "Přehrát video školení", nebo "Spusť audio návod".</span></span>';
        return;
    }

    if (url.includes('.mp3') || url.includes('.wav') || url.includes('podcasty.seznam.cz')) {
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = url;
        audio.onerror = () => {
            output.innerHTML = '<span class="output-text"><span class="status">Soubor nenalezen</span><br><span class="hint">Řekněte příkaz, např. "Zobraz vytížení", "Přehrát video školení", nebo "Spusť audio návod".</span></span>';
        };
        audio.onloadedmetadata = () => {
            output.innerHTML = '';
            output.appendChild(audio);
        };
        output.innerHTML = '';
    } else if (url.includes('youtube.com') || url.includes('vimeo.com') || url.includes('.mp4') || url.includes('.webm')) {
        let mediaElement;
        if (url.includes('youtube.com')) {
            const youtubeId = new URL(url).searchParams.get('v') || url.split('v=')[1]?.split('&')[0];
            if (youtubeId) {
                mediaElement = document.createElement('iframe');
                mediaElement.width = window.innerWidth > 768 ? '533' : '100%';
                mediaElement.height = window.innerWidth > 768 ? '300' : '400';
                mediaElement.style.width = '533px !important';
                mediaElement.style.height = window.innerWidth > 768 ? '300px !important' : '400px !important';
                mediaElement.style.objectFit = window.innerWidth > 768 ? 'cover' : 'contain';
                mediaElement.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&enablejsapi=1`;
                mediaElement.allow = 'autoplay; encrypted-media; fullscreen';
                mediaElement.allowFullscreen = true;
                mediaElement.onload = () => {
                    if (window.YT && window.YT.Player) {
                        new window.YT.Player(mediaElement, {
                            events: {
                                'onReady': function (event) {
                                    event.target.setSize(
                                        window.innerWidth > 768 ? 533 : 100,
                                        window.innerWidth > 768 ? 300 : 400
                                    );
                                }
                            }
                        });
                    }
                };
            }
        } else if (url.includes('vimeo.com')) {
            const vimeoId = url.split('/').pop();
            if (vimeoId) {
                mediaElement = document.createElement('iframe');
                mediaElement.width = window.innerWidth > 768 ? '533' : '100%';
                mediaElement.height = window.innerWidth > 768 ? '300' : '400';
                mediaElement.style.width = '533px !important';
                mediaElement.style.height = window.innerWidth > 768 ? '300px !important' : '400px !important';
                mediaElement.style.objectFit = window.innerWidth > 768 ? 'cover' : 'contain';
                mediaElement.src = `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
                mediaElement.allow = 'autoplay; encrypted-media; fullscreen';
                mediaElement.allowFullscreen = true;
            }
        } else {
            mediaElement = document.createElement('video');
            mediaElement.controls = true;
            mediaElement.width = window.innerWidth > 768 ? 533 : '100%';
            mediaElement.height = window.innerWidth > 768 ? 300 : '400';
            mediaElement.style.width = '533px !important';
            mediaElement.style.height = window.innerWidth > 768 ? '300px !important' : '400px !important';
            mediaElement.style.objectFit = window.innerWidth > 768 ? 'cover' : 'contain';
            mediaElement.src = url;
            mediaElement.autoplay = true;
        }
        if (mediaElement) {
            mediaElement.onerror = () => {
                output.innerHTML = '<span class="output-text"><span class="status">Soubor nenalezen</span><br><span class="hint">Řekněte příkaz, např. "Zobraz vytížení", "Přehrát video školení", nebo "Spusť audio návod".</span></span>';
            };
            output.innerHTML = '';
            output.appendChild(mediaElement);
        } else {
            output.innerHTML = '<span class="output-text"><span class="status">Soubor nenalezen</span><br><span class="hint">Řekněte příkaz, např. "Zobraz vytížení", "Přehrát video školení", nebo "Spusť audio návod".</span></span>';
        }
    } else if (url.includes('.pdf') || url.includes('.xls') || url.includes('.xlsx') || url.includes('.ppt') || url.includes('.pptx') || url.includes('.doc') || url.includes('.docx')) {
        const iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = '500px';
        iframe.src = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
        iframe.onerror = () => {
            output.innerHTML = '<span class="output-text"><span class="status">Soubor nenalezen</span><br><span class="hint">Řekněte příkaz, např. "Zobraz vytížení", "Přehrát video školení", nebo "Spusť audio návod".</span></span>';
        };
        output.innerHTML = '';
        output.appendChild(iframe);
    } else if (url.includes('app.tabidoo.cloud/public-dashboard') || url.includes('public') || url.includes('dashboard')) {
        window.location.href = url;
    } else {
        window.location.href = url;
    }
}

window.getAccessToken = Auth.getAccessToken;

window.onload = () => {
    console.log("🔄 Čekám na načtení Google Identity Services...");
    Auth.initGoogleAuth();
};

function showNotificationFromMake(message, severity, duration) {
    const newNotification = {
        message: message,
        severity: severity,
        duration: duration || 8000
    };
    showNotification(newNotification);
}