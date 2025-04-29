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
 * Najde nejpodobnější příkaz ze seznamu očekávaných příkazů.
 * @param {string} input - Vstupní příkaz od uživatele.
 * @param {string[]} commands - Seznam očekávaných příkazů.
 * @param {number} threshold - Minimální podobnost (0–1), výchozí 0.4.
 * @returns {string|null} - Nejpodobnější příkaz, nebo null, pokud žádný není dostatečně podobný.
 */
function findClosestCommand(input, commands, threshold = 0.4) {
    let closestCommand = null;
    let lowestScore = Infinity;

    input = input.toLowerCase().trim();

    for (const command of commands) {
        const distance = levenshteinDistance(input, command.toLowerCase());
        const maxLength = Math.max(input.length, command.length);
        const similarity = 1 - distance / maxLength;

        if (similarity >= threshold && distance < lowestScore) {
            lowestScore = distance;
            closestCommand = command;
        }
    }

    return closestCommand;
}

// Export funkcí pro použití v jiných souborech
export { levenshteinDistance, findClosestCommand };