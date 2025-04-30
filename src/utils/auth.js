import { checkProductionData } from "../modules/dataCheck.js";

let accessToken = null;
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";
import { CLIENT_ID } from "./config.js";

let tokenClient;

export function initGoogleAuth() {
    console.log("🔄 Inicializuji Google OAuth...");

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        callback: (response) => {
            if (response.error) {
                console.error("❌ Chyba přihlášení:", response);
                return {
                    message: "Nepodařilo se přihlásit: " + response.error,
                    severity: "urgent"
                };
            }
            console.log("✅ Přihlášeno, token získán:", response.access_token);
            localStorage.setItem("accessToken", response.access_token);
            return checkProductionData();
        }
    });
}

// Funkce pro vynucení nového tokenu
function refreshAccessToken() {
    console.log("🔄 Žádám o nový přístupový token...");
    return new Promise((resolve, reject) => {
        tokenClient.requestAccessToken({
            prompt: "", // Umožní zobrazení přihlašovacího dialogu
            callback: (response) => {
                if (response.error) {
                    console.error("❌ Chyba při získání nového tokenu:", response);
                    reject(new Error("Nepodařilo se získat nový token: " + response.error));
                    return;
                }
                console.log("✅ Nový token získán:", response.access_token);
                localStorage.setItem("accessToken", response.access_token);
                resolve(response.access_token);
            }
        });
    });
}

// Funkce pro ověření tokenu a spuštění "kontrola dat"
async function signInAndRunCheck() {
    console.log("🔄 Spouštím signInAndRunCheck()...");

    let token = getAccessToken();

    if (token) {
        console.log("🔑 Přístupový token již existuje:", token);

        try {
            const response = await fetch("https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" + token);
            const data = await response.json();
            if (data.error) {
                console.warn("⚠️ Token je neplatný, obnovuji...");
                // Vymažeme neplatný token
                localStorage.removeItem("accessToken");
                token = await refreshAccessToken();
                return await checkProductionData();
            } else {
                console.log("✅ Token je platný, pokračuji...");
                return await checkProductionData();
            }
        } catch (error) {
            console.error("❌ Chyba při ověřování tokenu:", error);
            // Vymažeme neplatný token a zkusíme obnovit
            localStorage.removeItem("accessToken");
            try {
                token = await refreshAccessToken();
                return await checkProductionData();
            } catch (refreshError) {
                return {
                    message: "Chyba při obnově tokenu, prosím přihlaste se: " + refreshError.message,
                    severity: "urgent"
                };
            }
        }
    } else {
        console.log("⚠️ Žádný token, žádám o nový...");
        try {
            token = await refreshAccessToken();
            return await checkProductionData();
        } catch (error) {
            return {
                message: "Chyba při získání tokenu, prosím přihlaste se: " + error.message,
                severity: "urgent"
            };
        }
    }
}

// Funkce pro získání tokenu z localStorage
export function getAccessToken() {
    return localStorage.getItem("accessToken") || null;
}

export { signInAndRunCheck, refreshAccessToken };