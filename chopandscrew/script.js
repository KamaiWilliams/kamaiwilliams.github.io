// --- SOUND CATEGORIES ---
const soundCategories = {
  bass: 13, clap: 9, fx: 35, hihat: 15, openhat: 14,
  snare: 11, vox: 17, snap: 2, kick: 15, horn: 13,
  synth: 8, strings: 32
};

let bpm = 120;
const beatsPerLoop = 4;
let loopLength = (60000 / bpm) * beatsPerLoop; // ms per 4 beats

let isRecording = false;
let isPaused = false;
let startTime = 0;
let loopInterval;
let currentVolume = 1;
let scheduledTimeouts = [];
let historyStack = []; // for undo

// --- PATTERN + ARRANGEMENT SYSTEM ---
let patterns = []; // saved in session (not localStorage yet)
let arrangement = []; // timeline placements

let currentPattern = createNewPattern();

function createNewPattern() {
  return {
    id: "pattern_" + Date.now(),
    name: "untitled",
    bpm: bpm,
    events: []
  };
}




document.getElementById("screwBtn")?.addEventListener("click", () => {
  window.location.href = "song-builder.html";
});



// --- LOAD SAVED LOOP IF EXISTS ---
const loopColors = [
  "#B8DE27",
  "#ff006e",
  "#10eff6",
  "#ff9028",
  "#8f7dff",
  "#29bf12",
  "#db00b6",
  "#00bbf9",
  "#5cffce"
];


const loadedLoop = JSON.parse(localStorage.getItem("currentLoop"));

if (loadedLoop) {
  bpm = loadedLoop.bpm;
  loopLength = (60000 / bpm) * beatsPerLoop;

  recordedEvents = loadedLoop.events || [];

  // Clear existing dots
  document.querySelectorAll(".measure-dot").forEach(dot => dot.remove());

  // Rebuild dots visually
  recordedEvents.forEach(event => {
    addMeasureDot(event);
  });

  // Optional: update BPM input visually
  const bpmInput = document.getElementById("bpm");
  if (bpmInput) bpmInput.value = bpm;

  // Clear temporary storage
  localStorage.removeItem("currentLoop");
}

