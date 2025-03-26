import { signInAndRunCheck } from "./auth.js";
import { updateRange } from "./config.js"; // ✅ Import globální proměnné

const commands = {
    "kontrola dat": () => {
        console.log("🎤 Rozpoznán hlasový povel: Kontrola dat");
        signInAndRunCheck(); // ✅ Spustí přihlášení a kontrolu dat
    }
};

export { commands };

export let commandList = {};  // Správně exportujeme seznam povelů

//export async function fetchCommands(command) {
//    console.trace("🕵️‍♂️ fetchCommands() bylo zavoláno s:", command);

export async functionfetchCommands(recognizedText).then((url) => {
    const embedUrl = convertToEmbedUrl(url);
    displayVideo(embedUrl);
});

    // ✅ Pokud je rozpoznán příkaz "kontrola dat", spustíme signInAndRunCheck()
    if (command.toLowerCase() === "kontrola dat") {
        console.log("✅ Spouštím signInAndRunCheck() pro kontrolu dat...");
        signInAndRunCheck(); // 🔥 Spustí přihlášení a kontrolu tabulky
        return;
    }
    import { displayVideo } from "./ui.js"; 
    
    function convertToEmbedUrl(videoUrl) {
        if (videoUrl.includes("youtube.com/watch?v=")) {
            const videoId = videoUrl.split("v=")[1]?.split("&")[0]; // Extrahujeme ID videa
            return `https://www.youtube.com/embed/${videoId}`;
        }
        return videoUrl; // Vrátíme původní URL, pokud není z YouTube
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

            // Pracujeme jen s jednou URL, seznam není potřeba
            if (result.url) {
                console.log("🚀 Přesměrování na:", result.url);
                window.location.href = result.url; // Přesměrování přímo na URL
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


export async function executeCommand(command) {
    console.log(`🔎 Odesílám příkaz do Make: ${command}`);

    if (!command || command.trim() === "") {
        console.log("⚠️ Prázdný příkaz, neodesílám na Make.");
        return;
    }

    const recognizedUrl = document.getElementById("recognized-url");

    // Pošleme povel do Make a získáme odpověď
    const url = await fetchCommands(command);

    if (url) {
        console.log(`🚀 Přesměrování na: ${url}`);
        window.location.href = url;
    } else {
        console.log("⚠️ Make nevrátil žádnou URL.");
    }
}



