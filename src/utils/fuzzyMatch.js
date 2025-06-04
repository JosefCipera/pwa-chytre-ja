/**
 * Výpočet Levenshteinovy vzdálenosti mezi dvěma řetězci.
 * @param {string} a - První řetězec.
 * @param {string} b - Druhý řetězec.
 * @returns {number} - Vzdálenost (počet změn potřebných k převodu a na b).
 */
function levenshteinDistance(a, b) {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + indicator
            );
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Rozdělí řetězec na slova a vrátí seznam shod.
 * @param {string} input - Vstupní řetězec.
 * @param {string} command - Očekávaný příkaz.
 * @returns {number} - Počet shodných slov.
 */
function countWordMatches(input, command) {
    const inputWords = input.toLowerCase().split(/\s+/);
    const commandWords = command.toLowerCase().split(/\s+/);
    let matches = 0;

    inputWords.forEach(word => {
        if (commandWords.includes(word)) matches++;
    });

    return matches / Math.max(inputWords.length, commandWords.length); // Váha podle počtu shod
}

/**
 * Najde nejpodobnější příkaz ze seznamu očekávaných příkazů s fuzzy logikou.
 * @param {string} input - Vstupní příkaz od uživatele.
 * @param {string[]} commands - Seznam očekávaných příkazů.
 * @param {number} threshold - Minimální podobnost (0–1), výchozí 0.4.
 * @param {Object} synonyms - Slovník synonim (volitelné).
 * @returns {string|null} - Nejpodobnější příkaz, nebo null, pokud žádný není dostatečně podobný.
 */
function findClosestCommand(input, commands, threshold = 0.4, synonyms = {}) {
    let closestCommand = null;
    let highestScore = -Infinity;

    input = input.toLowerCase().trim();

    for (const command of commands) {
        const distance = levenshteinDistance(input, command.toLowerCase());
        const maxLength = Math.max(input.length, command.length);
        let similarity = 1 - distance / maxLength;

        // Váha podle shodných slov
        const wordMatchScore = countWordMatches(input, command);
        similarity = (similarity + wordMatchScore) / 2;

        // Kontrola synonim
        for (const [syn, orig] of Object.entries(synonyms)) {
            if (input.includes(syn.toLowerCase()) && orig === command) {
                similarity += 0.2; // Bonus za synonim
                break;
            }
        }

        if (similarity >= threshold && similarity > highestScore) {
            highestScore = similarity;
            closestCommand = command;
        }
    }

    return closestCommand;
}

// Příklad slovníku synonim (můžeš upravit podle potřeb Chytrého já)
const defaultSynonyms = {
    "spustit": "start",
    "zastavit": "stop",
    "ukázat": "show",
    "vysvětlit": "explain"
};

// Export funkcí a synonim
export { levenshteinDistance, findClosestCommand, defaultSynonyms };