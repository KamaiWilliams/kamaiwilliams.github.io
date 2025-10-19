// --- SOUND CATEGORIES ---
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

const loopLength = 4000;
let isRecording = false;
let startTime = 0;
let recordedEvents = [];
let loopInterval;
let isPaused = false;
let currentVolume = 1;

// ---------------------------
// Build pads
// ---------------------------
Object.keys(soundCategories).forEach(category => {
  const grid = document.getElementById(`${category}-grid`);
  const total = soundCategories[category];

  for (let i = 1; i <= total; i++) {
    const pad = document.createElement("div");
    pad.classList.add("pad");
    pad.dataset.sound = `${category}${i}`;
    pad.dataset.folder = category;

    pad.addEventListener("click", (e) => {
      const isPreview = e.shiftKey;
      playSound(category, i);
      if (isRecording && !isPreview) {
        const time = Date.now() - startTime;
        recordedEvents.push({ category, i, time: time % loopLength });
      }
    });

    grid.appendChild(pad);
  }
});

// ---------------------------
// Play Sound
// ---------------------------
function playSound(folder, index) {
  const audio = new Audio(`jerkbeat/${folder}/${folder}${index}.wav`);
  audio.volume = currentVolume;
  audio.currentTime = 0;
  audio.play().catch(err => console.warn("Playback failed:", err));
}

// ---------------------------
// Tab switching
// ---------------------------
const tabButtons = document.querySelectorAll(".tab-btn");
const categories = document.querySelectorAll(".category");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const category = btn.dataset.category;

    if (category === "all") {
      categories.forEach(cat => (cat.style.display = "grid"));
    } else {
      categories.forEach(cat => {
        cat.style.display = cat.id === `${category}-grid` ? "grid" : "none";
      });
    }
  });
});

// ---------------------------
// Recording & Looping
// ---------------------------
const recordBtn = document.getElementById("recordBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");

recordBtn.addEventListener("click", () => {
  if (!isRecording) {
    recordedEvents = [];
    startTime = Date.now();
    isRecording = true;
    recordBtn.textContent = "Stop Recording";
    playLoop();
    loopInterval = setInterval(playLoop, loopLength);
  } else {
    isRecording = false;
    recordBtn.textContent = "Start Recording";
  }
});

restartBtn.addEventListener("click", () => {
  clearInterval(loopInterval);
  recordedEvents = [];
  isRecording = false;
  recordBtn.textContent = "Start Recording";
});

pauseBtn.addEventListener("click", () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
});

function playLoop() {
  if (isPaused) return;
  recordedEvents.forEach(event => {
    setTimeout(() => {
      playSound(event.category, event.i);
    }, event.time);
  });
}

// ---------------------------
// Volume Control
// ---------------------------
document.getElementById("volume").addEventListener("input", e => {
  currentVolume = parseFloat(e.target.value);
});
