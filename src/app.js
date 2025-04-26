import * as Auth from "./utils/auth.js";

const outputElement = document.getElementById('output');
let outputTextElement;
let isDefaultTextVisible = true;
let recording = false;
let currentNotificationIndex = 0;
let notificationTimeout;
let defaultMicIconSrc; // Inicializace přesunuta do DOMContentLoaded

// Pevně nastavená webhook URL
const WEBHOOK_URL = 'https://hook.eu1.make.com/4jibyt5oj7j96mnuaiow2mnofgpfhomo'; // Nahraďte skutečnou URL

// Funkce pro zobrazení výchozího textu
function showDefaultText() {
    outputTextElement.textContent = 'Řekněte příkaz, např. "Zobraz vytížení", "Přehrát video školení", nebo "Spusť audio návod".';
    outputElement.className = 'default-text';
    outputElement.style.display = 'block';
    isDefaultTextVisible = true;
}

// Funkce pro zobrazení notifikace
function showNotification(notification) {
    clearTimeout(notificationTimeout);
    outputTextElement.textContent = notification.message;
    outputElement.className = '';

    const severityClass = notification.severity ? `notification-${notification.severity}` : 'notification-normal';
    outputElement.classList.add(severityClass);

    if (notification.severity === 'ok' || notification.severity === 'informative') {
        outputElement.classList.add('fade-out');
        notificationTimeout = setTimeout(() => {
            outputTextElement.textContent = '';
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

// Registrace Service Workeru - zakomentováno pro testování
/*
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js")
        .then(() => console.log("Service Worker zaregistrován!"))
        .catch((err) => console.log("Service Worker error:", err));
}
*/

// Kontrola podpory SpeechRecognition
if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
    console.error('❌ Hlasové rozpoznávání není podporováno.');
    alert('Hlasové rozpoznávání není podporováno. Zkuste to v Chrome nebo na jiném zařízení.');
    throw new Error('SpeechRecognition not supported');
}

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'cs-CZ';
recognition.interimResults = false;
recognition.continuous = false;

let isProcessing = false;
let latestRequestTimestamp = 0;

// Detekce mobilního zařízení
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// Zakomentováno pro testování
// const beepSound = new Audio('beep.mp3');

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

document.addEventListener('DOMContentLoaded', () => {
    // Inicializace outputTextElement až po načtení DOM
    outputTextElement = outputElement.querySelector('.output-text');
    if (!outputTextElement) {
        console.error('❌ Prvek .output-text nebyl nalezen.');
        return;
    }

    // Inicializace defaultMicIconSrc až po načtení DOM
    const micIcon = document.getElementById('microphoneIcon');
    defaultMicIconSrc = micIcon?.src || '';
    if (!micIcon) {
        console.error('❌ Prvek #microphoneIcon nebyl nalezen.');
        return;
    }

    // Přidání event listeneru s logováním
    micIcon.addEventListener('click', () => {
        console.log('🎤 Klik na mikrofon detekován!'); // Log pro ověření
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
            // Přehrání zvuku pouze na desktopu - zakomentováno pro testování
            /*
            if (!isMobile) {
                try {
                    beepSound.play();
                } catch (err) {
                    console.log("Nepodařilo se přehrát zvuk: " + err);
                }
            }
            */
        };

        recognition.onspeechend = function () {
            // Přehrání zvuku pouze na desktopu - zakomentováno pro testování
            /*
            if (!isMobile) {
                try {
                    beepSound.play();
                } catch (err) {
                    console.log("Nepodařilo se přehrát zvuk na konci: " + err);
                }
            }
            */
            recognition.stop();
            recording = false;
            resetMicIcon();
        };
    });

    console.log('✅ Event listener pro mikrofon byl přiřazen.'); // Log pro ověření

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
    const output = document.getElementById('output');
    const outputText = output.querySelector('.output-text');
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: command })
        });

        const text = await response.text();
        console.log("📜 Surová odpověď:", text);

        if (!text) {
            console.log("ℹ️ Žádná odpověď z Make (např. notification).");
            outputText.textContent = `Příkaz '${command}' zpracován, žádná akce.`;
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
                outputText.textContent = `Nalezeno více URL: ${result.url.join(', ')}`;
            } else if (typeof result.url === "string" && result.url) {
                console.log("🚀 Přesměrování na jednu URL:", result.url);
                outputText.textContent = `Přesměrování na ${result.url}...`;
                window.location.href = result.url;
            } else {
                console.log("ℹ️ Žádná platná URL v odpovědi:", result);
                outputText.textContent = `Příkaz '${command}' zpracován, žádná akce.`;
            }
        } catch (error) {
            console.error("❌ Chyba při parsování JSON odpovědi:", error, "Odpověď:", text);
            outputText.textContent = "⚠️ Chyba při zpracování odpovědi.";
        }
    } catch (error) {
        console.error("❌ Chyba při připojení k Make:", error);
        outputText.textContent = "⚠️ Chyba při připojení k Make.";
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
        duration: duration || 5000
    };
    showNotification(newNotification);
}