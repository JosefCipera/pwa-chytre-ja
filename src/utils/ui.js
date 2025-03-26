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

    console.log("🎥 Připravuji přehrání videa:", url);
    if (!url) {
        output.innerHTML = '<span class="status">⚠️ Video nenalezeno</span>';
        return;
    }

    console.log("📺 Otevírám video:", url);
    window.open(url, "_blank"); // Otevře video v nové záložce


    // Vyčistíme obsah výstupu
    output.innerHTML = '';

    // Skryjeme mikrofon
    micIcon.style.display = 'none';
    container.classList.add('video-active');

    let videoElement;
    if (url.includes('youtube.com') || url.includes('vimeo.com')) {
        // Převod URL na embed verzi
        const embedUrl = convertToEmbedUrl(url);
        videoElement = document.createElement('iframe');
        videoElement.width = "100%";
        videoElement.height = "100%";
        videoElement.allow = "autoplay; fullscreen";
        videoElement.src = embedUrl;
        videoElement.frameBorder = "0";
    } else {
        videoElement = document.createElement('video');
        videoElement.controls = true;
        videoElement.autoplay = true;
        videoElement.src = url;
        videoElement.style.width = "100%";
        videoElement.style.height = "100%";
    }

    // Tlačítko pro zavření videa
    const closeButton = document.createElement('button');
    closeButton.innerText = "❌ Zavřít video";
    closeButton.onclick = () => {
        output.innerHTML = '<span class="status">Řekněte příkaz, např. "Přehrát video školení"</span>';
        micIcon.style.display = 'block';
        container.classList.remove('video-active');
    };

    output.appendChild(videoElement);
    output.appendChild(closeButton);
}

// Převod YouTube a Vimeo URL na embed formát
export function convertToEmbedUrl(url) {
    try {
        let embedUrl = url;
        if (url.includes("youtube.com")) {
            const videoId = new URL(url).searchParams.get("v");
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        } else if (url.includes("vimeo.com")) {
            const videoId = url.split("/").pop();
            embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1`;
        }
        return embedUrl;
    } catch (error) {
        console.error("❌ Chyba při konverzi URL:", error);
        return url;
    }
}

window.displayVideo = displayVideo;

