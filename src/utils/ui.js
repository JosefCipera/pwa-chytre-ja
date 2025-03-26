export function showMicrophone() {
    const micIcon = document.getElementById("microphone");
    if (micIcon) {
        micIcon.style.display = "block";
        setTimeout(() => {
            micIcon.style.display = "none";
        }, 2000); // Skryje mikrofon po 2 sekundách
    }
}
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM plně načten.");
    console.log("📌 video-container existuje?", document.getElementById("video-container"));
});
document.addEventListener("DOMContentLoaded", function () {
    displayVideo("https://www.youtube.com/embed/PXlpcD24Djo");
});

export function displayVideo(videoUrl) {
    console.log("📺 Spouštím video:", videoUrl);

    const videoContainer = document.getElementById("video-container");
    const videoFrame = document.getElementById("video-frame");

    if (!videoContainer || !videoFrame) {
        console.error("❌ Chyba: Kontejner pro video nebyl nalezen!");
        return;
    }

    // Převedeme URL na embed
    const embedUrl = convertToEmbedUrl(videoUrl);
    if (!embedUrl) {
        console.error("❌ Chyba: Neplatná URL pro vložení videa.");
        return;
    }

    // Použití YouTube API přehrávače
    videoFrame.src = embedUrl + "?autoplay=1&enablejsapi=1";
    
    console.log("🔍 video-container před zobrazením:", videoContainer.classList);
    videoContainer.classList.remove("hidden");
    console.log("✅ video-container po zobrazení:", videoContainer.classList);

    // Zobrazíme kontejner
    videoContainer.classList.remove("hidden");

    // Zavírací tlačítko
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

