export function showMicrophone() {
    const micIcon = document.getElementById("microphone");
    if (micIcon) {
        micIcon.style.display = "block";
        setTimeout(() => {
            micIcon.style.display = "none";
        }, 2000); // Skryje mikrofon po 2 sekundách
    }
}
export function displayVideo(videoUrl) {
    console.log("📺 Spouštím video:", videoUrl);

    const videoContainer = document.getElementById("video-container");
    const videoFrame = document.getElementById("video-frame");

    if (!videoContainer || !videoFrame) {
        console.error("❌ Chyba: Kontejner pro video nebyl nalezen!");
        return;
    }

    // Převedeme URL na embed (pokud už není)
    const embedUrl = convertToEmbedUrl(videoUrl);
    
    if (!embedUrl) {
        console.error("❌ Chyba: Neplatná URL pro vložení videa.");
        return;
    }

    // Nastavíme video a zobrazíme ho
    videoFrame.src = embedUrl;
    videoContainer.classList.remove("hidden");

    // Po zavření video zastavíme
    document.getElementById("close-video").addEventListener("click", () => {
        videoContainer.classList.add("hidden");
        videoFrame.src = ""; // Resetujeme zdroj videa
    });
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

