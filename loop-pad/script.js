const categories = ["kick", "snare", "hihat", "clap", "tom"];
const numVariations = 5;
const grid = document.getElementById("grid");

let isRecording = false;
let startTime = 0;
let recordedEvents = [];
let loopInterval;
const loopLength = 4000; // 4 seconds loop

// Build grid of pads
categories.forEach(cat => {
  for (let i = 1; i <= numVariations; i++) {
    const pad = document.createElement("div");
    pad.classList.add("pad");
    pad.innerText = i; // label inside circle
    pad.dataset.sound = `${cat}${i}`;
    pad.dataset.folder = cat;
    pad.id = `${cat}${i}`; // unique id for flashing

    pad.addEventListener("click", () => {
      playSound(cat, i, pad.id);
      if (isRecording) {
        const time = Date.now() - startTime;
        recordedEvents.push({ cat, i, time: time % loopLength });
      }
    });

    grid.appendChild(pad);
  }
});

function playSound(folder, index, padId) {
  const audio = new Audio(`sounds/${folder}/${folder}${index}.wav`);
  audio.currentTime = 0;
  audio.play();

  // flash pad when triggered
  if (padId) {
    const pad = document.getElementById(padId);
    pad.classList.add("flash");
    setTimeout(() => pad.classList.remove("flash"), 150);
  }
}

// Recording toggle
document.getElementById("recordBtn").addEventListener("click", () => {
  if (!isRecording) {
    recordedEvents = [];
    startTime = Date.now();
    isRecording = true;
    document.getElementById("recordBtn").innerText = "Stop Recording";

    // Start loop playback
    loopInterval = setInterval(playLoop, loopLength);
  } else {
    isRecording = false;
    document.getElementById("recordBtn").innerText = "Start Recording";
  }
});

// Restart
document.getElementById("restartBtn").addEventListener("click", () => {
  clearInterval(loopInterval);
  recordedEvents = [];
  isRecording = false;
  document.getElementById("recordBtn").innerText = "Start Recording";
});

// Playback loop
function playLoop() {
  recordedEvents.forEach(event => {
    setTimeout(() => {
      playSound(event.cat, event.i, `${event.cat}${event.i}`);
    }, event.time);
  });
}
