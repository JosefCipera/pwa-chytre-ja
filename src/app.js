import * as Auth from "./utils/auth.js";

const outputElement = document.getElementById('output');
let isDefaultTextVisible = true;
let recording = false;
let currentNotificationIndex = 0;
let notificationTimeout;

// Funkce pro zobrazení výchozího textu
function showDefaultText() {
    outputElement.textContent = 'Řekněte příkaz...';
    outputElement.className = 'default-text';
    outputElement.style.display = 'flex';
    isDefaultTextVisible = true;
}

// Funkce pro zobrazení notifikace
function showNotification(notification) {
    clearTimeout(notificationTimeout);
    outputElement.textContent = notification.message;
    outputElement.className = '';

    const severityClass = notification.severity ? `notification-${notification.severity}` : 'notification-normal';
    outputElement.classList.add(severityClass);

    if (notification.severity === 'ok' || notification.severity === 'informative') {
        outputElement.classList.add('fade-out');
        notificationTimeout = setTimeout(() => {
            outputElement.textContent = '';
            outputElement.className = '';
            outputElement.style.display = 'none';
            showDefaultText();
        }, notification.duration || 3000);
    } else if (notification.severity === 'urgent' || notification.severity === 'warning') {
        outputElement.classList.add('blink');
        notificationTimeout = setTimeout(() => {
            outputElement.classList.remove('blink');
            outputElement.className = '';
            outputElement.style.display = 'none';
            showDefaultText();
        }, notification.duration || 3000);
    }

    isDefaultTextVisible = false;
}

// Registrace Service Workeru
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js")
        .then(() => console.log("Service Worker zaregistrován!"))
        .catch((err) => console.log("Service Worker error:", err));
}

// Kontrola podpory SpeechRecognition
if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
    console.error('❌ Hlasové rozpoznávání není podporováno.');
    alert('Hlasové rozpoznávání není podporováno. Zkuste to v Chrome nebo na jiném zařízení.');
    document.getElementById('start-speech').disabled = true;
    throw new Error('SpeechRecognition not supported');
}

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'cs-CZ';
recognition.interimResults = false;
recognition.continuous = false;

let isProcessing = false;
let latestRequestTimestamp = 0;

recognition.onerror = (event) => {
    console.error('❌ Chyba při hlasovém rozpoznávání:', event.error);
    alert(`Chyba při rozpoznávání hlasu: ${event.error}. Zkontrolujte povolení mikrofonu.`);
    document.querySelector('.microphone-container').classList.remove('recording');
    isProcessing = false;
    showDefaultText();
};

recognition.onend = () => {
    console.log('🔇 Hlasové rozpoznávání ukončeno.');
    const micContainer = document.querySelector('.microphone-container');
    micContainer.classList.remove('recording');
    const micIcon = document.getElementById('microphoneIcon');
    if (micIcon) {
        micIcon.classList.remove('pulsate');
        micIcon.style.opacity = '1';
        if (defaultMicIconSrc) {
            micIcon.src = defaultMicIconSrc;
        }
    }
    isProcessing = false;
    if (isDefaultTextVisible) {
        showDefaultText();
    }
};

const beepSound = new Audio('beep.mp3');
const defaultMicIconSrc = document.getElementById('microphoneIcon')?.src || '';

document.getElementById('start-speech').addEventListener('click', () => {
    if (isProcessing) {
        console.log('⏳ Jiný požadavek se již zpracovává. Počkejte prosím.');
        return;
    }
    console.log('🎤 Poklep na mikrofon – spouštím hlasové rozpoznávání...');
    if (!recognition) {
        console.error('❌ SpeechRecognition není inicializováno.');
        alert('Hlasové rozpoznávání není k dispozici. Zkuste obnovit stránku nebo zkontrolovat prohlížeč.');
        return;
    }
    recognition.start();
    const micContainer = document.querySelector('.microphone-container');
    micContainer.classList.add('recording');
    console.log('🎙️ Třída .recording přidána na .microphone-container'); // Debug log
    isProcessing = true;

    const micIcon = document.getElementById('microphoneIcon');
    const recordingIconSrc = 'images/microphone-recording.png';

    recognition.onstart = function () {
        recording = true;
        if (micIcon && recordingIconSrc) {
            micIcon.src = recordingIconSrc;
        }
        if (micIcon) {
            micIcon.classList.add('pulsate');
        }
        try {
            beepSound.play();
        } catch (err) {
            console.log("Nepodařilo se přehrát zvuk: " + err);
        }
    };

    recognition.onspeechend = function () {
        try {
            beepSound.play();
        } catch (err) {
            console.log("Nepodařilo se přehrát zvuk na konci: " + err);
        }
        recognition.stop();
        recording = false;
        resetMicIcon();
    };
});

recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.trim().toLowerCase();
    console.log(`🎙️ Rozpoznaný příkaz: ${command}`);
    document.getElementById('output').innerText = `Rozpoznáno: ${command}`;
    recognition.stop();
    handleCommand(command);
};

const startSpeech = document.getElementById('start-speech');
const output = document.getElementById('output');

