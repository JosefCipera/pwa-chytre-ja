
import * as Auth from "./utils/auth.js"; // ✅ Importujeme všechny funkce pod jménem Auth

const outputElement = document.getElementById('output');
let isDefaultTextVisible = true;
/* const notificationQueue = [
    { message: 'Výroba zastavena – porucha stroje.', severity: 'urgent', duration: 5000 },
    { message: 'Zaplánování výroby dokončeno.', severity: 'informative', duration: 4000 },
    { message: 'Zakázka XYZ dokončena v termínu.', severity: 'ok', duration: 4000 },
    { message: 'Sklad surovin klesl pod 10 % – hrozí zpoždění.', severity: 'warning', duration: 5000 },
    { message: 'Zpráva po 5 sekundách.', severity: 'informative', duration: 4000 }
];
*/
let recording = false; // Deklarace proměnné recording
let currentNotificationIndex = 0;
let notificationTimeout;

// Funkce pro zobrazení výchozího textu
function showDefaultText() {
    outputElement.textContent = 'Řekněte příkaz, např. Zobraz vytížení, Přehrát video školení, nebo Spusť audio návod';
    outputElement.className = 'default-text';
    outputElement.style.display = 'flex';
    isDefaultTextVisible = true;
}

function showNotification(notification) {
    clearTimeout(notificationTimeout);
    outputElement.textContent = notification.message;
    outputElement.className = ''; // Reset tříd

    // Zajistí, že třída není prázdná
    const severityClass = notification.severity ? `notification-${notification.severity}` : 'notification-normal';
    outputElement.classList.add(severityClass);

    if (notification.severity === 'ok' || notification.severity === 'informative') {
        outputElement.classList.add('fade-out');
        notificationTimeout = setTimeout(() => {
            outputElement.textContent = ''; // Vymaže text
            outputElement.className = ''; // Reset tříd (ne default-text)
            outputElement.style.display = 'none'; // Skryje #output
            showDefaultText(); // Zobrazí výchozí text po notifikaci
        }, notification.duration || 3000);
    } else if (notification.severity === 'urgent' || notification.severity === 'warning') {
        outputElement.classList.add('blink');
        notificationTimeout = setTimeout(() => {
            outputElement.classList.remove('blink');
            outputElement.className = ''; // Reset tříd (ne default-text)
            outputElement.style.display = 'none'; // Skryje #output
            showDefaultText(); // Zobrazí výchozí text po notifikaci
        }, notification.duration || 3000);
    }

    isDefaultTextVisible = false;
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js")
        .then(() => console.log("Service Worker zaregistrován!"))
        .catch((err) => console.log("Service Worker error:", err));
}



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

let isProcessing = false; // Omezení více požadavků najednou
let latestRequestTimestamp = 0; // Sledování nejnovějšího požadavku

recognition.onerror = (event) => {
    console.error('❌ Chyba při hlasovém rozpoznávání:', event.error);
    alert(`Chyba při rozpoznávání hlasu: ${event.error}. Zkontrolujte povolení mikrofonu.`);
    document.getElementById('start-speech').classList.remove('recording');
    isProcessing = false;
};

recognition.onend = () => {
    console.log('🔇 Hlasové rozpoznávání ukončeno.');
    document.getElementById('start-speech').classList.remove('recording');
    const micIcon = document.getElementById('microphoneIcon');
    if (micIcon) {
        micIcon.classList.remove('pulsate');
        micIcon.style.opacity = '1'; // Vrátí původní vzhled
        if (defaultMicIconSrc) {
            micIcon.src = defaultMicIconSrc;
        }
    }
    isProcessing = false;
};

