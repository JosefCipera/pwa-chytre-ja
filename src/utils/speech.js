import { executeCommand, fetchCommands } from './actions.js';
import { updateRange } from "./config.js"; // ✅ Import globální proměnné
let firstRecognition = true;

export function startSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Tvůj prohlížeč nepodporuje rozpoznávání hlasu.");
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'cs-CZ';
    recognition.interimResults = false;

    recognition.onresult = async (event) => {
        const recognizedText = event.results[0][0].transcript.trim();
        console.log("🎤 Rozpoznaný text:", recognizedText);

        if (recognizedText && recognizedText.length > 0) {
            await fetchCommands(recognizedText);
        } else {
            console.log("⚠️ Nebyl rozpoznán žádný příkaz, neodesílám na Make.");
        }
    };

    recognition.start();
}

// ✅ Mikrofon se spustí až po kliknutí na ikonku
document.getElementById("start-speech").addEventListener("click", () => {
    console.log("🎤 Klik na mikrofon, spouštím rozpoznávání...");
    startSpeechRecognition();
});

// ❌ Oprava chybného exportu
// export { initVoiceRecognition };
// export { startSpeechRecognition };
