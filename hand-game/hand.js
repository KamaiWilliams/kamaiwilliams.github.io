console.log("hand.js loaded");


const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");

const exerciseOrder = ["piano", "duck", "hook", "finalSqueeze"];

function canTriggerFistFast() {
  if (fistCooldown) return false;
  fistCooldown = true;
  setTimeout(() => fistCooldown = false, 400); // shorter cooldown feels better
  return true;
}

const burstSound = new Audio("sound/fx35.wav");
burstSound.volume = 0.4;



let gameStarted = false;
let introActive = false;

let introShownForExercise = {};

let duckSpawnInterval = null;


const STAR_STYLES = {
  fingerSize: 20,
  gridSize: 24,
  fallingSize: 14,
  burstMin: 3,
  burstMax: 6
};

STAR_STYLES.fingerSize
STAR_STYLES.gridSize

let exerciseIntroActive = false;

const exerciseIntroEl = document.getElementById("exercise-intro");
const exerciseIntroText = document.getElementById("exercise-intro-text");

function showExerciseIntro() {
  // ✅ Only show intro for RIGHT hand, once per exercise
  if (activeHand !== "right") return;
  if (introShownForExercise[currentExercise]) return;

  introShownForExercise[currentExercise] = true;

  exerciseIntroActive = true;
  gameStarted = false;

  exerciseIntroText.innerHTML = `
    <div class="exercise-text">
      ${exerciseInstructions[currentExercise].right}
    </div>
    <div class="exercise-hint">
      Make a fist to start
    </div>
  `;

  exerciseIntroEl.style.display = "flex";
  document.getElementById("ui-overlay").style.display = "none";

}


function hideExerciseIntro() {
  exerciseIntroActive = false;
  gameStarted = true;
  roundStartTime = Date.now();
  exerciseIntroEl.style.display = "none";

  document.getElementById("ui-overlay").style.display = "flex";


  // 🦆 START DUCK SPAWNING WHEN GAMEPLAY ACTUALLY STARTS
  if (currentExercise === "duck") {
    clearInterval(duckSpawnInterval);
    duckSpawnInterval = setInterval(spawnDuckDot, 900);
  }
}



let finalStar = null;

let finalPhase = "open"; // open → grabbing → squeezed → released

function spawnFinalStar() {
  const margin = 120; // keeps star comfortably on screen

  finalStar = {
    x: margin + Math.random() * (canvas.width - margin * 2),
    y: margin + Math.random() * (canvas.height - margin * 2),
    radius: 70,
    color: fingerColors[Math.floor(Math.random() * fingerColors.length)]
  };

  finalPhase = "open";
}


function getFistCurlAmount(landmarks) {
  const tips = [4, 8, 12, 16, 20];
  let curl = 0;

  tips.forEach(i => {
    const pip = i === 4 ? landmarks[3] : landmarks[i - 2];
    curl += pip.y - landmarks[i].y;
  });

  return curl;
}

function updateFinalSqueeze(landmarks) {
  if (!finalStar) return;

  const curl = getFistCurlAmount(landmarks);

  const closed = curl > 0.4;
  const open = curl < 0.15;

  // OPEN → GRABBING
  if (finalPhase === "open" && !open) {
    finalPhase = "grabbing";
  }

  // GRABBING → SQUEEZED
  if (finalPhase === "grabbing") {
    finalStar.radius = Math.max(25, finalStar.radius - 1.2);
    if (closed) finalPhase = "squeezed";
  }

  // SQUEEZED → RELEASED
  if (finalPhase === "squeezed" && open) {
    createStarBurst(finalStar.x, finalStar.y, finalStar.color);
    starCount += 1;
    finalStar = null;

    setTimeout(spawnFinalStar, 600);
    finalPhase = "released";
  }
}

function drawFinalStar() {
  if (!finalStar) return;
  drawStar(finalStar.x, finalStar.y, finalStar.radius, finalStar.color);
}



// --------------------
// Hook Tendon Glide state
// --------------------
let hookStarCount = 1;

// --------------------
// NEW Hook Tendon Glide system
// --------------------
let hookField = {
  stars: [],
  phase: "open", // "open" → "curled" → "released"
  maxRadius: 60,
  minRadius: 20,
  resetRadius: 30
};