const beepSound = new Audio('beep.mp3');

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
    document.getElementById('start-speech').classList.add('recording');
    isProcessing = true;

    const beepSound = new Audio('beep.mp3');
    const micIcon = document.getElementById('microphoneIcon'); // Pokud jste přidali ID
    const defaultMicIconSrc = micIcon ? micIcon.src : '';
    const recordingIconSrc = 'images/microphone-recording.png'; // Pokud chcete měnit ikonu

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
        // Zde už nemáte nic dalšího souvisejícího se *začátkem* nahrávání
    }

    recognition.onspeechend = function () {
        try {
            beepSound.play();
        } catch (err) {
            console.log("Nepodařilo se přehrát zvuk na konci: " + err);
        }
        recognition.stop();
        recording = false;
        resetMicIcon(); // Reset vzhledu mikrofonu
    };

    recognition.onend = () => {
        console.log('🔇 Hlasové rozpoznávání ukončeno.');
        document.getElementById('start-speech').classList.remove('recording');
        resetMicIcon(); // Reset vzhledu mikrofonu
        isProcessing = false;
    };
});

recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.trim().toLowerCase();
    console.log(`🎙️ Rozpoznaný příkaz: ${command}`);
    document.getElementById('output').innerText = `Rozpoznáno: ${command}`;
    recognition.stop();
    handleCommand(command);
};

// async function handleCommand(command) {
// console.log("🎤 Odesílám povel na Make:", command);
// const webhookUrl = "https://hook.eu1.make.com/4jibyt5oj7j96mnuaiow2mnofgpfhomo"; // Webhook bez AI
// const webhookUrl = "https://hook.eu1.make.com/17gn7hrtmnfgsykl52dcn2ekx15nvh1f"; // Webhook pro URL
// const webhookUrl = "https://hook.eu1.make.com/7oiexq848aerxmqcztnyvs06qtw31rh6"; // Webhook pro AI

const startSpeech = document.getElementById('start-speech');
const output = document.getElementById('output');

function setWebhookUrl() {
    const webhookUrl = document.getElementById('webhook-url').value;
    if (webhookUrl) {
        localStorage.setItem('webhookUrl', webhookUrl);
        output.innerText = 'Webhook URL nastaven: ' + webhookUrl;
        document.getElementById('webhook-setup').style.display = 'none';
        document.getElementById('change-webhook').style.display = 'block';
    } else {
        output.innerText = '⚠️ Zadejte platnou URL.';
    }
}

function showWebhookSetup() {
    document.getElementById('webhook-setup').style.display = 'flex';
    document.getElementById('change-webhook').style.display = 'none';
    document.getElementById('webhook-url').value = localStorage.getItem('webhookUrl') || '';
}

async function handleCommand(command) {
    const webhookUrl = localStorage.getItem('webhookUrl') || '';
    const output = document.getElementById('output');
    if (!webhookUrl) {
        output.innerText = '⚠️ Nastavte webhook URL.';
        console.error('Webhook URL není nastaven');
        resetMicIcon(); // Reset mikrofonu
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
            resetMicIcon(); // Reset mikrofonu
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
                resetMicIcon(); // Reset mikrofonu
                return;
            }
            // stávající logika url
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
        resetMicIcon(); // Reset mikrofonu i při chybě
    }
}

// Nová funkce pro reset mikrofonu
function resetMicIcon() {
    const startSpeech = document.getElementById('start-speech');
    const micIcon = document.getElementById('microphoneIcon');
    if (startSpeech) {
        startSpeech.classList.remove('recording'); // Zajištění odstranění třídy
    }
    if (micIcon) {
        micIcon.classList.remove('recording', 'pulsate');
        micIcon.style.opacity = '1 !important'; // Vynutí původní vzhled
        if (defaultMicIconSrc) {
            micIcon.src = defaultMicIconSrc;
        }
    }
    recording = false;
    isProcessing = false;
}

// Přidání event listenerů při startu
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('webhookUrl')) {
        document.getElementById('webhook-setup').style.display = 'none';
        document.getElementById('change-webhook').style.display = 'block';
    }
    document.getElementById('set-webhook-button').addEventListener('click', setWebhookUrl);
    document.getElementById('change-webhook').addEventListener('click', showWebhookSetup);
    showDefaultText(); // Inicializace výchozího textu při načtení
});

