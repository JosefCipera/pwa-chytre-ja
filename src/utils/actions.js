import { signInAndRunCheck } from "./auth.js";
import { updateRange } from "./config.js"; 
import { displayVideo } from "./ui.js"; 

const commands = {
    "kontrola dat": () => {
        console.log("🎤 Rozpoznán hlasový povel: Kontrola dat");
        signInAndRunCheck(); // ✅ Spustí přihlášení a kontrolu dat
    }
};

export { commands };

// Převod URL na YouTube embed formát
function convertToEmbedUrl(videoUrl) {
    if (videoUrl.includes("youtube.com/watch?v=")) {
        const videoId = videoUrl.split("v=")[1]?.split("&")[0]; // Extrahujeme ID videa
        return `https://www.youtube.com/embed/${videoId}`;
    }
    return videoUrl; // Pokud není z YouTube, vrátíme původní URL
}

// Funkce pro získání URL z Make a zobrazení videa
export async function fetchCommands(command) {
    console.trace("🕵️‍♂️ fetchCommands() bylo zavoláno s:", command);

    if (command.toLowerCase() === "kontrola dat") {
        console.log("✅ Spouštím signInAndRunCheck() pro kontrolu dat...");
        signInAndRunCheck();
        return;
    }

    console.log("🎤 Načítám URL pro příkaz:", command);
    const webhookUrl = "https://hook.eu1.make.com/17gn7hrtmnfgsykl52dcn2ekx15nvh1f"; // Aktualizuj URL

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
            console.log("✅ Přijatá odpověď:", result);

            if (result.url) {
                const embedUrl = convertToEmbedUrl(result.url);
                console.log("🚀 Spouštím video:", embedUrl);
                displayVideo(embedUrl);
            } else {
                console.error("❌ Chyba: Make nevrátil URL:", result);
                document.getElementById('output').innerText = "⚠️ Odpověď z Make neobsahuje URL.";
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

// Odeslání povelu do Make a získání URL
export async function executeCommand(command) {
    console.log(`🔎 Odesílám příkaz do Make: ${command}`);

    if (!command || command.trim() === "") {
        console.log("⚠️ Prázdný příkaz, neodesílám na Make.");
        return;
    }

    const url = await fetchCommands(command);

    if (url) {
        console.log(`🚀 Přesměrování na: ${url}`);
        window.location.href = url;
    } else {
        console.log("⚠️ Make nevrátil žádnou URL.");
    }
}
