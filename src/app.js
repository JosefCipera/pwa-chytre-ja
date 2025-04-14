
import * as Auth from "./utils/auth.js"; // ✅ Importujeme všechny funkce pod jménem Auth

const outputElement = document.getElementById('output');
let isDefaultTextVisible = true;
const notificationQueue = [
    { message: 'Výroba zastavena – porucha stroje.', severity: 'urgent', duration: 5000 },
    { message: 'Zaplánování výroby dokončeno.', severity: 'informative', duration: 4000 },
    { message: 'Zakázka XYZ dokončena v termínu.', severity: 'ok', duration: 3000 },
    { message: 'Sklad surovin klesl pod 10 % – hrozí zpoždění.', severity: 'warning', duration: 5000 },
    { message: 'Zpráva po 5 sekundách.', severity: 'informative', duration: 5000 }
];
let currentNotificationIndex = 0;

function showNotification(notification) {
    outputElement.textContent = notification.message;
    outputElement.className = '';
    outputElement.classList.add(notification.severity ? `notification-${notification.severity}` : '');
    isDefaultTextVisible = false;
    setTimeout(() => {
        if (currentNotificationIndex < notificationQueue.length - 1) {
            currentNotificationIndex++;
            showNotification(notificationQueue[currentNotificationIndex]);
        } else {
            outputElement.textContent = "Řekněte příkaz, např. 'Zobraz vytížení', 'Přehrát video školení', nebo 'Spusť audio návod'.";
            outputElement.className = 'default-text';
            isDefaultTextVisible = true;
        }
    }, notification.duration);
}

// Při načtení stránky zobrazíme výchozí text a poté spustíme zobrazení notifikací
document.addEventListener('DOMContentLoaded', () => {
    outputElement.textContent = "Řekněte příkaz, např. 'Zobraz vytížení', 'Přehrát video školení', nebo 'Spusť audio návod'.";
    outputElement.className = 'default-text';
    isDefaultTextVisible = true;

    // Spustíme zobrazení první notifikace z fronty
    if (notificationQueue.length > 0) {
        setTimeout(() => {
            showNotification(notificationQueue[0]);
        }, 1000); // Malé zpoždění po načtení stránky
    }
});

window.onload = () => {
    console.log("✅ Stránka načtena, inicializuji Google Auth...");
    initGoogleAuth();
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Aplikace spuštěna...");

});


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
    isProcessing = false;
};

// const beepSound = new Audio('beep.mp3');

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
        if (micIcon) {
            micIcon.classList.remove('pulsate');
            if (defaultMicIconSrc) {
                micIcon.src = defaultMicIconSrc;
            }
        }
    }

    recognition.onend = function () {
        recording = false;
        if (micIcon) {
            micIcon.classList.remove('pulsate');
            if (defaultMicIconSrc) {
                micIcon.src = defaultMicIconSrc;
            }
        }
    }
});

recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.trim().toLowerCase();
    console.log(`🎙️ Rozpoznaný příkaz: ${command}`);
    document.getElementById('output').innerText = `Rozpoznáno: ${command}`;
    recognition.stop();
    handleCommand(command);
};

async function handleCommand(command) {
    console.log("🎤 Odesílám povel na Make:", command);

    const webhookUrl = "https://hook.eu1.make.com/17gn7hrtmnfgsykl52dcn2ekx15nvh1f"; // Aktualizuj URL
    // const webhookUrl = "https://hook.eu1.make.com/7oiexq848aerxmqcztnyvs06qtw31rh6"; // Webhook pro AI

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Povel: command })
        });

        console.log("🔍 HTTP status:", response.status);

        if (!response.ok) {
            throw new Error(`Chyba při odesílání na Make: ${response.status}`);
        }

        const text = await response.text();
        console.log("📜 Surová odpověď:", text);

        try {
            const result = JSON.parse(text);
            console.log("✅ Zpracovaná odpověď (JSON):", result);

            if (Array.isArray(result.url)) {
                console.log("📋 Seznam URL detekován:", result.url);
                // Zde můžeš zobrazit seznam, pokud chceš uživateli nabídnout více možností
            } else if (typeof result.url === "string") {
                console.log("🚀 Přesměrování na jednu URL:", result.url);
                window.location.href = result.url; // Přesměrování na URL
            } else {
                console.error("❌ Odpověď z Make neobsahuje platnou URL:", result);
                document.getElementById('output').innerText = "⚠️ Chybná odpověď z Make.";
            }
        } catch (error) {
            console.error("❌ Chyba při parsování JSON odpovědi:", error, "Odpověď:", text);
            document.getElementById('output').innerText = "⚠️ Chyba při zpracování odpovědi.";
        }

    } catch (error) {
        console.error("❌ Chyba při komunikaci s Make:", error);
        document.getElementById('output').innerText = "⚠️ Chyba při připojení.";
    }
}


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

let deferredPrompt;
const installButton = document.getElementById("install-button");

// ✅ Funkce pro kontrolu, zda je PWA už nainstalovaná
function checkIfInstalled() {
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
        console.log("✅ Aplikace běží jako PWA, skryjeme tlačítko.");
        installButton.style.display = "none"; // Ihned skryjeme tlačítko
    }
}

// ✅ Zkontrolujeme instalaci ihned po načtení stránky
document.addEventListener("DOMContentLoaded", checkIfInstalled);

// ✅ Když se nabídne instalace PWA
window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // Zabráníme výchozímu chování
    deferredPrompt = event;

    // Zobrazíme tlačítko, ale bez "mrknutí"
    setTimeout(() => {
        document.getElementById("install-button").style.opacity = "1";
    }, 100);
});


// ✅ Událost, která se spustí ihned po instalaci PWA
window.addEventListener("appinstalled", () => {
    console.log("🎉 Událost `appinstalled` spuštěna, skryjeme tlačítko.");
    installButton.style.display = "none";
});


// ✅ Extra kontrola každou sekundu, zda je PWA aktivní
setInterval(checkIfInstalled, 1000);

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