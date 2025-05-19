import { signInAndRunCheck } from "./auth.js";
import { loadWebhook } from "./config.js";

const commands = {};

export { commands };

export let commandList = {};

export async function fetchCommands(command) {
    console.trace("🕵️‍♂️ fetchCommands() bylo zavoláno s:", command);

    const webhookUrl = await loadWebhook();
    console.log("🔗 Použitý webhook:", webhookUrl);
    if (!webhookUrl) {
        console.error("❌ Webhook není nastaven.");
        return null;
    }

    console.log("🎤 Načítám URL pro příkaz:", command);

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

        let result;
        try {
            result = JSON.parse(text);
            console.log("✅ Přijatá odpověď:", result);
        } catch (error) {
            console.error("❌ Chyba při parsování JSON odpovědi:", error, "Odpověď:", text);
            document.getElementById('output').innerText = "⚠️ Neplatná odpověď od Make: Očekáván JSON, přijato '" + text + "'.";
            return null;
        }

        return result;
    } catch (error) {
        console.error("❌ Chyba při komunikaci s Make:", error);
        document.getElementById('output').innerText = "⚠️ Chyba při připojení.";
        return null;
    }
}

export async function executeCommand(command) {
    console.log(`🔎 Odesílám příkaz do Make: ${command}`);

    if (!command || command.trim() === "") {
        console.log("⚠️ Prázdný příkaz, neodesílám na Make.");
        return null;
    }

    return await fetchCommands(command);
}