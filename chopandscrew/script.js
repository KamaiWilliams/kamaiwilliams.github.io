
// --- JERKBEAT LOOP PAD ---

const soundCategories = {
  bass: 13,
  clap: 9,
  fx: 16,
  hihat: 15,
  openhat: 14,
  snare: 11,
  vox: 12,
  snap: 2
};

const loopLength = 4000; // 4-second loop
let isRecording = false;
let startTime = 0;
let recordedEvents = [];
let loopInterval;

// ---------------------------
// Build pad grids
// ---------------------------
Object.keys(soundCategories).forEach(category => {
  const grid = document.getElementById(`${category}-grid`);
  const total = soundCategories[category];

  for (let i = 1; i <= total; i++) {
    const pad = document.createElement("div");
    pad.classList.add("pad");
    pad.dataset.sound = `${category}${i}`;
    pad.dataset.folder = category;
    pad.id = `${category}${i}`;

    pad.addEventListener("click", () => {
      playSound(category, i, pad.id);
      if (isRecording) {
        const time = Date.now() - startTime;
        recordedEvents.push({ category, i, time: time % loopLength });
      }
    });

    grid.appendChild(pad);
  }
});

// Tab switching
const tabButtons = document.querySelectorAll(".tab-btn");
const categories = document.querySelectorAll(".category");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    // remove active state
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const category = btn.getAttribute("data-category");

    if (category === "all") {
      // show all categories
      categories.forEach((cat) => (cat.style.display = "block"));
    } else {
      // show only selected category
      categories.forEach((cat) => {
        if (cat.id === `${category}-grid`) {
          cat.style.display = "block";
        } else {
          cat.style.display = "none";
        }
      });
    }
  });
});


// ---------------------------
// Play Sound
// ---------------------------
function playSound(folder, index, padId) {
  const audio = new Audio(`jerkbeat/${folder}/${folder}${index}.wav`);
  audio.currentTime = 0;
  audio.play().catch(err => console.warn("Playback failed:", err));

  // Flash animation
  if (padId) {
    const pad = document.getElementById(padId);
    pad.classList.add("flash");
    setTimeout(() => pad.classList.remove("flash"), 150);
  }
}

// ---------------------------
// Recording & Looping Controls
// ---------------------------
const recordBtn = document.getElementById("recordBtn");
const restartBtn = document.getElementById("restartBtn");
const loopCircle = document.getElementById("loop-circle");
const circleLength = 2 * Math.PI * 50; // circle circumference

loopCircle.style.strokeDasharray = circleLength;
loopCircle.style.strokeDashoffset = circleLength;

recordBtn.addEventListener("click", () => {
  if (!isRecording) {
    // Start recording
    recordedEvents = [];
    startTime = Date.now();
    isRecording = true;
    recordBtn.innerText = "Stop Recording";

    // Start loop
    playLoop();
    loopInterval = setInterval(playLoop, loopLength);
  } else {
    // Stop recording
    isRecording = false;
    recordBtn.innerText = "Start Recording";
  }
});

restartBtn.addEventListener("click", () => {
  clearInterval(loopInterval);
  recordedEvents = [];
  isRecording = false;
  recordBtn.innerText = "Start Recording";
  loopCircle.style.transition = "none";
  loopCircle.style.strokeDashoffset = circleLength;
});

// ---------------------------
// Loop Visualizer + Playback
// ---------------------------
function animateLoopVisualizer() {
  loopCircle.style.transition = "none";
  loopCircle.style.strokeDashoffset = circleLength;
  void loopCircle.offsetWidth; // reset trick

  loopCircle.style.transition = `stroke-dashoffset ${loopLength}ms linear`;
  loopCircle.style.strokeDashoffset = "0";
}

function playLoop() {
  animateLoopVisualizer();
  recordedEvents.forEach(event => {
    setTimeout(() => {
      playSound(event.category, event.i, `${event.category}${event.i}`);
    }, event.time);
  });
}
// ---------------------------
// Volume
// ---------------------------
const volumeControl = document.getElementById("volume");
let currentVolume = 1;

volumeControl.addEventListener("input", e => {
  currentVolume = parseFloat(e.target.value);
});

function playSound(folder, index, padId, preview = false) {
  const audio = new Audio(`jerkbeat/${folder}/${folder}${index}.wav`);
  audio.volume = currentVolume;
  if (!preview) audio.currentTime = 0;
  audio.play().catch(err => console.warn("Playback failed:", err));
}
// ---------------------------
// User hold shift to try sound before adding
// ---------------------------
pad.addEventListener("click", e => {
  const isPreview = e.shiftKey;
  playSound(category, i, pad.id, isPreview);

  if (isRecording && !isPreview) {
    const time = Date.now() - startTime;
    recordedEvents.push({ category, i, time: time % loopLength });
  }
});

// --- New Buttons ---
const homeBtn = document.getElementById("homeBtn");

homeBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});
const loopLengthInput = document.getElementById("loopLength");
const pauseBtn = document.getElementById("pauseBtn");

let isPaused = false;

// Go back to Home Page


// Pause / Resume Loop
pauseBtn.addEventListener("click", () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
  // You can add pause logic here if your loops are time-based
});

// Use the chosen loop length in your looping function
function getLoopLength() {
  return parseFloat(loopLengthInput.value) * 1000; // milliseconds
}