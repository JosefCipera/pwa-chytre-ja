import { fetchSheetData, updateSheetData } from "../utils/googleSheets.js";
import { spreadsheetId, updateRange } from "../utils/config.js";

export async function checkProductionData() {
    console.log("✅ Spouštím kontrolu výroby...");

    try {
        // Získáme data z tabulky
        const sheetData = await fetchSheetData(spreadsheetId, updateRange);

        if (!sheetData || !sheetData.values || sheetData.values.length < 2) {
            console.error("❌ Chyba: Data nejsou dostupná nebo tabulka je prázdná.");
            return {
                message: "Chyba: Data nejsou dostupná nebo tabulka je prázdná.",
                severity: "urgent"
            };
        }

        // Zpracujeme data
        const headers = sheetData.values[0]; // Hlavička tabulky
        console.log("📊 Hlavičky tabulky:", headers);

        const indexIDZakazky = headers.indexOf("ID zakázky");
        const indexPrubeznaDoba = headers.indexOf("Průběžná doba");
        const indexStav = headers.indexOf("Stav");
        const indexTerminDodani = headers.indexOf("Termín dodání");
        const indexVyrobitKs = headers.indexOf("Vyrobit ks");
        const indexKontrolaDat = headers.indexOf("Kontrola dat");

        if ([indexIDZakazky, indexPrubeznaDoba, indexStav, indexTerminDodani, indexVyrobitKs, indexKontrolaDat].includes(-1)) {
            console.error("❌ Chyba: Jeden nebo více požadovaných sloupců nebylo nalezeno.");
            return {
                message: "Chyba: Jeden nebo více požadovaných sloupců nebylo nalezeno.",
                severity: "urgent"
            };
        }

        let hasErrors = false;
        const updatedValues = sheetData.values.map((row, rowIndex) => {
            if (rowIndex === 0) return row; // Přeskočíme hlavičku

            let errors = [];

            // ✅ Správná kontrola chybějících polí (trim() řeší mezery, !! převádí na boolean)
            if (!row[indexIDZakazky] || row[indexIDZakazky].trim() === "") {
                errors.push("ID zakázky");
            }
            if (!row[indexPrubeznaDoba] || row[indexPrubeznaDoba].trim() === "" || Number(row[indexPrubeznaDoba]) <= 0) {
                errors.push("průběžná doba");
            }
            if (!row[indexStav] || row[indexStav].trim() === "") {
                errors.push("stav zakázky");
            }
            if (!row[indexTerminDodani] || row[indexTerminDodani].trim() === "") {
                errors.push("termín dodání");
            }
            if (!row[indexVyrobitKs] || row[indexVyrobitKs].trim() === "" || Number(row[indexVyrobitKs]) <= 0) {
                errors.push("vyrobit kusů");
            }

            if (errors.length > 0) {
                hasErrors = true;
            }
            row[indexKontrolaDat] = errors.length > 0 ? errors.join(", ") : "ok";
            return row;
        });

        console.log("✅ Upravená data pro zápis:", updatedValues);
        await updateSheetData(updatedValues, updateRange); // Přidáme range

        // Vrátíme výsledek pro notifikaci
        if (hasErrors) {
            return {
                message: "Kontrola dat dokončena: Nalezeny chyby v datech.",
                severity: "warning"
            };
        } else {
            return {
                message: "Kontrola dat dokončena: Vše v pořádku.",
                severity: "ok"
            };
        }
    } catch (error) {
        console.error("❌ Chyba při kontrole dat:", error);
        return {
            message: "Chyba při kontrole dat: " + error.message,
            severity: "urgent"
        };
    }
}