function spawnHookField(targetCount) {
  const existing = hookField.stars.length;
  const toAdd = targetCount - existing;
  if (toAdd <= 0) return;

  const spreadX = canvas.width * 0.7;
  const spreadY = canvas.height * 0.6;

  for (let i = 0; i < toAdd; i++) {
    setTimeout(() => {
      hookField.stars.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * spreadX,
        y: canvas.height / 2 + (Math.random() - 0.5) * spreadY,
        radius: hookField.maxRadius,
        color: fingerColors[Math.floor(Math.random() * fingerColors.length)]
      });
    }, i * 180); // ⭐ stagger timing
  }

  hookField.phase = "open";
}


function getHookCurlAmount(landmarks) {
  const tips = [4, 8, 12, 16, 20];
  let curl = 0;

  tips.forEach(i => {
    let pip = i === 4 ? landmarks[3] : landmarks[i - 2];
    curl += pip.y - landmarks[i].y;
  });

  return curl;
}

function updateHookExercise(landmarks) {
  const curl = getHookCurlAmount(landmarks);

  // thresholds (VERY important feel-tuning)
  const curlClosed = curl > 0.35;
  const curlOpen = curl < 0.15;

  // 1️⃣ OPEN → CURLED
  if (hookField.phase === "open" && curlClosed) {
    hookField.stars.forEach(s => {
      s.radius += (hookField.minRadius - s.radius) * 0.35;
    });
    
    hookField.phase = "curled";
  }

  // 2️⃣ CURLED → RELEASED (partial open)
  if (hookField.phase === "curled" && curlOpen) {
    hookField.stars.forEach(s => s.radius = hookField.resetRadius);
    hookField.phase = "released";
  }

  
 /// 3️⃣ RELEASED → CURLED AGAIN = BURST
if (hookField.phase === "released" && curlClosed) {

  // 💥 burst all current stars
  hookField.stars.forEach(s => {
    createStarBurst(s.x, s.y, s.color);
  });

  starCount += hookField.stars.length;

  // 🫥 clear field
  hookField.stars = [];

  // ⭐ increase difficulty by ONE
  hookStarCount += 1;

  // 🌌 respawn fresh random stars
  spawnHookField(hookStarCount);

  hookField.phase = "curled"; // lock
}




}

function drawHookStars() {
  hookField.stars.forEach(s => {
    drawStar(s.x, s.y, s.radius, s.color);
  });
}


function getFingerCurl(landmarks, tipIndex) {
  let pip;

  // Thumb uses joint 3, not tipIndex - 2
  if (tipIndex === 4) {
    pip = landmarks[3];
  } else {
    pip = landmarks[tipIndex - 2];
  }

  const tip = landmarks[tipIndex];

  return pip.y - tip.y;
}





startBtn.addEventListener("click", () => {
  startScreen.style.display = "none";
  document.getElementById("intro-screen").style.display = "flex";
  introActive = true;
});


const uiOverlay = document.getElementById("ui-overlay");
const timerEl = document.getElementById("timer");
const instructionEl = document.getElementById("instruction");
const starEl = document.getElementById("star-counter");


function showGameUI() {
  uiOverlay.style.display = "flex";
  timerEl.style.display = "block";
  instructionEl.style.display = "block";
  starEl.style.display = "block";
}

function hideGameUI() {
  uiOverlay.style.display = "none";
  timerEl.style.display = "none";
  instructionEl.style.display = "none";
  starEl.style.display = "none";
}


function updateUI() {
  if (!gameStarted || exerciseIntroActive) {
    // hide UI completely
    uiOverlay.style.display = "none";
    return;
  }

  // show UI
  uiOverlay.style.display = "flex";

  const remaining = Math.max(0, ROUND_DURATION - (Date.now() - roundStartTime)) / 1000;
  timerEl.textContent = `${activeHand.toUpperCase()} hand — ${Math.ceil(remaining)}s`;

  instructionEl.textContent = exerciseInstructions[currentExercise][activeHand];
  starEl.textContent = `★ ${starCount}`;
}



function isFistClosed(landmarks) {
  const fingertips = [8, 12, 16, 20];
  let curl = 0;

  fingertips.forEach(i => {
    const tip = landmarks[i];
    const pip = landmarks[i - 2];
    curl += Math.abs(tip.y - pip.y);
  });

  return curl < 0.12; // same threshold you already use
}

let fistHoldStart = null;

function canTriggerFist() {
  if (fistCooldown) return false;

  if (isFistClosed(lastLandmarks)) {
    if (!fistHoldStart) fistHoldStart = Date.now();
    if (Date.now() - fistHoldStart > 250) { // hold for 0.25s
      fistCooldown = true;
      setTimeout(() => fistCooldown = false, 800);
      fistHoldStart = null;
      return true;
    }
  } else {
    fistHoldStart = null;
  }

  return false;
}