document.addEventListener("DOMContentLoaded", () => {

  const arrangementTimeline = document.getElementById("arrangement-timeline");
const addToSongBtn = document.getElementById("addToSongBtn");

  // --- BPM Input ---
  const bpmInput = document.getElementById("bpm");
  if (bpmInput) {
    bpmInput.value = bpm;
    bpmInput.addEventListener("input", e => {
      bpm = parseFloat(e.target.value) || 120;
      loopLength = (60000 / bpm) * beatsPerLoop;
      if (isRecording) {
        clearInterval(loopInterval);
        restartMeasureBar();
        loopInterval = setInterval(scheduleLoop, loopLength);
      }
    });
  }
// --- Snap UI (inside control panel) ---
const snapToggle = document.getElementById("snapToggle");
const snapOptions = document.getElementById("snapOptions");
const snapResolution = document.getElementById("snapResolution");

let snapEnabled = false;
let snapDivision = 16; // default 1/16th

snapToggle.addEventListener("click", () => {
  snapEnabled = !snapEnabled;
  snapToggle.classList.toggle("active", snapEnabled);
  snapOptions.classList.toggle("hidden", !snapEnabled);
});

// Update snap resolution when user changes the dropdown
snapResolution.addEventListener("change", (e) => {
  const value = e.target.value;
  // extract the number after the slash, e.g., "1/16" → 16
  snapDivision = parseInt(value.split("/")[1], 10);
});


  


  // --- BUILD SOUND PADS ---
  Object.keys(soundCategories).forEach(category => {
    const grid = document.getElementById(`${category}-grid`);
    if (!grid) return;
    const total = soundCategories[category];
    for (let i = 1; i <= total; i++) {
      const pad = document.createElement("div");
      pad.classList.add("pad");
      pad.dataset.sound = `${category}${i}`;
      pad.dataset.folder = category;

      pad.addEventListener("click", e => {
        const isPreview = e.shiftKey;
        playSound(category, i);
        if (isRecording && !isPreview) {
          const time = Date.now() - startTime;
          const loopTime = time % loopLength;
          const quantizedTime = quantizeTime(loopTime);
          const event = { category, i, time: quantizedTime };
          currentPattern.events.push(event);
          addMeasureDot(event);
        }
      });
      grid.appendChild(pad);
    }
  });

  // --- TAB SWITCHING ---
  const tabButtons = document.querySelectorAll(".tab-btn");
  const categories = document.querySelectorAll(".category");

  function activateTab(category) {
    const loopPad = document.getElementById("loop-pad");
    tabButtons.forEach(b => b.classList.remove("active"));
    document.querySelector(`.tab-btn[data-category="${category}"]`)?.classList.add("active");

    if (category === "all") {
      categories.forEach(cat => cat.style.display = "flex");
      loopPad.classList.add("all-view");
    } else {
      categories.forEach(cat => {
        cat.style.display = cat.id === `${category}-grid` ? "flex" : "none";
      });
      loopPad.classList.remove("all-view");
    }
  }

  tabButtons.forEach(btn => btn.addEventListener("click", () => activateTab(btn.dataset.category)));
  activateTab("all");

  // --- CONTROLS ---
  const recordBtn = document.getElementById("recordBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const restartBtn = document.getElementById("restartBtn");

  recordBtn.addEventListener("click", () => {
    if (!isRecording) {
      currentPattern = createNewPattern();
      startTime = Date.now();
      isRecording = true;
      recordBtn.textContent = "stop";
      scheduleLoop();
      restartMeasureBar();
      loopInterval = setInterval(scheduleLoop, loopLength);
    } else {
      isRecording = false;
      recordBtn.textContent = "record";
      document.getElementById("measure-fill").style.animation = "none";
      clearInterval(loopInterval);
    }
  });

  pauseBtn.addEventListener("click", () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? "resume" : "pause";
    const bar = document.getElementById("measure-fill");
    bar.style.animationPlayState = isPaused ? "paused" : "running";
    if (isPaused) {
      stopAllSounds();
      clearScheduledSounds();
    } else {
      rescheduleLoopSounds();
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
    document.getElementById("measure-fill").style.animation = "none";
    document.querySelectorAll(".measure-dot").forEach(dot => dot.remove());
  });

// --- SAVE LOOP FUNCTIONALITY ---

const saveLoopBtn = document.getElementById("saveLoopBtn");
const saveLoopPopup = document.getElementById("save-loop-popup");
const saveLoopConfirmBtn = document.getElementById("saveLoopConfirmBtn");
const cancelSaveBtn = document.getElementById("cancelSaveBtn");
const loopNameInput = document.getElementById("loopName");

// Show popup when clicking "save loop"
if (saveLoopBtn) {
  saveLoopBtn.addEventListener("click", () => {
    saveLoopPopup.classList.remove("hidden");
    loopNameInput.value = "";
    loopNameInput.focus();
  });
}

// Cancel popup
if (cancelSaveBtn) {
  cancelSaveBtn.addEventListener("click", () => {
    saveLoopPopup.classList.add("hidden");
  });
}

// Confirm save
if (saveLoopConfirmBtn) {
  saveLoopConfirmBtn.addEventListener("click", () => {
    const name = loopNameInput.value.trim();
    if (!name) {
      alert("Please enter a name.");
      return;
    }

    if (!currentPattern.events.length) {
      alert("No sounds recorded yet!");
      return;
    }

    // Make sure pattern stores its name
    currentPattern.name = name;

    const loopData = {
      id: currentPattern.id,
      name: name,
      timestamp: Date.now(),
      bpm: bpm,
      color: loopColors[Math.floor(Math.random()*loopColors.length)],
      events: [...currentPattern.events]
    };

    // SAFELY parse existing loops
    let savedLoops = localStorage.getItem("savedLoops");
    savedLoops = savedLoops ? JSON.parse(savedLoops) : [];

    // Ensure it's always an array
    if (!Array.isArray(savedLoops)) {
      savedLoops = [];
    }

    const existingIndex = savedLoops.findIndex(loop => loop.name === name);

    if (existingIndex !== -1) {
      const overwrite = confirm(`A loop named "${name}" already exists. Overwrite?`);
      if (!overwrite) return;
      savedLoops[existingIndex] = loopData;
    } else {
      savedLoops.push(loopData);
    }

    localStorage.setItem("savedLoops", JSON.stringify(savedLoops));

    saveLoopPopup.classList.add("hidden");
    alert(`Saved loop "${name}" successfully!`);
  });
}



  // --- UNDO (Ctrl+Z) ---
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") undoLastAction();
  });
});

// ---------------------------
// SOUND + DOT FUNCTIONS
// ---------------------------
function playSound(folder, index) {
  const audio = new Audio(`jerkbeat/${folder}/${folder}${index}.wav`);
  audio.volume = currentVolume;
  audio.currentTime = 0;
  audio.play().catch(err => console.warn("Playback failed:", err));
}

// --- ADD DOT ---
function addMeasureDot(eventData) {
  const bar = document.getElementById("measure-bar");
  const dot = document.createElement("div");

  dot.classList.add("measure-dot", `dot-${eventData.category}`);

  const percentage = (eventData.time / loopLength) * 100;
  dot.style.left = `${percentage}%`;

  // --- STACKING LOGIC ---
  const dotsAtSameTime = Array.from(bar.querySelectorAll(".measure-dot"))
    .filter(existingDot => {
      return Math.abs(parseFloat(existingDot.dataset.time) - eventData.time) < 1;
    });

  const stackIndex = dotsAtSameTime.length;

  const stackSpacing = 16; // vertical spacing in px
  dot.style.top = `${50 - (stackIndex * 6)}%`;

  dot.dataset.time = eventData.time;

  makeDotInteractive(dot, eventData);

  bar.appendChild(dot);
restackDots();
}

