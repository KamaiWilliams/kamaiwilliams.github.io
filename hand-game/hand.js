console.log("hand.js loaded");

const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");

let gameStarted = false;

startBtn.addEventListener("click", () => {
  startScreen.style.display = "none";
  gameStarted = true;
  roundStartTime = Date.now();
});

const timerEl = document.getElementById("timer");
const instructionEl = document.getElementById("instruction");
const starEl = document.getElementById("star-counter");

function updateUI() {
  const remaining = Math.max(0, ROUND_DURATION - (Date.now() - roundStartTime)) / 1000;
  timerEl.textContent = `${activeHand.toUpperCase()} hand — ${Math.ceil(remaining)}s`;

  instructionEl.textContent = exerciseInstructions[currentExercise][activeHand];

  starEl.textContent = `★ ${starCount}`;
}



const endScreen = document.getElementById("end-screen");
const finalStars = document.getElementById("final-stars");
const restartBtn = document.getElementById("restart-btn");

function endGame() {
  gameStarted = false;
  finalStars.textContent = starCount;
  endScreen.style.display = "flex";
}

restartBtn.addEventListener("click", () => {
  endScreen.style.display = "none";
  starCount = 0;        // reset stars for new game
  currentExercise = "piano";
  activeHand = "right";
  spawnPianoGrid();
  roundStartTime = Date.now();
  fallingDots = [];
  starBursts = [];
  gameStarted = true;
});


const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let lastLandmarks = null;
const fingerColors = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"];

let activeHand = "right"; // "right" or "left"
let roundStartTime = Date.now();
const ROUND_DURATION = 30_000; // 30 seconds

let currentExercise = "piano";

let fingerRollState = "open"; // "open" or "closed"

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

  const cols = 12;
  const rows = 10;
  const spacing = 50;

  const gridWidth = (cols - 1) * spacing;
  const gridHeight = (rows - 1) * spacing;

  const startX = canvas.width / 2 - gridWidth / 2;
  const startY = canvas.height / 2 - gridHeight / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = fingerColors[Math.floor(Math.random() * fingerColors.length)];

      pianoDots.push({
        x: startX + c * spacing,
        y: startY + r * spacing,
        radius: 12,
        color,
        alive: true
      });
    }
  }
}


