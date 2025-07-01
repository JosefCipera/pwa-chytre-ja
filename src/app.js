// app.js

// Konstanta pro URL vašeho Make.com webhooku
// !!! DŮLEŽITÉ: TUTO URL MUSÍTE NAHRADIT SKUTEČNOU URL Z VAŠEHO MAKE.COM SCÉNÁŘE !!!
// Získáte ji v Make.com po přidání modulu "Webhooks -> Custom webhook".
// const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/q9sdlfg0pcu4lhdbf31nknxx3689t2vc";
const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/4jibyt5oj7j96mnuaiow2mnofgpfhomo";

// Reference na DOM elementy (ujistěte se, že ID v index.html jsou shodná)
const microphoneIcon = document.getElementById('microphoneIcon');
const microphoneContainer = document.querySelector('.microphone-container');
const statusElement = document.getElementById('status');
const outputElement = document.getElementById('output');
const userInputElement = document.getElementById('userInput'); // Pro textové zadávání
const processCommandButton = document.querySelector('button[onclick="processCommand()"]'); // Tlačítko "Provést příkaz"

// Funkce pro zobrazení zprávy v notifikačním řádku (#output)
// Zajišťuje zobrazení zprávy s určeným typem (např. 'informative', 'ok', 'urgent')
// a automatické skrytí po 3 sekundách.
function showOutput(message, type = 'informative') {
    if (outputElement) {
        outputElement.className = `notification-${type} visible`;
        outputElement.innerHTML = `<span class="output-text">${message}</span>`;
        setTimeout(() => {
            outputElement.classList.remove('visible');
            outputElement.classList.add('hidden');
        }, 3000);
    }
}

// Hlavní funkce pro zpracování příkazu - volaná buď tlačítkem nebo hlasem.
// Pokud je commandText null, vezme text z input pole.
function processCommand(commandText = null) {
    let command = commandText;
    if (!command && userInputElement) {
        command = userInputElement.value.toLowerCase().trim();
    }

    if (command) {
        callSuperAgent(command);
    } else {
        showOutput("Prosím, zadejte příkaz.", "warning");
    }
}

// Asynchronní funkce pro volání Make.com Superagenta (backend)
// Odesílá příkaz a čeká na odpověď, kterou pak zobrazí.
async function callSuperAgent(command) {
    showOutput("Zpracovávám příkaz...", "informative"); // Okamžitá zpětná vazba uživateli

    try {
        const response = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: command, agent: "výroba" }) // Odesíláme povel a typ agenta
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP chyba: ${response.status} - ${errorText}`);
        }

        const result = await response.json(); // Očekáváme JSON odpověď z Make.com

        // Zpracování odpovědi z Make.com
        if (result && result.message) {
            showOutput(result.message, result.type || "ok"); // Make.com by měl vrátit 'message' a volitelně 'type'
        } else {
            showOutput("Neznámá odpověď od agenta.", "warning");
        }

    } catch (error) {
        showOutput("Chyba při komunikaci s AI agentem: " + error.message, "urgent");
        console.error("Fetch error:", error); // Logování chyby pro ladění
    } finally {
        // Ukliď input pole po odeslání
        if (userInputElement) {
            userInputElement.value = '';
        }
    }
}


// --- Logika hlasového rozpoznávání (Web Speech API) ---
let recognition; // Proměnná pro instanci SpeechRecognition

function startVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window)) { // Kontrola podpory v prohlížeči
        showOutput("Hlasové rozpoznávání není podporováno v tomto prohlížeči.", "urgent");
        return;
    }

    // Zastav předchozí rozpoznávání, pokud už běží, aby se zabránilo vícenásobným instancím
    if (recognition && recognition.running) {
        recognition.stop();
    }

    recognition = new webkitSpeechRecognition();
    recognition.lang = 'cs-CZ'; // Nastav jazyk na češtinu pro lepší přesnost
    recognition.interimResults = false; // Chceme jen konečné výsledky pro povel
    recognition.maxAlternatives = 1; // Chceme jen jednu nejlepší alternativu rozpoznání

    // Událost: rozpoznávání začalo
    recognition.onstart = () => {
        microphoneContainer.classList.add('recording'); // Přidáme třídu pro animaci vln
        microphoneIcon.classList.add('recording');     // Přidáme třídu pro pulzaci ikony mikrofonu
        statusElement.textContent = "Poslouchám...";   // Změníme text statusu
        statusElement.classList.add('pulsate');        // Přidáme pulzaci status textu (pokud je stylizována)
        // showOutput("Hlasové rozpoznávání spuštěno...", "informative"); // Volitelné oznámení
    };

    // Událost: výsledek rozpoznávání
    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript.toLowerCase();
        showOutput(`Rozpoznáno: "${speechResult}"`, "informative"); // Zobrazíme rozpoznaný text
        processCommand(speechResult); // Odešli rozpoznaný text ke zpracování do Make.com
    };

    // Událost: chyba rozpoznávání
    recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error); // Logování chyby
        showOutput("Chyba hlasového rozpoznávání: " + event.error, "urgent");
        // Zajistíme, že se ikona a status vrátí do normálního stavu i při chybě
        microphoneContainer.classList.remove('recording');
        microphoneIcon.classList.remove('recording');
        statusElement.textContent = "";
        statusElement.classList.remove('pulsate');
    };

    // Událost: rozpoznávání skončilo
    recognition.onend = () => {
        // Zajistíme, že se ikona a status vrátí do normálního stavu po skončení
        microphoneContainer.classList.remove('recording');
        microphoneIcon.classList.remove('recording');
        statusElement.textContent = "";
        statusElement.classList.remove('pulsate');
        // showOutput("Hlasové rozpoznávání ukončeno.", "informative"); // Volitelné oznámení
    };

    recognition.start(); // Spustí hlasové rozpoznávání
}

// Přidání posluchače událostí pro kliknutí na ikonu mikrofonu
if (microphoneIcon) {
    microphoneIcon.addEventListener('click', startVoiceRecognition);
}

// Přidání posluchače událostí pro stisknutí Enter v textovém inputu
if (userInputElement) {
    userInputElement.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Zabraň výchozímu chování (např. odeslání formuláře)
            processCommand(); // Zpracuj text z input pole
        }
    });
}

// Globální funkce pro přístup z HTML onclick atributů
window.processCommand = processCommand;
window.startVoiceRecognition = startVoiceRecognition;
