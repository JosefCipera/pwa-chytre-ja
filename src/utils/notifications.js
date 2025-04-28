export const NOTIFICATIONS = {
    CHECK_DAILY: {
        message: "Kontrolujte termíny zakázek denně.",
        severity: "warning",
        duration: 8000
    },
    DATA_CHECK_OK: {
        message: "Kontrola dat dokončena: Vše v pořádku.",
        severity: "ok",
        duration: 8000
    },
    DATA_CHECK_ERROR: {
        message: "Kontrola dat dokončena: Nalezeny chyby v datech.",
        severity: "warning",
        duration: 8000
    },
    DATA_CHECK_FAILED: {
        message: "Chyba: Kontrola dat selhala. Prosím, zkuste to znovu.",
        severity: "urgent",
        duration: 8000
    }
};