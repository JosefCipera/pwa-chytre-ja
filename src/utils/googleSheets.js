import { spreadsheetId, SHEET_NAME } from "./config.js";
import { getAccessToken } from "./auth.js";

console.log("✅ Načtené ID tabulky:", spreadsheetId);
console.log("✅ Načtený název listu:", SHEET_NAME);

export async function updateSheetData(updatedData, range) {
    console.log("🔄 Aktualizuji Google Sheet...", { updatedData, range });

    const accessToken = getAccessToken();
    if (!accessToken) {
        throw new Error("❌ Access token není dostupný. Prosím, přihlaste se.");
    }

    try {
        console.log("📌 URL pro aktualizaci:", `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`);

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({ values: updatedData })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Chyba při aktualizaci Google Sheets:", errorData);
            throw new Error(`Chyba API: ${errorData.error.message}`);
        }

        const result = await response.json();
        console.log("✅ Výsledek aktualizace:", result);
        return result;
    } catch (error) {
        console.error("❌ Selhání aktualizace Google Sheets:", error.message);
        throw error;
    }
}

export async function fetchSheetData(spreadsheetId, range) {
    console.log("📥 Načítám data z Google Sheets...", spreadsheetId, range);

    const accessToken = getAccessToken();
    if (!accessToken) {
        throw new Error("❌ Access token není dostupný. Prosím, přihlaste se.");
    }

    try {
        console.log("📌 Odesílám požadavek na API:", `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`);

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Chyba při načítání dat z Google Sheets:", errorData);
            throw new Error(`Chyba API: ${errorData.error.message}`);
        }

        const data = await response.json();
        console.log("📊 API odpověď:", data);
        return data;
    } catch (error) {
        console.error("❌ Selhání načítání dat z Google Sheets:", error.message);
        throw error;
    }
}