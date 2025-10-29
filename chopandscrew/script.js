// --- SOUND CATEGORIES ---
const soundCategories = {
  bass: 13,
  clap: 9,
  fx: 35,
  hihat: 15,
  openhat: 14,
  snare: 11,
  vox: 17,
  snap: 2,
  kick: 15,
  horn: 13,
  synth: 8,
  strings: 32
};

// ---------------------------
// LOOP CONFIGURATION (BPM-based)
// ---------------------------
let bpm = 120;               // default tempo
const beatsPerLoop = 4;      // how many beats in one loop
let loopLength = (60000 / bpm) * beatsPerLoop; // ms

let isRecording = false;
let isPaused = false;
let startTime = 0;
let recordedEvents = [];
let loopInterval;
let currentVolume = 1;
let scheduledTimeouts = [];

// Wait until DOM fully loads
document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------
  // BPM INPUT HANDLER
  // ---------------------------
  const bpmInput = document.getElementById("bpm");
  if (bpmInput) {
    bpmInput.value = bpm;
    bpmInput.addEventListener("input", e => {
      bpm = parseFloat(e.target.value) || 120;
      loopLength = (60000 / bpm) * beatsPerLoop;

      if (isRecording) {
        clearInterval(loopInterval);
        restartMeasureBar();
        loopInterval = setInterval(playLoop, loopLength);
      }
    });
  }

  // ---------------------------
  // BUILD SOUND PADS
  // ---------------------------
  Object.keys(soundCategories).forEach(category => {
    const grid = document.getElementById(`${category}-grid`);
    if (!grid) return;
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
  // TAB SWITCHING (and default “all”)
  // ---------------------------
  const tabButtons = document.querySelectorAll(".tab-btn");
  const categories = document.querySelectorAll(".category");

  function activateTab(category) {
    const loopPad = document.getElementById("loop-pad");
    tabButtons.forEach(b => b.classList.remove("active"));
    document.querySelector(`.tab-btn[data-category="${category}"]`)?.classList.add("active");

    if (category === "all") {
      categories.forEach(cat => (cat.style.display = "flex"));
      loopPad.classList.add("all-view");
      loopPad.classList.remove("category-view");
    } else {
      categories.forEach(cat => {
        cat.style.display = cat.id === `${category}-grid` ? "flex" : "none";
      });
      loopPad.classList.add("category-view");
      loopPad.classList.remove("all-view");
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => activateTab(btn.dataset.category));
  });

  // Default to “all”
  activateTab("all");

  // ---------------------------
  // CONTROL BUTTONS
  // ---------------------------
  const recordBtn = document.getElementById("recordBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const restartBtn = document.getElementById("restartBtn");
  const measureBar = document.getElementById("measure-fill");

  recordBtn.addEventListener("click", () => {
    if (!isRecording) {
      recordedEvents = [];
      startTime = Date.now();
      isRecording = true;
      isPaused = false;
      recordBtn.textContent = "stop";

      playLoop();
      restartMeasureBar();
      loopInterval = setInterval(playLoop, loopLength);
    } else {
      isRecording = false;
      recordBtn.textContent = "record";
      measureBar.style.animation = "none";
      clearInterval(loopInterval);
    }
  });

  pauseBtn.addEventListener("click", () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? "resume" : "pause";

    measureBar.style.animationPlayState = isPaused ? "paused" : "running";

    if (isPaused) {
      stopAllSounds();
      clearScheduledSounds();
    } else {
      scheduleLoop();
    }
  });

  restartBtn.addEventListener("click", () => {
    clearInterval(loopInterval);
    clearScheduledSounds();
    stopAllSounds();

    recordedEvents = [];
    isRecording = false;
    isPaused = false;
    recordBtn.textContent = "record";
    pauseBtn.textContent = "pause";
    measureBar.style.animation = "none";

    document.querySelectorAll(".measure-dot").forEach(dot => dot.remove());
  });

  // Volume
  document.getElementById("volume").addEventListener("input", e => {
    currentVolume = parseFloat(e.target.value);
  });
});

// ---------------------------
// HELPER FUNCTIONS
// ---------------------------
function playSound(folder, index) {
  const audio = new Audio(`jerkbeat/${folder}/${folder}${index}.wav`);
  audio.volume = currentVolume;
  audio.currentTime = 0;
  audio.play().catch(err => console.warn("Playback failed:", err));
}

function addMeasureDot(category, time) {
  const bar = document.getElementById("measure-bar");
  const dot = document.createElement("div");
  dot.classList.add("measure-dot", `dot-${category}`);
  const percentage = (time / loopLength) * 100;
  dot.style.left = `${percentage}%`;
  bar.appendChild(dot);
}

function stopAllSounds() {
  document.querySelectorAll("audio").forEach(a => {
    a.pause();
    a.currentTime = 0;
  });
}

function clearScheduledSounds() {
  scheduledTimeouts.forEach(t => clearTimeout(t));
  scheduledTimeouts = [];
}

function restartMeasureBar() {
  const bar = document.getElementById("measure-fill");
  bar.style.animation = "none";
  void bar.offsetWidth;
  bar.style.animation = `measureLoop ${loopLength / 1000}s linear infinite`;
  bar.style.animationPlayState = "running";
}

function playLoop() {
  if (isPaused) return;
  recordedEvents.forEach(event => {
    const timeout = setTimeout(() => playSound(event.category, event.i), event.time);
    scheduledTimeouts.push(timeout);
  });
}
