// pigeon pics
const pigeons = [
    "images/pigeon1.png", "images/pigeon2.png", "images/pigeon3.png", 
    "images/pigeon4.png", "images/pigeon5.png", "images/pigeon6.png", "images/pigeon7.png"
];
// bagel pics
const bagels = [
    "images/bagel1.png", "images/bagel2.png", "images/bagel3.png", 
    "images/bagel4.png", "images/bagel5.png", "images/bagel6.png", "images/bagel7.png"
];

const gameArea = document.getElementById("gameArea");

document.getElementById("launchPigeon").addEventListener("click", function() {
    launchItem(pigeons);
});

document.getElementById("launchBagel").addEventListener("click", function() {
    launchItem(bagels);
});

// Function to launch a random image
function launchItem(images) {
    const img = document.createElement("img");
    img.src = images[Math.floor(Math.random() * images.length)];
    
    // Random position within game area
    img.style.left = Math.random() * (gameArea.clientWidth - 100) + "px";
    img.style.top = Math.random() * (gameArea.clientHeight - 100) + "px";

    gameArea.appendChild(img);
}
// Select the game area and the Start Over button
const startOverButton = document.getElementById("startOver");

startOverButton.addEventListener("click", function () {
    gameArea.innerHTML = ""; // Clear all images inside the game area
});