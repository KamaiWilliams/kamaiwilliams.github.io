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
let recordedEvents = [];
let loopInterval;
let currentVolume = 1;
let scheduledTimeouts = [];
let historyStack = []; // for undo

document.addEventListener("DOMContentLoaded", () => {
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
          recordedEvents.push(event);
          addMeasureDot(category, quantizedTime, recordedEvents.length - 1);
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
      recordedEvents = [];
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

    if (!recordedEvents.length) {
      alert("No sounds recorded yet!");
      return;
    }

    // Save the current loop data
    const loopData = {
      timestamp: Date.now(),
      bpm,
      events: recordedEvents, // use the real event array
    };

    // Load existing loops or create new
    let savedLoops = JSON.parse(localStorage.getItem("savedLoops")) || [];

    // Check for duplicate name
    const existingIndex = savedLoops.findIndex(loop => loop.name === name);
    
    if (existingIndex !== -1) {
      const overwrite = confirm(`A loop named "${name}" already exists. Overwrite?`);
      if (!overwrite) return;
      savedLoops[existingIndex] = { name, ...loopData };
    } else {
      savedLoops.push({ name, ...loopData });
    }
    
    localStorage.setItem("savedLoops", JSON.stringify(savedLoops));
    // Close popup
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
function addMeasureDot(category, time, i = null) {
  const bar = document.getElementById("measure-bar");
  const dot = document.createElement("div");
  dot.classList.add("measure-dot", `dot-${category}`);
  const percentage = (time / loopLength) * 100;
  dot.style.left = `${percentage}%`;
  dot.style.pointerEvents = "auto"; // clickable
  let eventData = i !== null ? recordedEvents[i] : recordedEvents.at(-1);

  makeDotInteractive(dot, eventData);
  bar.appendChild(dot);
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

// --- REMOVE DOT ---
function removeDot(dot, eventData) {
  dot.remove();
  const idx = recordedEvents.indexOf(eventData);
  if (idx !== -1) recordedEvents.splice(idx, 1);
  historyStack.push({ type: "delete", event: eventData, dot });
  rescheduleLoopSounds();
}

// --- UNDO ---
function undoLastAction() {
  const last = historyStack.pop();
  if (!last) return;

  if (last.type === "delete") {
    recordedEvents.push(last.event);
    addMeasureDot(last.event.category, last.event.time);
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
  recordedEvents.forEach(event => {
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
