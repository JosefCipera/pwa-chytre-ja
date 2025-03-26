export function showMicrophone() {
    const micIcon = document.getElementById("microphone");
    if (micIcon) {
        micIcon.style.display = "block";
        setTimeout(() => {
            micIcon.style.display = "none";
        }, 2000); // Skryje mikrofon po 2 sekundách
    }
}
export function displayVideo(url) {
    const output = document.getElementById('output');
    const container = document.querySelector('.container');
    const micIcon = document.getElementById('start-speech');
    
    console.log("🎥 Připravuji přehrání videa:", videoUrl);
    if (!url) {
        output.innerHTML = '<span class="status">Video nenalezeno</span>';
        return;
    }
    console.log("🎥 Připravuji přehrání videa:", videoUrl);
    
    const outputDiv = document.getElementById("output");
    outputDiv.innerHTML = `
        <iframe 
            width="560" 
            height="315" 
            src="${videoUrl}?origin=${window.location.origin}&rel=0&showinfo=0&modestbranding=1&controls=1" 
            frameborder="0" 
            allow="autoplay; encrypted-media" 
            allowfullscreen>
        </iframe>
         <button id="playVideo">▶️ Přehrát</button>
    `;
    
    // Skryjeme mikrofon a zobrazíme přehrávač
    micIcon.style.display = 'none';
    output.innerHTML = ''; // Vyčistíme obsah
    container.classList.add('video-active'); // Přidáme třídu pro stylování

    let videoElement;
    if (url.includes('youtube.com') || url.includes('vimeo.com')) {
        videoElement = document.createElement('iframe');
        videoElement.width = "100%";
        videoElement.height = "100%";
        videoElement.allow = "autoplay; fullscreen";
        videoElement.src = url.includes('youtube.com')
            ? `https://www.youtube.com/embed/${new URL(url).searchParams.get('v')}?autoplay=1`
            : `https://player.vimeo.com/video/${url.split('/').pop()}?autoplay=1`;
    } else {
        videoElement = document.createElement('video');
        videoElement.controls = true;
        videoElement.autoplay = true;
        videoElement.src = url;
        videoElement.style.width = "100%";
        videoElement.style.height = "100%";
    }

    output.appendChild(videoElement);

    // Po skončení videa vrátíme mikrofon
    videoElement.onended = () => {
        output.innerHTML = '<span class="status">Řekněte příkaz, např. "Přehrát video školení"</span>';
        micIcon.style.display = 'block';
        container.classList.remove('video-active'); // Odebereme třídu
    };
}
window.displayVideo = displayVideo;