function displayContent(url) {
    const output = document.getElementById('output');
    output.innerText = `Načítám obsah: ${url}`;

    // Zkontrolujeme, zda je URL platná
    if (!url || typeof url !== 'string') {
        output.innerHTML = '<span class="status">Soubor nenalezen</span><br><span class="hint">Řekněte příkaz, např. "Zobraz vytížení", "Přehrát video školení", nebo "Spusť audio návod".</span>';
        return;
    }

    // Rozpoznání typu URL a zobrazení v frame nebo chybová hláška
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
        output.innerHTML = ''; // Vyčistíme před přidáním audia
    } else if (url.includes('youtube.com') || url.includes('vimeo.com') || url.includes('.mp4') || url.includes('.webm')) {
        let mediaElement;
        if (url.includes('youtube.com')) {
            const youtubeId = new URL(url).searchParams.get('v') || url.split('v=')[1]?.split('&')[0];
            if (youtubeId) {
                mediaElement = document.createElement('iframe');
                mediaElement.width = window.innerWidth > 768 ? '533' : '100%'; // Zachováme zvětšení na 533px na desktopu, 100% na mobilu
                mediaElement.height = window.innerWidth > 768 ? '300' : '400'; // Zachováme výšku 300px na desktopu, vrátíme 400px na mobilu
                mediaElement.style.width = '533px !important'; // Přidáme inline style pro prioritu
                mediaElement.style.height = window.innerWidth > 768 ? '300px !important' : '400px !important'; // Přidáme inline style pro prioritu
                mediaElement.style.objectFit = window.innerWidth > 768 ? 'cover' : 'contain'; // Zachováme cover na desktopu, contain na mobilu
                mediaElement.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&enablejsapi=1`; // Přidáme enablejsapi pro kontrolu přes API
                mediaElement.allow = 'autoplay; encrypted-media; fullscreen';
                mediaElement.allowFullscreen = true;
                // Pokus o nastavení velikosti přes YouTube API
                mediaElement.onload = () => {
                    if (window.YT && window.YT.Player) {
                        new window.YT.Player(mediaElement, {
                            events: {
                                'onReady': function (event) {
                                    event.target.setSize(
                                        window.innerWidth > 768 ? 533 : 100, // Šířka na desktopu/mobilu
                                        window.innerWidth > 768 ? 300 : 400 // Výška na desktopu/mobilu
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
                mediaElement.width = window.innerWidth > 768 ? '533' : '100%'; // Zachováme zvětšení na 533px na desktopu, 100% na mobilu
                mediaElement.height = window.innerWidth > 768 ? '300' : '400'; // Zachováme výšku 300px na desktopu, vrátíme 400px na mobilu
                mediaElement.style.width = '533px !important'; // Přidáme inline style pro prioritu
                mediaElement.style.height = window.innerWidth > 768 ? '300px !important' : '400px !important'; // Přidáme inline style pro prioritu
                mediaElement.style.objectFit = window.innerWidth > 768 ? 'cover' : 'contain'; // Zachováme cover na desktopu, contain na mobilu
                mediaElement.src = `https://player.vimeo.com/video/${vimeoId}?autoplay=1`; // Přidáme autoplay
                mediaElement.allow = 'autoplay; encrypted-media; fullscreen';
                mediaElement.allowFullscreen = true;
            }
        } else {
            mediaElement = document.createElement('video');
            mediaElement.controls = true;
            mediaElement.width = window.innerWidth > 768 ? 533 : '100%'; // Zachováme zvětšení na 533px (16:9 pro 300px výšku) na desktopu, 100% na mobilu
            mediaElement.height = window.innerWidth > 768 ? 300 : '400'; // Zachováme výšku 300px na desktopu, vrátíme 400px na mobilu
            mediaElement.style.width = '533px !important'; // Přidáme inline style pro prioritu
            mediaElement.style.height = window.innerWidth > 768 ? '300px !important' : '400px !important'; // Přidáme inline style pro prioritu
            mediaElement.style.objectFit = window.innerWidth > 768 ? 'cover' : 'contain'; // Zachováme cover na desktopu, contain na mobilu
            mediaElement.src = url;
            mediaElement.autoplay = true; // Přidáme autoplay pro okamžité přehrávání
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
        iframe.height = '500px'; // Standardní výška pro dokumenty
        iframe.src = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
        iframe.onerror = () => {
            output.innerHTML = '<span class="status">Soubor nenalezen</span><br><span class="hint">Řekněte příkaz, např. "Zobraz vytížení", "Přehrát video školení", nebo "Spusť audio návod".</span>';
        };
        output.innerHTML = '';
        output.appendChild(iframe);
    } else if (url.includes('app.tabidoo.cloud/public-dashboard') || url.includes('public') || url.includes('dashboard')) {
        // Otevření veřejných dashboardů na samostatné stránce
        window.location.href = url;
    } else {
        // Ostatní URL (stránky, grafy) otevřeme na samostatné stránce
        window.location.href = url;
    }
}
/*
let deferredPrompt;
const installButton = document.getElementById("install-button");

// ✅ Funkce pro kontrolu, zda je PWA už nainstalovaná
function checkIfInstalled() {
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
        console.log("✅ Aplikace běží jako PWA, skryjeme tlačítko.");
        installButton.style.display = "none"; // Ihned skryjeme tlačítko
    }
}
*/
// ✅ Zkontrolujeme instalaci ihned po načtení stránky
/* document.addEventListener("DOMContentLoaded", checkIfInstalled);

// ✅ Když se nabídne instalace PWA
window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // Zabráníme výchozímu chování
    deferredPrompt = event;

    // Zobrazíme tlačítko, ale bez "mrknutí"
    setTimeout(() => {
        document.getElementById("install-button").style.opacity = "1";
    }, 100);
});
*/