function setWebhookUrl() {
    const webhookUrl = document.getElementById('webhook-url').value;
    const webhookSetup = document.getElementById('webhook-setup');
    const changeWebhook = document.getElementById('change-webhook');

    if (webhookUrl) {
        localStorage.setItem('webhookUrl', webhookUrl);
        output.innerText = 'Webhook URL nastaven: ' + webhookUrl;
        webhookSetup.style.display = 'none';
        changeWebhook.style.display = 'block';
        showDefaultText();
    } else {
        output.innerText = '⚠️ Zadejte platnou URL.';
        showDefaultText();
    }
}

function showWebhookSetup() {
    const webhookSetup = document.getElementById('webhook-setup');
    const changeWebhook = document.getElementById('change-webhook');
    console.log('📢 Zobrazuji webhook setup...');
    webhookSetup.style.display = 'flex';
    changeWebhook.style.display = 'none';
    document.getElementById('webhook-url').value = localStorage.getItem('webhookUrl') || '';
}

async function handleCommand(command) {
    const webhookUrl = localStorage.getItem('webhookUrl') || '';
    const output = document.getElementById('output');
    if (!webhookUrl) {
        output.innerText = '⚠️ Nastavte webhook URL.';
        console.error('Webhook URL není nastaven');
        resetMicIcon();
        showDefaultText();
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
            output.innerText = `Příkaz '${command}' zpracován, žádná akce.`;
            resetMicIcon();
            showDefaultText();
            return;
        }

        try {
            const result = JSON.parse(text);
            console.log("✅ Zpracovaná odpověď (JSON):", result);
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
            if (Array.isArray(result.url)) {
                console.log("📋 Seznam URL detekován:", result.url);
                output.innerText = `Nalezeno více URL: ${result.url.join(', ')}`;
            } else if (typeof result.url === "string" && result.url) {
                console.log("🚀 Přesměrování na jednu URL:", result.url);
                output.innerText = `Přesměrování na ${result.url}...`;
                window.location.href = result.url;
            } else {
                console.log("ℹ️ Žádná platná URL v odpovědi:", result);
                output.innerText = `Příkaz '${command}' zpracován, žádná akce.`;
            }
        } catch (error) {
            console.error("❌ Chyba při parsování JSON odpovědi:", error, "Odpověď:", text);
            output.innerText = "⚠️ Chyba při zpracování odpovědi.";
        }
    } catch (error) {
        console.error("❌ Chyba při připojení k Make:", error);
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

document.addEventListener('DOMContentLoaded', () => {
    const webhookSetup = document.getElementById('webhook-setup');
    const changeWebhook = document.getElementById('change-webhook');
    const setWebhookButton = document.getElementById('set-webhook-button');

    if (localStorage.getItem('webhookUrl')) {
        webhookSetup.style.display = 'none';
        changeWebhook.style.display = 'block';
        console.log('🔗 Webhook URL je nastaven – zobrazuji tlačítko "Změnit URL"');
    } else {
        webhookSetup.style.display = 'flex';
        changeWebhook.style.display = 'none';
        console.log('🔗 Webhook URL není nastaven – zobrazuji sekci pro nastavení URL');
    }

    setWebhookButton.addEventListener('click', setWebhookUrl);
    changeWebhook.addEventListener('click', () => {
        console.log('🔄 Kliknuto na Změnit URL');
        showWebhookSetup();
    });

    showDefaultText();
});

function displayContent(url) {
    const output = document.getElementById('output');
    output.innerText = `Načítám obsah: ${url}`;

    if (!url || typeof url !== 'string') {
        output.innerHTML = '<span class="status">Soubor nenalezen</span><br><span class="hint">Řekněte příkaz, např. "Zobraz vytížení", "Přehrát video školení", nebo "Spusť audio návod".</span>';
        return;
    }

    if (url.includes('.mp3') || url.includes('.wav') || url.includes('podcasty.seznam.cz')) {
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = url;
        audio.onerror = () => {
            output.innerHTML = '<span class="status">Soubor nenalezen</span><br><span class="hint">Řekněte příkaz, např. "Zobraz vytížení", "Přehrát video školení", nebo "Spusť audio návod".</span>';
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
                output.innerHTML = '<span class="status">Soubor nenalezen</span><br><span class="hint">Řekněte příkaz, např. "Zobraz vytížení", "Přehrát video školení", nebo "Spusť audio návod".</span>';
            };
            output.innerHTML = '';
            output.appendChild(mediaElement);
        } else {
            output.innerHTML = '<span class="status">Soubor nenalezen</span><br><span class="hint">Řekněte příkaz, např. "Zobraz vytížení", "Přehrát video školení", nebo "Spusť audio návod".</span>';
        }
    } else if (url.includes('.pdf') || url.includes('.xls') || url.includes('.xlsx') || url.includes('.ppt') || url.includes('.pptx') || url.includes('.doc') || url.includes('.docx')) {
        const iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = '500px';
        iframe.src = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
        iframe.onerror = () => {
            output.innerHTML = '<span class="status">Soubor nenalezen</span><br><span class="hint">Řekněte příkaz, např. "Zobraz vytížení", "Přehrát video školení", nebo "Spusť audio návod".</span>';
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
        duration: duration || 5000
    };
    showNotification(newNotification);
}