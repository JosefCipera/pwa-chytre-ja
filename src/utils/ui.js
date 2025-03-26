export function showMicrophone() {
    const micIcon = document.getElementById("microphone");
    if (micIcon) {
        micIcon.style.display = "block";
        setTimeout(() => {
            micIcon.style.display = "none";
        }, 2000); // Skryje mikrofon po 2 sekundách
    }
}
function displayVideo(videoUrl) {
    console.log("📺 Otevírám video:", videoUrl);
    window.open(videoUrl, "_blank"); // Otevře video v nové záložce
}


window.displayVideo = displayVideo;

