document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const reportUrl = urlParams.get('reportUrl');
    const dashboard = document.getElementById('looker-dashboard');

    console.log("🔗 Načtený reportUrl:", reportUrl);

    if (reportUrl) {
        const iframe = document.createElement('iframe');
        iframe.src = reportUrl;
        iframe.frameBorder = '0';
        iframe.style.border = '0';
        iframe.style.width = '100%'; // Explicitní šířka
        iframe.style.height = '100%'; // Explicitní výška
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('sandbox', 'allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
        iframe.onerror = () => console.error("❌ Chyba při načítání iframe na mobilu");
        iframe.onload = () => console.log("✅ Iframe načten na mobilu");
        dashboard.appendChild(iframe);
        console.log("✅ Iframe vložen:", iframe.src);
    } else {
        dashboard.innerHTML = '<p>Chyba: Nebyl zadán odkaz na report.</p>';
        console.error("❌ Žádný reportUrl v URL parametrech");
    }
});