// --- DOT INTERACTIONS ---
function makeDotInteractive(dot, eventData) {
  let isDragging = false;

  dot.addEventListener("mousedown", e => {
    if (e.button !== 0) return; // left click only
    isDragging = true;
    const bar = document.getElementById("measure-bar");
    const barRect = bar.getBoundingClientRect();
    const startTimeBeforeMove = eventData.time; // for undo

    function onMouseMove(moveEvent) {
      if (!isDragging) return;
      const newLeft = Math.min(Math.max(moveEvent.clientX - barRect.left, 0), barRect.width);
      const percentage = (newLeft / barRect.width) * 100;
      const newTime = (percentage / 100) * loopLength;
      const quantizedTime = quantizeTime(newTime);
      const quantizedPercent = (quantizedTime / loopLength) * 100;

      dot.style.left = `${quantizedPercent}%`;
      eventData.time = quantizedTime;
    }

    function onMouseUp() {
      if (isDragging) {
        historyStack.push({
          type: "move",
          event: eventData,
          prevTime: startTimeBeforeMove,
          dot,
        });

        restackDots();
        isDragging = false;
        rescheduleLoopSounds();
      }
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  });

  dot.addEventListener("click", e => {
    e.stopPropagation();
    showDotMenu(dot, eventData, e.clientX, e.clientY);
  });
}

// --- FLOATING DOT MENU ---
function showDotMenu(dot, eventData, x, y) {
  document.querySelector(".dot-menu")?.remove();
  const menu = document.createElement("div");
  menu.classList.add("dot-menu");
  menu.style.top = `${y}px`;
  menu.style.left = `${x}px`;
  menu.innerHTML = `<button class="delete-btn">delete</button>`;

  menu.querySelector(".delete-btn").addEventListener("click", () => {
    removeDot(dot, eventData);
    menu.remove();
  });

  document.body.appendChild(menu);

  document.addEventListener("click", e => {
    if (!menu.contains(e.target)) menu.remove();
  }, { once: true });
}
// --- REstack DOT ---
function restackDots() {
  const bar = document.getElementById("measure-bar");
  const dots = Array.from(bar.querySelectorAll(".measure-dot"));

  // Group dots by time
  const groups = {};

  dots.forEach(dot => {
    const time = parseFloat(dot.dataset.time);
    if (!groups[time]) groups[time] = [];
    groups[time].push(dot);
  });

  // Reposition each group
  Object.values(groups).forEach(group => {
    group.forEach((dot, index) => {
      dot.style.top = `${50 - (index * 6)}%`;
    });
  });
}

// --- REMOVE DOT ---
function removeDot(dot, eventData) {
  dot.remove();
  const idx = currentPattern.events.indexOf(eventData);
if (idx !== -1) currentPattern.events.splice(idx, 1);
  historyStack.push({ type: "delete", event: eventData, dot });
  restackDots();
  rescheduleLoopSounds();
}

// --- UNDO ---
function undoLastAction() {
  const last = historyStack.pop();
  if (!last) return;

  if (last.type === "delete") {
    currentPattern.events.push(last.event);
    addMeasureDot(last.event);
  } else if (last.type === "move") {
    last.event.time = last.prevTime;
    const percentage = (last.prevTime / loopLength) * 100;
    last.dot.style.left = `${percentage}%`;
  }
  rescheduleLoopSounds();
}

// --- RESCHEDULE ---
function rescheduleLoopSounds() {
  if (isRecording) return;
  clearInterval(loopInterval);
  clearScheduledSounds();
  stopAllSounds();
  scheduleLoop();
  loopInterval = setInterval(scheduleLoop, loopLength);
}

// --- LOOP SOUND SCHEDULER ---
function scheduleLoop() {
  if (isPaused) return;
  currentPattern.events.forEach(event => {
    const timeout = setTimeout(() => playSound(event.category, event.i), event.time);
    scheduledTimeouts.push(timeout);
  });
}




// --- UTILS ---
function quantizeTime(time) {
  const step = loopLength / 16; // 1/16th note grid
  return Math.round(time / step) * step;
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
  void bar.offsetWidth; // restart animation
  bar.style.animation = `measureLoop ${loopLength / 1000}s linear infinite`;
  bar.style.animationPlayState = "running";
}

document.getElementById("viewLoopsBtn")?.addEventListener("click", () => {
  window.location.href = "saved.html";
});
