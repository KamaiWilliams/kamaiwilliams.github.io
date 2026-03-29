const MAX_TIMELINE_WIDTH = 900; // max width of timeline

let bpm = 90;
let beatDuration = 60000 / bpm;

let isPlaying = false;
let startOffset = 0;

const timeline = document.getElementById("timeline-content");
const playBtn = document.getElementById("playSongBtn");
const pauseBtn = document.getElementById("pauseSongBtn");
const playhead = document.getElementById("song-playhead");

let timelineItems = [];
let playTimeouts = [];
let songStartTime = 0;
let songDuration = 0;

let savedLoops = JSON.parse(localStorage.getItem("savedLoops")) || [];
const bank = document.getElementById("loop-bank");
const toggleBankBtn = document.getElementById("toggleBankBtn");
const bankSection = document.querySelector(".bank-section");

renderBank();

/* ===========================
   RENDER LOOP BANK
=========================== */
function renderBank() {
  if (!bank) return;

  bank.innerHTML = "";

  savedLoops.forEach(loop => {
    const tile = document.createElement("div");
    tile.classList.add("saved-loop-tile");
    tile.draggable = true;
  

    const label = document.createElement("span");
    label.textContent = loop.name;
    tile.appendChild(label);

    if (loop.color) tile.style.background = loop.color;

    tile.addEventListener("dragstart", e => {
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({ type: "bank", id: loop.id })
      );
    });

    bank.appendChild(tile);
  });
}

/* -----------------------------
CREATE TIMELINE GRID
------------------------------ */
function createTimelineGrid() {
  timeline.querySelectorAll(".timeline-row").forEach(row => row.remove());

  const row = document.createElement("div");
  row.classList.add("timeline-row");


  timeline.addEventListener("dragover", e => e.preventDefault());

  timeline.addEventListener("drop", e => {
    e.preventDefault();
  
    const data = JSON.parse(
      e.dataTransfer.getData("application/json")
    );
  
    const blocks = Array.from(document.querySelectorAll(".timeline-block"));
  
    // figure out drop index based on mouse position
    let dropIndex = timelineItems.length;
  
    for (let i = 0; i < blocks.length; i++) {
      const rect = blocks[i].getBoundingClientRect();
      if (e.clientX < rect.left + rect.width / 2) {
        dropIndex = i;
        break;
      }
    }
  
    // FROM BANK → insert
    if (data.type === "bank") {
      const loop = savedLoops.find(l => l.id === data.id);
      if (!loop) return;
  
      timelineItems.splice(dropIndex, 0, {
        loop,
        length: 8
      });
    }
  
    // REORDER EXISTING
    if (data.type === "timeline") {
      const item = timelineItems.splice(data.index, 1)[0];
  
      // adjust index if moving forward
      if (data.index < dropIndex) dropIndex--;
  
      timelineItems.splice(dropIndex, 0, item);
    }
  
    renderTimelineBlocks();
    updateTimelineSize();
  });

  timeline.appendChild(row);
}


/* -----------------------------
RENDER TIMELINE BLOCKS
------------------------------ */
function renderTimelineBlocks() {
  timeline.innerHTML = ""; // clear all rows

  if (timelineItems.length === 0) return;

  const MAX_WIDTH = 900; // max timeline width
  const MIN_PX_PER_BEAT = 12;
  const MAX_PX_PER_BEAT = 40;

  let currentRow = document.createElement("div");
  currentRow.classList.add("timeline-row");
  timeline.appendChild(currentRow);

  let rowBeats = 0;
  let rows = [currentRow];

  timelineItems.forEach((item, idx) => {
    // Calculate tentative width of item
    let tempPxPerBeat = MAX_WIDTH / (rowBeats + item.length);
    tempPxPerBeat = Math.min(MAX_PX_PER_BEAT, Math.max(MIN_PX_PER_BEAT, tempPxPerBeat));
    let tempWidth = item.length * tempPxPerBeat;

    // if adding this item exceeds MAX_WIDTH, start new row
    if (rowBeats * tempPxPerBeat + tempWidth > MAX_WIDTH) {
      currentRow = document.createElement("div");
      currentRow.classList.add("timeline-row");
      timeline.appendChild(currentRow);
      rowBeats = 0;
      rows.push(currentRow);
    }

    const block = document.createElement("div");
block.classList.add("timeline-block");
block.textContent = item.loop.name;

block.draggable = true;

// store index
block.dataset.index = idx;

// DRAG START (timeline block)
block.addEventListener("dragstart", e => {
  e.dataTransfer.setData(
    "application/json",
    JSON.stringify({
      type: "timeline",
      index: idx
    })
  );
});

    if (item.loop.color) {
      block.style.background = item.loop.color;
    }

    block.style.gridColumn = `span ${item.length}`;

    currentRow.appendChild(block);
    rowBeats += item.length;
  });

  // Update each row width and px per beat
  rows.forEach(row => {
    const totalBeats = Array.from(row.children).reduce((sum, b) => sum + parseInt(b.style.gridColumn.replace("span ", "")), 0);
    let pxPerBeat = Math.min(MAX_PX_PER_BEAT, Math.max(MIN_PX_PER_BEAT, MAX_WIDTH / totalBeats));
    row.style.gridAutoColumns = pxPerBeat + "px";
    row.style.width = Math.min(totalBeats * pxPerBeat, MAX_WIDTH) + "px";
  });

  updateSongLength();
}

