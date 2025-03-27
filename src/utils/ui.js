eport export function showMicrophone() {
    const micIcon = document.getElementById("microphone");
    if (micIcon) {
        micIcon.style.display = "block";
        setTimeout(() => {
            micIcon.style.display = "none";
        }, 2000); // Skryje mikrofon po 2 sekundách
    }
}
document.addEventListener("DOMContentLoaded", () => {
    console.log("📌 UI.js načteno - čekám na příkaz pro zobrazení videa");
});

export function displayVideo(videoUrl) {
    console.log("📺 Spouštím video:", videoUrl);

    const videoContainer = document.getElementById("video-container");
    const videoFrame = document.getElementById("video-frame");
    const mainContainer = document.querySelector(".main-container");

    if (!videoContainer || !videoFrame || !mainContainer) {
        console.error("❌ Chyba: Chybí HTML prvky pro video");
        return;
    }

    videoFrame.src = videoUrl;
    videoContainer.classList.remove("hidden");
    mainContainer.classList.add("hidden");

    console.log("✅ Video zobrazeno a mikrofon skryt");
}

function hideVideo() {
    const videoContainer = document.getElementById("video-container");
    const videoFrame = document.getElementById("video-frame");
    const mainContainer = document.querySelector(".main-container");

    if (!videoContainer || !videoFrame || !mainContainer) {
        console.error("❌ Chyba: Chybí HTML prvky pro video");
        return;
    }

    videoFrame.src = "";
    videoContainer.classList.add("hidden");
    mainContainer.classList.remove("hidden");

    console.log("🔄 Video skryto a mikrofon obnoven");
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

