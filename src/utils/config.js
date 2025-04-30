export const GOOGLE_SHEETS_API_KEY = "AIzaSyBLmvNbI-ePMlAXNSdzEP_F6nQwYuk9uA4";
export const spreadsheetId = "1Y8Hzu2OWwq8SENpVSkWPhHHffptWsfD7arUraaRNN3E"; // ✅ ID tabulky
export const SHEET_NAME = "Data"; // Název listu v tabulce
// Hodnoty pro autentizaci přes gapi (nepoužíváme teď, ale necháme pro budoucnost)
export const CLIENT_ID = "363128008732-krhn1kmoi32pugoek5qcvc9jus8lcuts.apps.googleusercontent.com";
export const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
export const SCOPES = "https://www.googleapis.com/auth/spreadsheets";
export const updateRange = "'Data'!A1:Z100"; // ✅ Rozsah v listu

// URL pro přístup k Google Sheets přes API klíč
export const GOOGLE_SHEET_URL = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}?key=${GOOGLE_SHEETS_API_KEY}`;

export const GOOGLE_SHEETS_SPREADSHEET_ID = "1GsMotMnkYHH6qicmpFiuq8OBGy5xA0S_JBnM3LlAnZI";
export const GOOGLE_SHEETS_LIST_NAME = "List2";