/* -----------------------------
SONG LENGTH
------------------------------ */
function updateSongLength() {
  if (timelineItems.length === 0) {
    songDuration = 0;
    timeDisplay.textContent = "0:00 / 0:00";
    return;
  }

  // Compute total beats based on timelineItems
  let totalBeats = 0;
  timelineItems.forEach(item => {
    totalBeats += item.length;
  });

  // Each beat in ms
  songDuration = totalBeats * beatDuration;

  // Update UI
  timeDisplay.textContent = `0:00 / ${formatTime(songDuration)}`;
}
/* -----------------------------
PROGRESS BAR
------------------------------ */
const songProgress = document.getElementById("song-progress");
const timeDisplay = document.getElementById("time-display");

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

let animationFrame;

function startPlayhead() {
  cancelAnimationFrame(animationFrame);

  const startTime = performance.now() - startOffset;

  function animate(time) {
    if (!isPlaying) return;

    const elapsed = time - startTime;
    const percent = Math.min(elapsed / songDuration, 1);

    playhead.style.transform = `translateX(${percent * 100}%)`;
    songProgress.style.width = `${percent * 100}%`;
    timeDisplay.textContent = `${formatTime(elapsed)} / ${formatTime(songDuration)}`;

    if (percent < 1) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      isPlaying = false;
      startOffset = 0;
      playhead.style.transform = "translateX(0%)";
      songProgress.style.width = "0%";
    }
  }

  animationFrame = requestAnimationFrame(animate);
  console.log("duration:", songDuration);
}


/* -----------------------------
PLAY SONG
------------------------------ */

playBtn.addEventListener("click", () => {
  if (isPlaying) return;

  updateSongLength();

  isPlaying = true;

  songStartTime = performance.now();

  timelineItems.forEach(item => {
    const rowItems = timelineItems;

  const indexInRow = rowItems.indexOf(item);

  let startCol = 0;
  
  for (let i = 0; i < indexInRow; i++) {
    startCol += rowItems[i].length;
  }

  const startTime = startCol * beatDuration;

    const loopLength = item.loop.events.reduce(
      (m, e) => Math.max(m, e.time), 0
    );

    const repeats = Math.ceil(
      (item.length * beatDuration) / loopLength
    );

    for (let r = 0; r < repeats; r++) {
      item.loop.events.forEach(event => {

        let time =
          startTime + event.time + r * loopLength - startOffset;

        if (time < 0) return;

        const timeout = setTimeout(() => {
          playSound(event.category, event.i);
        }, time);

        playTimeouts.push(timeout);
      });
    }
  });

  startPlayhead();
});

/* -----------------------------
PAUSE and Restart SONG
------------------------------ */

pauseBtn.addEventListener("click", () => {
  if (!isPlaying) return;

  isPlaying = false;

  playTimeouts.forEach(t => clearTimeout(t));
  playTimeouts = [];

  startOffset += performance.now() - songStartTime;

  cancelAnimationFrame(animationFrame);
});


const restartBtn = document.getElementById("restartSongBtn");
restartBtn.addEventListener("click", () => {

  isPlaying = false;

  playTimeouts.forEach(t => clearTimeout(t));
  playTimeouts = [];

  startOffset = 0;
  songStartTime = 0;

  cancelAnimationFrame(animationFrame);

  playhead.style.transform = "translateX(0%)";

  const progress = document.getElementById("song-progress");
  if (progress) progress.style.width = "0%";

  timeDisplay.textContent = "0:00 / 0:00";
});


