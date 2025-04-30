// src/app.js
import * as Auth from "./utils/auth.js";
import { fetchSheetData, updateSheetData } from "./utils/googleSheets.js";
import { spreadsheetId, SHEET_NAME } from "./utils/config.js";
import { startSpeechRecognition } from "./utils/speech.js";

// Globální definice outputElement
const outputElement = document.getElementById('output');

// Kontrola načtení konfigurace
if (!spreadsheetId || !SHEET_NAME) {
    console.error("❌ Chybějící konfigurační hodnoty v config.js");
    outputElement.style.display = 'flex';
    outputElement.innerText = '⚠️ Chybí konfigurační hodnoty. Zkontroluj config.js.';
    throw new Error("Chybějící konfigurační hodnoty");
}

// Inicializace GIS při startu
document.addEventListener("DOMContentLoaded", async () => {
    try {
        Auth.initGoogleAuth();
        console.log("✅ GIS inicializováno při startu");
    } catch (error) {
        console.error("❌ Chyba při inicializaci GIS:", error);
        outputElement.style.display = 'flex';
        outputElement.innerText = '⚠️ Nepodařilo se inicializovat Google API.';
    }

    // Inicializace hlasového rozpoznávání
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

        setTimeout(() => {
            if (recognition) {
                console.log('🔇 Hlasové rozpoznávání automaticky ukončeno po 10 sekundách.');
                recognition.stop();
                document.getElementById('start-speech').classList.remove('recording');
                isProcessing = false;
            }
        }, 10000);
    });

    recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.trim().toLowerCase();
        console.log(`🎙️ Rozpoznaný příkaz: ${command}`);
        document.getElementById('output').innerText = `Rozpoznáno: ${command}`;
        recognition.stop();
        handleCommand(command);
    };
});

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
        console.log("🔍 Spouštím kontrolu dat...");
        try {
            const data = await fetchSheetData(spreadsheetId, `${SHEET_NAME}!A:D`);
            if (!data || !data.values) {
                console.log("❌ Data nenalezena, zobrazuji notifikaci...");
                showNotificationFromMake("Nepodařilo se načíst data", "urgent", 5000);
                resetMicIcon();
                return;
            }

            console.log("📊 Načtená data:", data.values);
            const headers = data.values[0];
            const rows = data.values.slice(1);

            const errors = [];
            for (let index = 0; index < rows.length; index++) {
                const row = rows[index];
                const rowIndex = index + 2;
                const quantityIndex = headers.indexOf("Množství");
                const quantity = parseInt(row[quantityIndex], 10);
                let status;

                if (isNaN(quantity) || quantity <= 0) {
                    errors.push(`Řádek ${rowIndex}: Množství musí být větší než 0`);
                    status = "Množství";
                } else {
                    status = "ok";
                }

                console.log(`📝 Aktualizuji řádek ${rowIndex} s hodnotou: ${status}`);
                try {
                    await updateSheetData([[status]], `${SHEET_NAME}!D${rowIndex}:D${rowIndex}`);
                    console.log(`✅ Úspěšně aktualizován řádek ${rowIndex}`);
                } catch (error) {
                    console.error(`❌ Selhání aktualizace řádku ${rowIndex}:`, error.message);
                    errors.push(`Řádek ${rowIndex}: Selhání aktualizace: ${error.message}`);
                }
            }

            if (errors.length > 0) {
                console.log("⚠️ Chyby nalezeny, zobrazuji notifikaci...");
                showNotificationFromMake("Kontrola dat: Chyby nalezeny", "warning", 5000);
                displayValidationErrors(errors);
            } else {
                console.log("✅ Kontrola úspěšná, zobrazuji notifikaci...");
                showNotificationFromMake("Kontrola dat úspěšná", "ok", 3000);
            }
        } catch (error) {
            console.error("❌ Chyba při kontrole dat:", error.message);
            showNotificationFromMake(`Chyba při kontrole dat: ${error.message}`, "urgent", 5000);
        } finally {
            resetMicIcon();
        }
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

            // Upravená logika pro zpracování URL
            const url = result.response_data; // Hledáme response_data místo url
            if (result.response_type === "url" && Array.isArray(url)) {
                console.log("📋 Seznam URL detekován:", url);
                output.style.display = 'flex';
                output.innerText = `Nalezeno více URL: ${url.join(', ')}`;
            } else if (result.response_type === "url" && typeof url === "string" && url) {
                console.log("🚀 Přesměrování na jednu URL:", url);
                output.style.display = 'flex';
                output.innerText = `Přesměrování na ${url}...`;
                // Pro Looker Studio dashboardy použijeme iframe
                if (url.includes("lookerstudio.google.com")) {
                    const iframe = document.createElement('iframe');
                    iframe.src = url;
                    iframe.width = '100%';
                    iframe.height = '600px';
                    iframe.style.border = 'none';
                    iframe.allowFullscreen = true;
                    output.innerHTML = '';
                    output.appendChild(iframe);
                } else {
                    window.location.href = url; // Jiné URL přesměrujeme
                }
            } else if (result.response_type === "audio" || result.response_type === "video") {
                console.log("🎥 Detekován mediální obsah:", url);
                window.location.href = `media-results.html?mediaUrl=${encodeURIComponent(url)}`;
            } else {
                console.log("ℹ️ Neznámý typ odpovědi nebo chybějící URL:", result);
                output.style.display = 'flex';
                output.innerText = `Příkaz '${command}' zpracován, žádná akce.`;
            }
        } catch (error) {
            console.error("❌ Chyba při parsování JSON odpovědi:", error, "Odpověď:", text);
            output.style.display = 'flex';
            output.innerText = "⚠️ Chyba při zpracování odpovědi.";
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
    document.getElementById('start-speech').classList.remove('recording');
}

let notificationTimeout;
function showNotification(notification) {
    console.log("🔔 Zobrazuji notifikaci:", notification);
    clearTimeout(notificationTimeout);
    outputElement.style.display = 'flex';
    outputElement.textContent = notification.message;
    outputElement.className = '';

    const severityClass = notification.severity ? `notification-${notification.severity}` : 'notification-normal';
    outputElement.classList.add(severityClass);
    console.log("📌 Přidána třída:", severityClass);

    if (notification.severity === 'ok' || notification.severity === 'informative') {
        outputElement.classList.add('fade-out');
        notificationTimeout = setTimeout(() => {
            outputElement.textContent = '';
            outputElement.className = '';
            outputElement.style.display = 'none';
            console.log("🔔 Notifikace skryta (fade-out)");
        }, notification.duration || 3000);
    } else if (notification.severity === 'urgent' || notification.severity === 'warning') {
        outputElement.classList.add('blink');
        notificationTimeout = setTimeout(() => {
            outputElement.classList.remove('blink');
            outputElement.className = '';
            outputElement.style.display = 'none';
            console.log("🔔 Notifikace skryta (blink)");
        }, notification.duration || 3000);
    }
}

function showNotificationFromMake(message, severity, duration) {
    showNotification({ message, severity, duration });
}

function displayValidationErrors(errors) {
    outputElement.innerHTML = errors.map(err => `<div>${err}</div>`).join('');
}