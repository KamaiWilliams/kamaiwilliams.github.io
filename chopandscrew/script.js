
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