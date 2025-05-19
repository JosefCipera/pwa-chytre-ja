export const GOOGLE_SHEETS_API_KEY = "AIzaSyBLmvNbI-ePMlAXNSdzEP_F6nQwYuk9uA4";
export const spreadsheetId = "1Y8Hzu2OWwq8SENpVSkWPhHHffptWsfD7arUraaRNN3E";
export const SHEET_NAME = "Data";
export const CLIENT_ID = "363128008732-krhn1kmoi32pugoek5qcvc9jus8lcuts.apps.googleusercontent.com";
export const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
export const SCOPES = "https://www.googleapis.com/auth/spreadsheets";
export const updateRange = "'Data'!A1:Z100";
export const GOOGLE_SHEET_URL = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}?key=${GOOGLE_SHEETS_API_KEY}`;

export const GOOGLE_SHEETS_SPREADSHEET_ID = "1GsMotMnkYHH6qicmpFiuq8OBGy5xA0S_JBnM3LlAnZI";
export const GOOGLE_SHEETS_LIST_NAME = "List 2";

export async function loadWebhook() {
    let webhookUrl = null;
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/'${GOOGLE_SHEETS_LIST_NAME}'!A:B?key=${GOOGLE_SHEETS_API_KEY}`;
        console.log("🔍 Načítám webhook z URL:", url);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Chyba při načítání webhooku: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const webhookRow = data.values.find(row => row[0] === "Webhook" || row[0] === "\"Webhook\"");
        if (webhookRow && webhookRow[1]) {
            // Odstranění uvozovek z URL
            webhookUrl = webhookRow[1].replace(/"/g, '');
            localStorage.setItem('webhookUrl', webhookUrl);
            console.log("🔗 Webhook načten z Google Sheets (List 2):", webhookUrl);
        } else {
            throw new Error("Webhook URL nenalezeno v listu List 2.");
        }
    } catch (error) {
        console.error("❌ Chyba při načítání webhooku:", error.message);
        webhookUrl = null;
    }
    return webhookUrl;
}