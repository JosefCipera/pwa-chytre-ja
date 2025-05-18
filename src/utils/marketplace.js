document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.marketplace-item');

    items.forEach(item => {
        item.addEventListener('click', () => {
            const type = item.getAttribute('data-type');
            const url = item.getAttribute('data-url');
            const agent = item.getAttribute('data-agent');

            if (type && url) {
                const encodedUrl = encodeURIComponent(url);
                window.location.href = `media-results.html?type=${type}&url=${encodedUrl}`;
            } else if (agent) {
                console.log(`✅ Spouštím agenta: ${agent}`);
                const command = agent;  // Pouze "agent"
                fetch('https://hook.eu1.make.com/4jibyt5oj7j96mnuaiow2mnofgpfhomo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ command })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`❌ Chyba HTTP: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log("✅ Odpověď od Make.com:", data);
                        if (data.message) {
                            alert(data.message);
                        } else {
                            alert("Agent vrátil prázdnou odpověď.");
                        }
                    })
                    .catch(error => {
                        console.error(error);
                        alert(`Chyba při spuštění agenta ${agent}: ` + error.message);
                    });
            } else {
                console.error("Chybí typ, URL nebo agent:", item);
            }
        });
    });
});