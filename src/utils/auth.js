import { checkProductionData } from "../modules/dataCheck.js";

// export const updateRange = "'Data'!A1:Q3"; // ✅ Správný list

let accessToken = null;
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";
import { CLIENT_ID } from "./config.js"; // ✅ Import CLIENT_ID z config.js

let tokenClient; // 🟢 Deklarujeme globálně, ale inicializujeme až v `initGoogleAuth()`

export function initGoogleAuth() {
    console.log("🔄 Inicializuji Google OAuth...");

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: "https://www.googleapis.com/auth/spreadsheets", // ✅ Oprávnění pro zápis do Sheets
        callback: (response) => {
            if (response.error) {
                console.error("❌ Chyba přihlášení:", response);
                return;
            }
            console.log("✅ Přihlášeno, token získán:", response.access_token);
            localStorage.setItem("accessToken", response.access_token);
            checkProductionData(); // ✅ Po získání tokenu spustíme kontrolu dat
        }
    });
}

// 🔄 Funkce pro vynucení nového tokenu
function refreshAccessToken() {
    console.log("🔄 Žádám o nový přístupový token...");
    tokenClient.requestAccessToken({
        // prompt: "consent", // 🟢 Nutí uživatele schválit oprávnění znovu
        prompt: "none", // uživatel nemusí schvalovat oprávnění
        callback: (response) => {
            if (response.error) {
                console.error("❌ Chyba při získání nového tokenu:", response);
                return;
            }
            console.log("✅ Nový token získán:", response.access_token);
            localStorage.setItem("accessToken", response.access_token);
            checkProductionData(); // 🟢 Po získání tokenu spustíme kontrolu dat
        }
    });
}

// 🔍 Funkce pro ověření tokenu a spuštění "kontrola dat"
function signInAndRunCheck() {
    console.log("🔄 Spouštím signInAndRunCheck()...");

    const token = getAccessToken();

    if (token) {
        console.log("🔑 Přístupový token již existuje:", token);

        // 🟢 Ověříme platnost tokenu
        fetch("https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" + token)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.warn("⚠️ Token je neplatný, obnovuji...");
                    refreshAccessToken(); // 🔄 Pokud je token neplatný, získáme nový
                } else {
                    console.log("✅ Token je platný, pokračuji...");
                    checkProductionData(); // ✅ Pokud je token platný, spustíme kontrolu dat
                }
            })
            .catch(error => console.error("❌ Chyba při ověřování tokenu:", error));
    } else {
        console.log("⚠️ Žádný token, žádám o nový...");
        refreshAccessToken();
    }
}

// 🟢 Funkce pro získání tokenu z localStorage
export function getAccessToken() {
    return localStorage.getItem("accessToken") || null;
}

export { signInAndRunCheck, refreshAccessToken };