function drawPianoGrid() {
  pianoDots.forEach(dot => {
    if (!dot.alive) return;

    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    ctx.fillStyle = dot.color;
    ctx.fill();
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
    right: "Have your RIGHT palm facing the screen and wiggle your fingers like you are playing the piano",
    left:  "Have your LEFT palm facing the screen and wiggle your fingers like you are playing the piano"
  },
  duck: {
    right: "That was great! Now eat the circles. Turn your RIGHT palm left and open/close like an alligator.",
    left:  "That was great! Now eat the circles. Turn your LEFT palm right and open/close like an alligator."
  },
  hook: {
    right: "Hook Tendon Glide: Curl your RIGHT fingers like a hook, flick open, repeat.",
    left:  "Hook Tendon Glide: Curl your LEFT fingers like a hook, flick open, repeat."
  },
  fingerRoll: {
    right: "Finger Roll: Slowly roll your RIGHT fingers into a fist, squeeze, then open back to a palm.",
    left:  "Finger Roll: Slowly roll your LEFT fingers into a fist, squeeze, then open back to a palm."
  }
};


function detectHookCurl(landmarks) {
  const fingertipIndices = [8, 12, 16, 20]; // index → pinky
  let curlAmount = 0;

  fingertipIndices.forEach(i => {
    const tip = landmarks[i];
    const pip = landmarks[i - 2];
    const dx = tip.x - pip.x;
    const dy = tip.y - pip.y;
    const dist = Math.sqrt(dx * dx + dy * dy); // normalized distance
    curlAmount += 1 - dist; // bigger when finger is more curled
  });

  return curlAmount / fingertipIndices.length; // average curl
}
function updateHookDots(landmarks, lastLandmarks) {
  // Spawn dots from top
  if (Date.now() - lastSpawn > SPAWN_RATE) {
    fallingDots.push({
      x: Math.random() * canvas.width,
      y: -20,
      radius: 12,
      speedY: 1 + Math.random() * 2,
      color: dotColors[Math.floor(Math.random() * dotColors.length)],
      vx: 0, // horizontal movement for bounce
      vy: 0
    });
    lastSpawn = Date.now();
  }

  // Move dots
  fallingDots.forEach(dot => {
    // Normal falling
    dot.y += dot.speedY + dot.vy; 
    dot.x += dot.vx;

    // Apply friction/slowdown after bounce
    dot.vx *= 0.95;
    dot.vy *= 0.95;

    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    ctx.fillStyle = dot.color;
    ctx.fill();
  });

  // Flick detection
  const flickAmount = detectHookFlick(landmarks, lastLandmarks);

  if (flickAmount > 0.5) {
    // Check if fingertip hits any dot
    const fingertipIndices = [8, 12, 16, 20];
    fingertipIndices.forEach(i => {
      const tip = landmarks[i];
      const fingerX = tip.x * canvas.width;
      const fingerY = tip.y * canvas.height;

      fallingDots.forEach((dot, idx) => {
        const dist = Math.hypot(dot.x - fingerX, dot.y - fingerY);
        if (dist < dot.radius + 6) {
          // Bounce dot: move it upward and sideways
          dot.vy = -3 - Math.random() * 2;
          dot.vx = (Math.random() - 0.5) * 4;

          createStarBurst(dot.x, dot.y, dot.color);
          // Optionally remove the dot after some time
          setTimeout(() => {
            fallingDots.splice(fallingDots.indexOf(dot), 1);
          }, 500);
        }
      });
    });
  }

  // Remove offscreen dots
  fallingDots = fallingDots.filter(dot => dot.y < canvas.height + 50);
}


function spawnFingerRollDots() {
  if (Date.now() - lastSpawn > 700) {
    fallingDots.push({
      x: Math.random() * canvas.width,
      y: -20,
      radius: 12,
      speedY: 2,
      color: dotColors[Math.floor(Math.random() * dotColors.length)]
    });
    lastSpawn = Date.now();
  }
}


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



function updateFingerRoll(landmarks) {
  const fingertips = [8, 12, 16, 20];

  // Measure curl amount
  let curl = 0;
  fingertips.forEach(i => {
    const tip = landmarks[i];
    const pip = landmarks[i - 2];
    curl += Math.abs(tip.y - pip.y);
  });

  const isClosed = curl < 0.18;

  // 🔥 OPEN → CLOSED = grab + squeeze
  if (fingerRollState === "open" && isClosed) {
    fallingDots.forEach((dot, idx) => {
      fingertips.forEach(i => {
        const tip = landmarks[i];
        const fx = tip.x * canvas.width;
        const fy = tip.y * canvas.height;

        const dist = Math.hypot(dot.x - fx, dot.y - fy);
        if (dist < dot.radius + 20) {
          createStarBurst(dot.x, dot.y, dot.color);
          fallingDots.splice(idx, 1);
        }
      });
    });

    fingerRollState = "closed";
  }

  // CLOSED → OPEN = reset
  if (fingerRollState === "closed" && !isClosed) {
    fingerRollState = "open";
  }
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
  } else {
    lastLandmarks = null;
  }
}

// --------------------
// Draw functions
// --------------------
function drawHand(landmarks) {
  fingertipMap.forEach(finger => {
    const p = landmarks[finger.index];
    ctx.beginPath();
    ctx.arc(p.x * canvas.width, p.y * canvas.height, 6, 0, Math.PI * 2);
    ctx.fillStyle = finger.color;
    ctx.fill();
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
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    ctx.fillStyle = dot.color;
    ctx.fill();
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
        // Create star burst
        createStarBurst(dot.x, dot.y, dot.color);
        // Remove dot
        fallingDots.splice(dotIdx, 1);
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
    radius: 12,
    speedX: 2 + Math.random() * 2,
    color: dotColors[Math.floor(Math.random() * dotColors.length)]
  });
}