const endScreen = document.getElementById("end-screen");
const finalStars = document.getElementById("final-stars");
const restartBtn = document.getElementById("restart-btn");

let lastScore = null;

function endGame() {
  gameStarted = false;

  // update scores
  finalStars.textContent = starCount;

  const lastScoreEl = document.getElementById("last-score");
  if (lastScore !== null) {
    lastScoreEl.textContent = lastScore;
  }

  // save for next round
  lastScore = starCount;

  // show styled HTML end screen
  endScreen.classList.remove("hidden");
}


restartBtn.addEventListener("click", () => {
  // hide end screen
  endScreen.classList.add("hidden");

  // reset game state
  starCount = 0;
  currentExercise = "piano";
  activeHand = "right";
  introShownForExercise = {};
  fallingDots = [];
  starBursts = [];
  hookField.stars = [];
  duckSpawnInterval && clearInterval(duckSpawnInterval);

  // reset UI + flow
  gameStarted = false;
  introActive = false;
  exerciseIntroActive = false;

  // show start screen again
  startScreen.style.display = "flex";
});



const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let lastLandmarks = null;
const fingerColors = ["#5c7aff", "#ffff3f", "#f72585", "#ff801e", "#aacc00"];

let activeHand = "right"; // "right" or "left"
let roundStartTime = Date.now();
const ROUND_DURATION = 30_000; // 30 seconds

let currentExercise = "piano";



let pianoDots = [];
const MAX_PIANO_DOTS = 3;

let starCount = 0;

const fingertipMap = [
  { index: 4,  name: "thumb",  color: fingerColors[4] },  // NEW
  { index: 8,  name: "index",  color: fingerColors[0] },
  { index: 12, name: "middle", color: fingerColors[1] },
  { index: 16, name: "ring",   color: fingerColors[2] },
  { index: 20, name: "pinky",  color: fingerColors[3] }
];




function spawnPianoGrid() {
  pianoDots = [];

  // ⭐ Visual tuning
  const radius = 25;        // star size
  const spacing = 60;       // distance between stars
  const margin = 80;        // safe screen margin (IMPORTANT)

  // 🧠 Available drawing area
  const usableWidth = canvas.width - margin * 2;
  const usableHeight = canvas.height - margin * 2;

  // 🧮 Responsive grid count
  const cols = Math.floor(usableWidth / spacing);
  const rows = Math.floor(usableHeight / spacing);

  // 🧩 Actual grid size
  const gridWidth = (cols - 1) * spacing;
  const gridHeight = (rows - 1) * spacing;

  // 🎯 Center grid within usable area
  const startX = margin + (usableWidth - gridWidth) / 2;
  const startY = margin + (usableHeight - gridHeight) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = fingerColors[Math.floor(Math.random() * fingerColors.length)];

      pianoDots.push({
        x: startX + c * spacing,
        y: startY + r * spacing,
        radius,
        color,
        alive: true
      });
    }
  }
}


function drawStar(x, y, radius, color, points = 5) {
  const innerRadius = radius * 0.45;
  ctx.beginPath();
  ctx.moveTo(x, y - radius);

  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i;
    const r = i % 2 === 0 ? radius : innerRadius;
    ctx.lineTo(
      x + Math.sin(angle) * r,
      y - Math.cos(angle) * r
    );
  }

  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}


function drawPianoGrid() {
  pianoDots.forEach(dot => {
    if (!dot.alive) return;

    drawStar(dot.x, dot.y, dot.radius, dot.color);

  });
}

function updatePianoInteraction(landmarks) {
  let motion = 0;

  fingertipMap.forEach(finger => {
    const tip = landmarks[finger.index];
    const pip = landmarks[finger.index - 2];
    motion += Math.hypot(tip.x - pip.x, tip.y - pip.y);
  });

  // Require real piano wiggle
  if (motion < 0.04) return;

  fingertipMap.forEach(finger => {
    const tip = landmarks[finger.index];
    const fx = tip.x * canvas.width;
    const fy = tip.y * canvas.height;

    pianoDots.forEach(dot => {
      if (!dot.alive) return;
      if (dot.color !== finger.color) return;

      const dist = Math.hypot(dot.x - fx, dot.y - fy);
      if (dist < dot.radius + 12) {
        dot.alive = false;
        createStarBurst(dot.x, dot.y, dot.color);
        starCount += 1;
      }
    });
  });
}





