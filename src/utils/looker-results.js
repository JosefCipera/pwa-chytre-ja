document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const reportUrl = urlParams.get('reportUrl');
    const dashboard = document.getElementById('looker-dashboard');

    if (reportUrl) {
        const iframe = document.createElement('iframe');
        iframe.src = reportUrl;
        iframe.frameBorder = '0';
        iframe.style.border = '0';
        iframe.setAttribute('allowfullscreen', '');
        dashboard.appendChild(iframe);
    } else {
        dashboard.innerHTML = '<p>Chyba: Nebyl zadán odkaz na report.</p>';
    }
});