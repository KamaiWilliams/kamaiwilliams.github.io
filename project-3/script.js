let pigeonsOnScreen = [];
let bagelsOnScreen = [];

let pigeonCount = 0;
let bagelCount = 0;

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

document.getElementById("launchPigeon").addEventListener("click", function () {
    expandGameArea();
    launchItem(pigeons, "pigeon");
  });
  
  document.getElementById("launchBagel").addEventListener("click", function () {
    expandGameArea();
    launchItem(bagels, "bagel");
  });

function expandGameArea() {
    gameArea.style.display = 'block'; // Show game area before applying class
    gameArea.classList.add("expanded");
    buttonsContainer.style.position = "absolute";
    buttonsContainer.style.bottom = "20px";
    buttonsContainer.style.zIndex = "101";
  }

//launch pigeons and bagels
function launchItem(images, type) {
    const img = document.createElement("img");
    img.src = images[Math.floor(Math.random() * images.length)];
    img.style.position = "absolute";
    img.style.width = "100px";
    img.style.height = "auto";
    img.style.left = Math.random() * (gameArea.clientWidth - 100) + "px";
    img.style.top = Math.random() * (gameArea.clientHeight - 100) + "px";
  
    gameArea.appendChild(img);
  
    if (type === "pigeon") {
      pigeonsOnScreen.push(img);
    } else if (type === "bagel") {
      bagelsOnScreen.push(img);
    }
  
    updateEcosystem();
   // Call the balance logic each time you add something
  

    //pigeon and bagel positioning on game screen
    img.style.position = "absolute";
    img.style.width = "100px";  
    img.style.height = "auto"; 
    img.style.left = Math.random() * (gameArea.clientWidth - 100) + "px";
    img.style.top = Math.random() * (gameArea.clientHeight - 100) + "px";

    gameArea.appendChild(img);
}

// Reset the game area and shrink it back
document.getElementById("startOver").addEventListener("click", function () {
    gameArea.innerHTML = ""; // get rid of bagels and pigeons on screen
    gameArea.classList.remove("expanded"); // shrink back to home view
    buttonsContainer.style.position = "static"; // "Start Over" button position
});

const startOverBtn = document.getElementById('startOver'); 
const launchPigeon = document.getElementById('launchPigeon'); 
const launchBagel = document.getElementById('launchBagel');

function startGame() { 
    document.getElementById('gameArea').style.display = 'block'; 
    startOverBtn.style.display = 'inline-block'; 
    document.querySelector('.launch-buttons') }

    launchPigeon.addEventListener('click', () => { startGame(); });

    launchBagel.addEventListener('click', () => { startGame(); });


startOverBtn.addEventListener('click', () => { location.reload(); });

function updateEcosystem() {
    // Bagels disappear when outnumbered by pigeons
    while (pigeonsOnScreen.length > bagelsOnScreen.length && bagelsOnScreen.length > 0) {
      const bagel = bagelsOnScreen.shift(); // remove the oldest bagel
      if (bagel && bagel.remove) bagel.remove();
    }
  
    // Pigeons disappear if there are no bagels left
    if (bagelsOnScreen.length === 0 && pigeonsOnScreen.length > 8) {
      const pigeonsToRemove = Math.floor(pigeonsOnScreen.length / 2); // can adjust ratio
      for (let i = 0; i < pigeonsToRemove && pigeonsOnScreen.length > 0; i++) {
        const pigeon = pigeonsOnScreen.shift();
        if (pigeon && pigeon.remove) pigeon.remove();
      }
    }
  }

  function fadeOutAndRemove(el) {
    el.style.transition = "opacity 0.5s ease";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 500);
  }