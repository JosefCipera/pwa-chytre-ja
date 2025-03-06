let commandList = {};  // Načtené příkazy

export async function fetchCommands() {
    try {
        console.log("📡 Načítám povely z Make...");

        const response = await fetch("https://hook.eu1.make.com/17gn7hrtmnfgsykl52dcn2ekx15nvh1fK");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        commandList = await response.json();
        console.log("📜 Načtené povely:", commandList);

        // Ověření, zda je seznam povelů platný
        if (Object.keys(commandList).length === 0) {
            console.warn("⚠️ Seznam povelů je prázdný!");
        }

    } catch (error) {
        console.error("❌ Chyba při načítání povelů:", error);
    }
}

export function executeCommand(command) {
    console.log(`🔎 Hledám příkaz: ${command}`);
    const recognizedUrl = document.getElementById("recognized-url");

    if (commandList[command]) {
        const url = commandList[command];
        console.log("✅ Otevírám:", url);

        // Zobrazíme URL pod mikrofonem
        if (recognizedUrl) {
            recognizedUrl.textContent = `Otevírám: ${url}`;
        }

        // Přesměrování na URL
        window.location.href = url;
    } else {
        console.log("❌ Příkaz nenalezen v seznamu!", commandList);
        if (recognizedUrl) {
            recognizedUrl.textContent = `❌ Neznámý příkaz: ${command}`;
        }
    }
}
