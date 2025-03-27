document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ Dokument načten");
    console.log("📌 Video container:", document.getElementById("video-container"));
    console.log("📌 Video frame:", document.getElementById("video-frame"));
    console.log("📌 Close button:", document.getElementById("close-video"));
});

export function displayVideo(videoUrl) {
    let videoContainer = document.getElementById("video-container");
    let videoFrame = document.getElementById("video-frame");

    if (!videoContainer || !videoFrame) {
        console.error("❌ Chyba: Některý z HTML prvků pro video neexistuje.");
        return;
    }

    videoFrame.src = videoUrl;
    videoContainer.style.display = "block";
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

