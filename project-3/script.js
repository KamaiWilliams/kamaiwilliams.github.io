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

//Background images
const background = [
    "images/GameBG1.png", "images/GameBG2.png", "images/GameBG3.png"
]
let selectedBG = null; // will store the one background for this round

const gameArea = document.getElementById("gameArea");
const startOverBtn = document.getElementById("startOver");



// Select the game area and buttons
const buttonsContainer = document.querySelector(".bottom-homepage");

document.getElementById("launchPigeon").addEventListener("click", function () {
  expandGameArea();

  const pigeonCount = pigeonsOnScreen.length;
  const bagelCount = bagelsOnScreen.length;

  if (pigeonCount < 5) {
    // Let them build up the flock freely at first
    launchItem(pigeons, "pigeon");
  } else if (bagelCount >= pigeonCount / 2) {
    // Enforce balance once pigeon count reaches 5 or more
    launchItem(pigeons, "pigeon");
  } else {
    // Optional: feedback
    console.log("Too many pigeons, not enough bagels! 🥯");
  }
});
  
  document.getElementById("launchBagel").addEventListener("click", function () {
    expandGameArea();
    launchItem(bagels, "bagel");
  });

  function expandGameArea() {
    gameArea.style.display = 'block';
    gameArea.classList.add("expanded");
    buttonsContainer.style.position = "absolute";
    buttonsContainer.style.bottom = "20px";
    buttonsContainer.style.zIndex = "101";
  
    // Show the Start Over button
    startOverBtn.style.display = 'inline-block';
  
    // Set a random background only if we haven't set one yet
    if (!selectedBG) {
      selectedBG = background[Math.floor(Math.random() * background.length)];
      gameArea.style.backgroundImage = `url('${selectedBG}')`;
    }
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


const launchPigeon = document.getElementById('launchPigeon'); 
const launchBagel = document.getElementById('launchBagel');



startOverBtn.addEventListener('click', () => { location.reload(); });

function fadeOutAndRemove(el) {
  el.style.transition = "opacity 0.5s ease";
  el.style.opacity = "0";
  setTimeout(() => el.remove(), 500);
}

// Ecosystem logic
function updateEcosystem() {
  // If pigeons and bagels are equal, remove all bagels with a fade
  if (
    pigeonsOnScreen.length === bagelsOnScreen.length &&
    bagelsOnScreen.length > 0
  ) {
    while (bagelsOnScreen.length > 0) {
      const bagel = bagelsOnScreen.shift();
      if (bagel) fadeOutAndRemove(bagel);
    }
  }
}