function createStarBurst(x, y, color) {
  for (let i = 0; i < 10; i++) {
    starBursts.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      alpha: 1,
      color,
      radius: 2 + Math.random() * 3
    });
  }
}

function drawStarBursts() {
  starBursts.forEach((s, idx) => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hexToRgb(s.color)},${s.alpha})`;
    ctx.fill();

    s.x += s.vx;
    s.y += s.vy;
    s.alpha -= 0.05;

    if (s.alpha <= 0) starBursts.splice(idx, 1);
  });
}




// --------------------
// Detect hook
// --------------------
function detectHookFlick(landmarks, lastLandmarks) {
  const fingertipIndices = [8, 12, 16, 20];
  let flickAmount = 0;

  if (!lastLandmarks) return 0;

  fingertipIndices.forEach(i => {
    const tip = landmarks[i];
    const pip = landmarks[i - 2];
    const lastTip = lastLandmarks[i];
    const lastPip = lastLandmarks[i - 2];

    // Current distance = curled
    const currentDist = Math.hypot((tip.x - pip.x) * canvas.width, (tip.y - pip.y) * canvas.height);
    const lastDist = Math.hypot((lastTip.x - lastPip.x) * canvas.width, (lastTip.y - lastPip.y) * canvas.height);

    const delta = currentDist - lastDist; // positive if finger straightened
    if (delta > 0.5) flickAmount += delta; // threshold for flick
  });

  return flickAmount / fingertipIndices.length; // average flick intensity
}




function updateHandRound() {
  const elapsed = Date.now() - roundStartTime;

  if (elapsed > ROUND_DURATION) {
    // Switch active hand
    activeHand = activeHand === "right" ? "left" : "right";
    roundStartTime = Date.now();

    // Clear visuals between rounds
    fallingDots = [];
    starBursts = [];

    // Reset piano grid for the new hand
    if (currentExercise === "piano") {
      spawnPianoGrid();
    }

    // --- Exercise transitions ---
    if (currentExercise === "piano" && activeHand === "right") {
      // Both hands of piano done → start Duck
      currentExercise = "duck";
      duckSpawnInterval = setInterval(spawnDuckDot, 800);

    } else if (currentExercise === "duck" && activeHand === "right") {
      // Both hands of Duck done → start Hook
      currentExercise = "hook";
      clearInterval(duckSpawnInterval);
      fallingDots = [];
      starBursts = [];
    }
    else if (currentExercise === "hook" && activeHand === "right") {
      // Both hands of Hook done → start Finger Roll
      currentExercise = "fingerRoll";
      fallingDots = [];
      starBursts = [];
    }
    if (currentExercise === "fingerRoll" && activeHand === "left" && elapsed > ROUND_DURATION) {
      endGame();
      return;
    }
  }
}




// --------------------
// Main loop
// --------------------
function gameLoop() {
  if (!gameStarted) return requestAnimationFrame(gameLoop);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateHandRound(); 

  if (currentExercise === "piano") {
    drawPianoGrid();
    if (lastLandmarks) updatePianoInteraction(lastLandmarks);
  } else if (currentExercise === "duck") {
    updateDuckDots();
    if (lastLandmarks) checkDuckDotHits(lastLandmarks);
  } else if (currentExercise === "hook") {
    if (lastLandmarks) updateHookDots(lastLandmarks, lastLandmarksPrev);
  } else if (currentExercise === "fingerRoll") {
    spawnFingerRollDots();
    drawFallingDots();
    if (lastLandmarks) updateFingerRoll(lastLandmarks);
  }

  drawStarBursts();
  if (lastLandmarks) drawHand(lastLandmarks);

  lastLandmarksPrev = lastLandmarks ? JSON.parse(JSON.stringify(lastLandmarks)) : null;

  updateUI(); // 🔹 NEW: update overlay instead of canvas text

  requestAnimationFrame(gameLoop);
}





gameLoop();