const exerciseInstructions = {
  piano: {
    right: "Wiggle your fingers to burst the stars",
    left:  "Wiggle your fingers to burst the stars"
  },
  duck: {
    right: "Now EAT the circles. Turn your palm to the left, open/close like an alligator.",
    left:  " Now EAT the circles. Turn your palm to the right and open/close like an alligator."
  },
  hook: {
    right: "Curl your fingers like a hook, flick open, repeat.",
    left:  "Curl your fingers like a hook, flick open, repeat."
  },
  finalSqueeze: {
    right: "GRAB the stars! Make a fist, squeeze gently, then slowly release.",
    left: "GRAB the stars! Make a fist, squeeze gently, then slowly release."
  }
  
};



let fingerMotionEnergy = 0;

// --------------------
// Falling dots and star bursts
// --------------------
let fallingDots = [];
let starBursts = [];
const dotColors = fingerColors;

// Motion-based dot spawn timing
let lastSpawn = 0;
const SPAWN_RATE = 300; // ms

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r},${g},${b}`;
}

// --------------------
// Finger Roll Logic
// --------------------
function getHandCurl(landmarks) {
  const tips = [8,12,16,20];
  const pips = [6,10,14,18];
  let curl = 0;
  tips.forEach((t,i)=>{
    curl += landmarks[pips[i]].y - landmarks[t].y;
  });
  return curl;
}



// --------------------
// Canvas sizing
// --------------------
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// 🔁 Rebuild piano grid on resize
window.addEventListener("resize", spawnPianoGrid);

spawnPianoGrid();


// --------------------
// MediaPipe Hands
// --------------------
const hands = new Hands({
  locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  selfieMode: true,
  modelComplexity: 0
});

hands.onResults(onResults);

// --------------------
// Camera
// --------------------
const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 1280,
  height: 720
});
camera.start();

// --------------------
// Results callback
// --------------------
function onResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    lastLandmarks = results.multiHandLandmarks[0];

// ✊ INITIAL INTRO → START GAME
if (
  introActive &&
  isFistClosed(lastLandmarks) &&
  canTriggerFist()
) {
  hideInitialIntro();
  return;
}

// ✊ EXERCISE INTRO → START EXERCISE (FAST, like initial intro)
if (
  exerciseIntroActive &&
  isFistClosed(lastLandmarks) &&
  canTriggerFist()

) {
  hideExerciseIntro();
}



    
  } else {
    lastLandmarks = null;
  }
}

let fistCooldown = false;

function canTriggerFist() {
  if (fistCooldown) return false;
  fistCooldown = true;
  setTimeout(() => fistCooldown = false, 800);
  return true;
}

// --------------------
// Draw functions
// --------------------
function drawHand(landmarks) {
  fingertipMap.forEach(finger => {
    const p = landmarks[finger.index];
    drawStar(
      p.x * canvas.width,
      p.y * canvas.height,
      20,                 // fingertip size
      finger.color
    );
  });
}





function updateDuckDots() {
  fallingDots.forEach(dot => {
    // move horizontally based on active hand
    if (activeHand === "right") {
      dot.x += dot.speedX || 3; // move rightwards
    } else {
      dot.x -= dot.speedX || 3; // move leftwards
    }

    // draw the circle
    drawStar(dot.x, dot.y, dot.radius, dot.color);

  });

  // remove offscreen dots
  fallingDots = fallingDots.filter(dot => dot.x < canvas.width + 50 && dot.x > -50);
}

function checkDuckDotHits(landmarks) {
  if (!landmarks) return;

  const fingertipIndices = [8, 12, 16, 20];

  fallingDots.forEach((dot, dotIdx) => {
    fingertipIndices.forEach(i => {
      const tip = landmarks[i];
      const fingerX = tip.x * canvas.width;
      const fingerY = tip.y * canvas.height;

      const dist = Math.hypot(dot.x - fingerX, dot.y - fingerY);
      if (dist < dot.radius + 6) {
        createStarBurst(dot.x, dot.y, dot.color);
        fallingDots.splice(dotIdx, 1);
        starCount += 1; // ⭐ ADD THIS
      }
      
    });
  });
}


// spawn duck dot from the side
function spawnDuckDot() {
  let x = activeHand === "right" ? -20 : canvas.width + 20;
  let y = Math.random() * canvas.height * 0.8 + 20;
  fallingDots.push({
    x,
    y,
    radius: 25,
    speedX: 2 + Math.random() * 2,
    color: dotColors[Math.floor(Math.random() * dotColors.length)]
  });
}






function createStarBurst(x, y, color) {
  
   // 🔊 play burst sound
   const sound = burstSound.cloneNode();
   sound.volume = 0.2;
   sound.play();
 
  for (let i = 0; i < 10; i++) {
    starBursts.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,

      alpha: 1,
      color,
      radius: 2 + Math.random() * 20

    });
  }
}

function drawStarBursts() {
  starBursts.forEach((s, idx) => {
    drawStar(s.x, s.y, s.radius, s.color);

    s.x += s.vx;
    s.y += s.vy;
    s.alpha -= 0.05;

    if (s.alpha <= 0) starBursts.splice(idx, 1);
  });
}






function updateHandRound() {
  const elapsed = Date.now() - roundStartTime;
  if (elapsed <= ROUND_DURATION) return;

  // 🛑 stop duck spawns if needed
  if (currentExercise === "duck" && duckSpawnInterval) {
    clearInterval(duckSpawnInterval);
    duckSpawnInterval = null;
  }

  // --- FINAL END CONDITION ---
  if (currentExercise === "finalSqueeze" && activeHand === "left") {
    endGame();
    return;
  }
  // --- FINAL END CONDITION ---
  if (currentExercise === "finalSqueeze" && activeHand === "left") {
    endGame();
    return;
  }

  // --- HAND SWITCH ---
  if (activeHand === "right") {
    // move to LEFT hand
    activeHand = "left";
  } else {
    // LEFT hand just finished → advance exercise
    const currentIndex = exerciseOrder.indexOf(currentExercise);
    currentExercise = exerciseOrder[currentIndex + 1];
    activeHand = "right";
  
    // 🔁 allow intro for new exercise
    introShownForExercise[currentExercise] = false;
  }
  

  roundStartTime = Date.now();

  // --- CLEAR TEMP OBJECTS ---
  fallingDots = [];
  starBursts = [];
  
  // 🦆 ensure duck stars always spawn
  if (currentExercise === "duck") {
    clearInterval(duckSpawnInterval);
    duckSpawnInterval = setInterval(spawnDuckDot, 900);
  }
  
  // --- EXERCISE SETUP ---
  switch (currentExercise) {
    case "piano":
      spawnPianoGrid();
      break;

    case "duck":
      spawnDuckDot();
      break;

    case "hook":
      hookStarCount = 1;
      hookField.stars = [];
      spawnHookField(1);
      break;

    case "finalSqueeze":
      spawnFinalStar();
      break;
  }

  // ✅ Show intro ONLY when starting RIGHT hand
  showExerciseIntro();
}





function hideInitialIntro() {
  introActive = false;
  document.getElementById("intro-screen").style.display = "none";

  // ⛔️ Do NOT start gameplay yet
  gameStarted = false;

  // 🎯 Immediately show first exercise intro
  showExerciseIntro();
}





// --------------------
// Main loop
// --------------------
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ⭐ ALWAYS draw fingertip stars if a hand exists (INTRO + GAME)
  if (lastLandmarks) {
    drawHand(lastLandmarks);
  }

 // ❌ Stop game logic if exercise intro is active
if (!gameStarted || exerciseIntroActive) {
  requestAnimationFrame(gameLoop);
  return;
}


  // --------------------
  // GAME LOGIC (unchanged)
  // --------------------
  updateHandRound(); 

  if (currentExercise === "piano") {
    drawPianoGrid();
    if (lastLandmarks) updatePianoInteraction(lastLandmarks);
  } 
  else if (currentExercise === "duck") {
    updateDuckDots();
    if (lastLandmarks) checkDuckDotHits(lastLandmarks);
  } 
  else if (currentExercise === "hook") {
    drawHookStars();
    if (lastLandmarks) updateHookExercise(lastLandmarks);
  }
  
  
  else if (currentExercise === "finalSqueeze") {
    drawFinalStar();
    if (lastLandmarks) updateFinalSqueeze(lastLandmarks);
  }
  

  drawStarBursts();

  lastLandmarksPrev = lastLandmarks
    ? JSON.parse(JSON.stringify(lastLandmarks))
    : null;

  updateUI();
  requestAnimationFrame(gameLoop);
}






gameLoop();