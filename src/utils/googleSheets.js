import { GOOGLE_SHEETS_API_KEY, spreadsheetId, SHEET_NAME } from "./config.js"; // Upraven import

console.log("✅ Načtené ID tabulky:", spreadsheetId);
console.log("✅ Načtený název listu:", SHEET_NAME);

export async function updateSheetData(updatedData, range) {
    console.log("🔄 Aktualizuji Google Sheet...", { updatedData, range });

    try {
        console.log("📌 URL pro aktualizaci:", `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW&key=${GOOGLE_SHEETS_API_KEY}`);

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW&key=${GOOGLE_SHEETS_API_KEY}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
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
    console.log("📌 Odesílám požadavek na API:", `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${GOOGLE_SHEETS_API_KEY}`);

    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${GOOGLE_SHEETS_API_KEY}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
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