const clearBtn = document.getElementById("clearSongBtn");

clearBtn.addEventListener("click", () => {

  isPlaying = false;

  playTimeouts.forEach(t => clearTimeout(t));
  playTimeouts = [];

  cancelAnimationFrame(animationFrame);

  timelineItems = [];

  startOffset = 0;
  songStartTime = 0;
  songDuration = 0;

  playhead.style.transform = "translateX(0%)";

  const progress = document.getElementById("song-progress");
  if (progress) progress.style.width = "0%";

  timeDisplay.textContent = "0:00 / 0:00";

  renderTimelineBlocks();
  updateTimelineSize();
  updateSongLength();

  if (!confirm("clear entire timeline?")) return;
});

/* -----------------------------
INIT
------------------------------ */

createTimelineGrid();

const trash = document.getElementById("trash-zone");

trash.addEventListener("dragover", e => {
  e.preventDefault();
});

trash.addEventListener("drop", e => {
  e.preventDefault();

  const data = JSON.parse(
    e.dataTransfer.getData("application/json")
  );

 
  if (data.type === "timeline") {
    timelineItems.splice(data.index, 1);
    renderTimelineBlocks();
    updateTimelineSize();
  }

 
  if (data.type === "bank") {
    savedLoops = savedLoops.filter(loop => loop.id !== data.id);

    localStorage.setItem("savedLoops", JSON.stringify(savedLoops));

    renderBank();
  }
});

/* -----------------------------
UPDATE TIMELINE SIZE + PLACEHOLDER
------------------------------ */
function updateTimelineSize() {
  const rows = timeline.querySelectorAll(".timeline-row");
  if (rows.length === 0) return;

  rows.forEach(row => {
    const totalBeats = Array.from(row.children).reduce(
      (sum, b) => sum + parseInt(b.style.gridColumn.replace("span ", "")), 0
    );

    let pxPerBeat = Math.min(40, Math.max(12, MAX_TIMELINE_WIDTH / totalBeats));
    row.style.gridAutoColumns = pxPerBeat + "px";
    row.style.width = Math.min(totalBeats * pxPerBeat, MAX_TIMELINE_WIDTH) + "px";
  });

  const placeholder = document.getElementById("timeline-placeholder");
  if (placeholder) {
    placeholder.style.display = timelineItems.length ? "none" : "block";
  }
}

if (toggleBankBtn && bankSection) {

  const isCollapsed = localStorage.getItem("bankCollapsed") === "true";

  if (isCollapsed) {
    bankSection.classList.add("collapsed");
    toggleBankBtn.textContent = "+";
  }

  toggleBankBtn.addEventListener("click", () => {
    console.log("clicked"); // 👈 debug (you should see this)

    bankSection.classList.toggle("collapsed");

    const collapsed = bankSection.classList.contains("collapsed");

    toggleBankBtn.textContent = collapsed ? "+" : "–";

    localStorage.setItem("bankCollapsed", collapsed);
  });

}



// Grab DOM elements

const audio = document.getElementById("your-audio-element"); // your <audio>
const measureFill = document.getElementById("measure-fill");

audio.addEventListener("timeupdate", () => {
  const progressPercent = (audio.currentTime / audio.duration) * 100;
  measureFill.style.width = `${progressPercent}%`;
});

document.addEventListener("DOMContentLoaded", () => {
  const toggleBankBtn = document.getElementById("toggleBankBtn");
  const bankSection = document.querySelector(".bank-section");

  if (!toggleBankBtn || !bankSection) {
    console.error("Toggle elements not found");
    return;
  }

  // load state
  const isCollapsed = localStorage.getItem("bankCollapsed") === "true";

  if (isCollapsed) {
    bankSection.classList.add("collapsed");
    toggleBankBtn.textContent = "+";
  }

  toggleBankBtn.addEventListener("click", () => {
    console.log("clicked"); // debug

    bankSection.classList.toggle("collapsed");

    const collapsed = bankSection.classList.contains("collapsed");

    toggleBankBtn.textContent = collapsed ? "+" : "–";

    localStorage.setItem("bankCollapsed", collapsed);
  });
});