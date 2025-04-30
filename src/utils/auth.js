// src/utils/auth.js
import { CLIENT_ID, SCOPES } from "./config.js";

let tokenClient;
let accessToken = null;

export function initGoogleAuth() {
    console.log("🔄 Inicializuji Google Identity Services...");
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (response) => {
                if (response.error) {
                    console.error("❌ Chyba při inicializaci GIS:", response.error);
                    throw new Error(response.error);
                }
                accessToken = response.access_token;
                console.log("✅ Přístupový token získán:", accessToken);
            },
        });
        console.log("✅ GIS inicializováno");
    } catch (error) {
        console.error("❌ Chyba při inicializaci GIS:", error);
        throw error;
    }
}

export function requestAccessToken() {
    console.log("🔑 Požaduji přístupový token...");
    if (!tokenClient) {
        throw new Error("GIS není inicializováno");
    }
    tokenClient.requestAccessToken();
}

export function getAccessToken() {
    console.log("🔑 Získávám přístupový token...");
    if (!accessToken) {
        console.log("⚠️ Token není dostupný, požaduji nový...");
        requestAccessToken();
        return null; // Token bude nastaven asynchronně v callbacku
    }
    console.log("✅ Přístupový token vrácen:", accessToken);
    return accessToken;
}

export async function signInAndRunCheck() {
    console.log("🔍 Spouštím přihlášení a kontrolu...");
    try {
        requestAccessToken();
        // Počkáme, až bude token dostupný (asynchronní callback)
        const token = await new Promise((resolve) => {
            const checkToken = setInterval(() => {
                if (accessToken) {
                    clearInterval(checkToken);
                    resolve(accessToken);
                }
            }, 100);
        });
        console.log("✅ Přihlášení a kontrola úspěšná, token:", token);
        return token;
    } catch (error) {
        console.error("❌ Chyba při přihlášení a kontrole:", error);
        throw error;
    }
}