// ✅ Událost, která se spustí ihned po instalaci PWA
window.addEventListener("appinstalled", () => {
    console.log("🎉 Událost `appinstalled` spuštěna, skryjeme tlačítko.");
    installButton.style.display = "none";
});


// ✅ Extra kontrola každou sekundu, zda je PWA aktivní
// setInterval(checkIfInstalled, 1000);

// console.log("📊 Globální updateRange:", updateRange); // ✅ Ověření v konzoli

window.getAccessToken = Auth.getAccessToken; // ✅ Nastavíme globální přístup

window.onload = () => {
    console.log("🔄 Čekám na načtení Google Identity Services...");
    Auth.initGoogleAuth();
};

document.addEventListener("DOMContentLoaded", () => {
    const installButton = document.getElementById("install-button");

    if (!installButton) {
        console.error("❌ Chyba: Nenalezen `install-button` v HTML!");
        return;
    }

    let deferredPrompt;

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installButton.style.display = "block";

        installButton.addEventListener("click", () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === "accepted") {
                    console.log("✅ Aplikace byla nainstalována.");
                }
                deferredPrompt = null;
            });
        });
    });
});

//  ... tvůj existující kód ...

// Funkce pro zobrazení notifikace z Make
function showNotificationFromMake(message, severity, duration) {
    const newNotification = {
        message: message,
        severity: severity,
        duration: duration || 5000 // Výchozí trvání
    };
    showNotification(newNotification);
}

// Funkce pro zpracování odpovědi z Make (Kontrola dat)
/* function handleDataValidationResponse(response) {
    if (response.type === "validation_result") {
        if (response.status === "success") {
            // Zobraz notifikaci o úspěchu
            showNotificationFromMake(response.message, "success", 3000);
        } else if (response.status === "error") {
            // Zobraz notifikaci o chybách
            showNotificationFromMake(response.message, "warning", 5000);
            // Zobraz seznam chyb (tuto funkci si musíš implementovat)
            displayValidationErrors(response.errors);
        }
    }
}

// Funkce pro odeslání dat do Make a spuštění kontroly
function validateDataWithMake(data) {
    fetch('/make-webhook-url-pro-kontrolu-dat', { // Nahraď URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(responseData => handleDataValidationResponse(responseData))
        .catch(error => console.error('Chyba při kontrole dat:', error));
}

// Funkce pro zobrazení chyb validace (tuto si musíš implementovat)
function displayValidationErrors(errors) {
    //  Kód pro zobrazení chyb v PWA
    //  Např. vytvoření seznamu, zobrazení u inputů atd.
    console.warn("Chyby validace:", errors);
}

//  ... tvůj kód pro spuštění kontroly dat ...
//  Např. po kliknutí na tlačítko:
//  document.getElementById("tlacitko-kontrola").addEventListener("click", () => {
//    validateDataWithMake(dataProKontrolu);
//  }); */