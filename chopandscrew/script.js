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

const loopLength = 8000; // 24 seconds per loop
let isRecording = false;
let isPaused = false;
let startTime = 0;
let recordedEvents = [];
let loopInterval;
let currentVolume = 1;

// ---------------------------
// BUILD SOUND PADS
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
        const loopTime = time % loopLength;
        recordedEvents.push({ category, i, time: loopTime });
        addMeasureDot(category, loopTime);
      }
    });

    grid.appendChild(pad);
  }
});

// ---------------------------
// PLAY SOUND
// ---------------------------
function playSound(folder, index) {
  const audio = new Audio(`jerkbeat/${folder}/${folder}${index}.wav`);
  audio.volume = currentVolume;
  audio.currentTime = 0;
  audio.play().catch(err => console.warn("Playback failed:", err));
}
// ---------------------------
// MEASURE DOTS
// ---------------------------
function addMeasureDot(category, time) {
  const bar = document.getElementById("measure-bar");
  const dot = document.createElement("div");
  dot.classList.add("measure-dot", `dot-${category}`);

  // Position dot along the timeline based on its timestamp
  const percentage = (time / loopLength) * 100;
  dot.style.left = `${percentage}%`;

  bar.appendChild(dot);
}

// ---------------------------
// TAB SWITCHING (fixed + default "all")
// ---------------------------
const tabButtons = document.querySelectorAll(".tab-btn");
const categories = document.querySelectorAll(".category");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const category = btn.dataset.category;

    const loopPad = document.getElementById("loop-pad");

    if (category === "all") {
      categories.forEach(cat => (cat.style.display = "flex"));
      loopPad.classList.add("all-view");
      loopPad.classList.remove("category-view");
      loopPad.scrollTop = 0; // ensures start from top
    } else {
      categories.forEach(cat => {
        cat.style.display = cat.id === `${category}-grid` ? "flex" : "none";
      });
      loopPad.classList.add("category-view");
      loopPad.classList.remove("all-view");
    }
  });
});

// attach click handlers
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const category = btn.dataset.category;
    activateTab(category);
  });
});

// ensure DOM ready then set default tab to "all"
document.addEventListener("DOMContentLoaded", () => {
  // try to click the "all" tab if present, otherwise call activateTab directly
  const allBtn = document.querySelector(".tab-btn[data-category='all']");
  if (allBtn) {
    allBtn.click();
  } else {
    activateTab("all");
  }
});

// ---------------------------
// LOOP CONTROLS
// ---------------------------
const recordBtn = document.getElementById("recordBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const measureBar = document.getElementById("measure-fill");

// Restart and start animation helper
function restartMeasureBar() {
  measureBar.style.animation = "none";
  void measureBar.offsetWidth; // reflow to reset
  measureBar.style.animation = `measureLoop ${loopLength / 1000}s linear infinite`;
  measureBar.style.animationPlayState = "running";
}

// ---------------------------
// RECORD / STOP BUTTON
// ---------------------------
recordBtn.addEventListener("click", () => {
  if (!isRecording) {
    recordedEvents = [];
    startTime = Date.now();
    isRecording = true;
    isPaused = false;
    recordBtn.textContent = "Stop Recording";

    playLoop(); // play immediately
    restartMeasureBar(); // start animation
    loopInterval = setInterval(playLoop, loopLength);

  } else {
    isRecording = false;
    recordBtn.textContent = "Start Recording";

    // Stop animation and looping
    measureBar.style.animation = "none";
    clearInterval(loopInterval);
  }
});

// --- PAUSE & RESUME ---
pauseBtn.addEventListener("click", () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
  
  const bar = document.getElementById("measure-fill");
  bar.style.animationPlayState = isPaused ? "paused" : "running";

  if (isPaused) {
    stopAllSounds();
    clearScheduledSounds();
  } else {
    scheduleLoop();
  }
});

// ---------------------------
// RESTART BUTTON
// ---------------------------
restartBtn.addEventListener("click", () => {
  clearInterval(loopInterval);
  clearScheduledSounds();
  stopAllSounds();
  
  recordedEvents = [];
  isRecording = false;
  isPaused = false;
  recordBtn.textContent = "Start Recording";
  pauseBtn.textContent = "Pause";

  // Reset measure bar
  measureBar.style.animation = "none";
  
  // Remove all dots from the measure bar
document.querySelectorAll(".measure-dot").forEach(dot => dot.remove());
});


// --- HELPER FUNCTIONS ---
// Stop any sounds currently playing
function stopAllSounds() {
  document.querySelectorAll("audio").forEach(a => {
    a.pause();
    a.currentTime = 0;
  });
}

// Clear any scheduled timeouts for sounds
let scheduledTimeouts = [];
function clearScheduledSounds() {
  scheduledTimeouts.forEach(t => clearTimeout(t));
  scheduledTimeouts = [];
}

// ---------------------------
// LOOP PLAYER
// ---------------------------
function playLoop() {
  if (isPaused) return;

  recordedEvents.forEach(event => {
    const timeout = setTimeout(() => {
      playSound(event.category, event.i);
    }, event.time);
    scheduledTimeouts.push(timeout);
  });
}

// ---------------------------
// VOLUME CONTROL
// ---------------------------
document.getElementById("volume").addEventListener("input", e => {
  currentVolume = parseFloat(e.target.value);
});
