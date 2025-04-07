// Pigeon images
const pigeons = [
    "images/pigeon1.png", "images/pigeon2.png", "images/pigeon3.png", 
    "images/pigeon4.png", "images/pigeon5.png", "images/pigeon6.png", "images/pigeon7.png"
];

// Bagel images
const bagels = [
    "images/bagel1.png", "images/bagel2.png", "images/bagel3.png", 
    "images/bagel4.png", "images/bagel5.png", "images/bagel6.png", "images/bagel7.png"
];

// Select the game area and buttons
const gameArea = document.getElementById("gameArea");
const buttonsContainer = document.querySelector(".bottom-homepage");

document.getElementById("launchPigeon").addEventListener("click", function() {
    expandGameArea();
    launchItem(pigeons);
});

document.getElementById("launchBagel").addEventListener("click", function() {
    expandGameArea();
    launchItem(bagels);
});

function expandGameArea() {
    gameArea.classList.add("expanded");
    buttonsContainer.style.position = "absolute";
    buttonsContainer.style.bottom = "20px";
    buttonsContainer.style.zIndex = "101";
}

// Function to launch a random image
function launchItem(images) {
    const img = document.createElement("img");
    img.src = images[Math.floor(Math.random() * images.length)];
    
    // Set styles for positioning
    img.style.position = "absolute";
    img.style.width = "100px";  
    img.style.height = "auto"; 
    img.style.left = Math.random() * (gameArea.clientWidth - 100) + "px";
    img.style.top = Math.random() * (gameArea.clientHeight - 100) + "px";

    gameArea.appendChild(img);
}

// Reset the game area and shrink it back
document.getElementById("startOver").addEventListener("click", function () {
    gameArea.innerHTML = ""; // Clear images
    gameArea.classList.remove("expanded"); // Shrink back to small view
    buttonsContainer.style.position = "static"; // Reset button position
});

const startOverBtn = document.getElementById('startOver'); 
const launchPigeon = document.getElementById('launchPigeon'); 
const launchBagel = document.getElementById('launchBagel');

launchPigeon.addEventListener('click', () => { startGame(); });

launchBagel.addEventListener('click', () => { startGame(); });

function startGame() { 
    document.getElementById('gameArea').style.display = 'block'; 
    startOverBtn.style.display = 'inline-block'; 
    document.querySelector('.launch-buttons') }

startOverBtn.addEventListener('click', () => { location.reload(); });
