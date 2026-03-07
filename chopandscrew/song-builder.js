let savedLoops = JSON.parse(localStorage.getItem("savedLoops")) || [];
let arrangement = [];


const bank = document.getElementById("loop-bank");


renderBank();

/* ===========================
   RENDER LOOP BANK
=========================== */
function renderBank() {

  bank.innerHTML = "";

  savedLoops.forEach(loop => {

    const tile = document.createElement("div");
    tile.classList.add("saved-loop-tile");
    tile.draggable = true;

    // progress ring
    const progress = document.createElement("div");
    progress.classList.add("loop-progress");
    
    const label = document.createElement("span");
    label.classList.add("loop-label");
    label.textContent = loop.name;
    
    tile.appendChild(progress);
    tile.appendChild(label);
    
    if (loop.color) {
      tile.style.background = loop.color;
    }

    /* -------------------------
     PREVIEW LOOP
    ------------------------- */
    let holdTimer = null;
    let isHolding = false;
    
    

    tile.addEventListener("mousedown", () => {
    
      isHolding = false;
    
      holdTimer = setTimeout(() => {
        isHolding = true;
        startInfinitePreview(loop, progress);
      }, 200); // hold threshold
    
    });
    
    tile.addEventListener("mouseup", () => {
    
      clearTimeout(holdTimer);
    
      if (isHolding) {
        stopPreview();
      } else {
        playLoopPreview(loop, tile);
      }
    
    });
    
    tile.addEventListener("mouseleave", stopPreview);

    /* -------------------------
       DRAG START
    ------------------------- */

    tile.addEventListener("dragstart", e => {
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({ type: "bank", id: loop.id })
      );
      tile.classList.add("dragging");
    });
    
    tile.addEventListener("dragend", () => {
      tile.classList.remove("dragging");
    });

    bank.appendChild(tile);

  });

}

let previewTimeouts = []; // global to cancel previous previews

function playLoopPreview(loop, tile) {
    const progress = tile.querySelector(".loop-progress");
    if (!progress) return;

    const loopLength = (60000 / loop.bpm) * 4; // duration of one full loop in ms

    // cancel any ongoing preview
    previewTimeouts.forEach(t => clearTimeout(t));
    previewTimeouts = [];

    let startTime = performance.now();

    function animate(now) {
        const elapsed = now - startTime;
        const percent = Math.min(elapsed / loopLength, 1);
        const degrees = percent * 360;

        // update conic-gradient to fill the ring
        progress.style.background = `conic-gradient(#fc6f17 0deg ${degrees}deg, transparent ${degrees}deg 360deg)`;

        if (percent < 1) {
            requestAnimationFrame(animate);
        } else {
            // reset gradient when done
            progress.style.background = `conic-gradient(#fc6f17 0deg 0deg, transparent 0deg 360deg)`;
        }
    }

    requestAnimationFrame(animate);

    // schedule all sounds in the loop
    loop.events.forEach(event => {
        const timeout = setTimeout(() => {
            playSound(event.category, event.i);
        }, event.time);
        previewTimeouts.push(timeout);
    });
}
let previewInterval = null;

function startInfinitePreview(loop, progressEl) {

  stopPreview();

  const loopLength = (60000 / loop.bpm) * 4;

  progressEl.style.animation =
    `loopCircle ${loopLength/1000}s linear infinite`;

  function playRound() {

    loop.events.forEach(event => {

      const t = setTimeout(() => {
        playSound(event.category, event.i);
      }, event.time);

      previewTimeouts.push(t);

    });

  }

  playRound();

  previewInterval = setInterval(playRound, loopLength);

}

function stopPreview() {
  previewTimeouts.forEach(t => clearTimeout(t));
  previewTimeouts = [];
  clearInterval(previewInterval);
  previewInterval = null;

  // reset progress rings
  document.querySelectorAll(".loop-progress").forEach(el => {
    el.style.background = "conic-gradient(#fc6f17 0deg 0deg, transparent 0deg 360deg)";
    el.style.animation = "none";
  });
}


/* ===========================
   TIMELINE DROP & RENDER
=========================== */

const timeline = document.getElementById("song-timeline");
buildTimelineGrid();

// Allow drops on the timeline
timeline.addEventListener("dragover", e => e.preventDefault());

timeline.addEventListener("drop", e => {
  e.preventDefault();

  const raw = e.dataTransfer.getData("application/json");
  if (!raw) return;
  const data = JSON.parse(raw);

  if (data.type === "bank") {
    // Drag from loop bank to timeline
    const loop = savedLoops.find(l => l.id == data.id);
    if (!loop) return;

    renderTimelineBlocks(); // make sure rows exist

    const rect = timeline.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const rowHeight = rect.height / 4; // 4 rows
    const rowIndex = Math.floor(y / rowHeight);

    arrangement.push({ loop, row: rowIndex });
    renderTimelineBlocks();
  }

  if (data.type === "timeline") {
    // Rearranging existing blocks
    const moved = arrangement.splice(data.index, 1)[0];

    const rect = timeline.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const rowHeight = rect.height / 4;
    const rowIndex = Math.floor(y / rowHeight);

    moved.row = rowIndex;
    arrangement.splice(data.index, 0, moved);
    renderTimelineBlocks();
  }
});

function buildTimelineGrid() {

  timeline.innerHTML = "";

  const numRows = 4;
  const numCols = 16;

  for (let i = 0; i < numRows; i++) {

    const row = document.createElement("div");
    row.classList.add("timeline-row");

    for (let j = 0; j < numCols; j++) {

      const col = document.createElement("div");
      col.classList.add("timeline-col");

      col.dataset.row = i;
      col.dataset.col = j;

      col.addEventListener("dragover", e => e.preventDefault());

      col.addEventListener("drop", e => {
        e.preventDefault();
        e.stopPropagation();

        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;

        const data = JSON.parse(raw);

        const rowIndex = parseInt(col.dataset.row);
        const colIndex = parseInt(col.dataset.col);

        if (data.type === "bank") {

          const loop = savedLoops.find(l => l.id == data.id);
          if (!loop) return;

          arrangement.push({
            loop,
            row: rowIndex,
            col: colIndex,
            length: 4
          });

        }

        if (data.type === "timeline") {

          const moved = arrangement.splice(data.index, 1)[0];
          moved.row = rowIndex;
          moved.col = colIndex;

          arrangement.push(moved);

        }

        renderTimelineBlocks();

      });

      row.appendChild(col);

    }

    timeline.appendChild(row);

  }

}

function renderTimelineBlocks() {

  document.querySelectorAll(".timeline-block").forEach(b => b.remove());

  arrangement.forEach((item, index) => {

    const col = timeline.querySelector(
      `[data-row="${item.row}"][data-col="${item.col}"]`
    );

    if (!col) return;

    const block = document.createElement("div");
    block.classList.add("timeline-block");

    block.style.gridColumn = `span ${item.length || 4}`;

    block.textContent = item.loop.name;
    block.draggable = true;

    block.dataset.index = index;

    block.addEventListener("dragstart", e => {

      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({ type: "timeline", index })
      );

    });

    /* STRETCH HANDLE */

    const stretch = document.createElement("div");
    stretch.classList.add("stretch-handle");

    stretch.addEventListener("mousedown", e => {

      e.stopPropagation();

      const startX = e.clientX;
      const startLength = item.length || 4;

      function onMove(ev) {

        const dx = ev.clientX - startX;

        const beats = Math.round(dx / 40);

        item.length = Math.max(1, startLength + beats);

        renderTimelineBlocks();

      }

      function onUp() {

        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);

      }

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);

    });

    block.appendChild(stretch);

    col.appendChild(block);

  });

}

/* ===========================
   TRASH
=========================== */
  const trash = document.getElementById("trash-zone");

  trash.addEventListener("dragover", e => {
    e.preventDefault();
    trash.classList.add("hover");
  });
  
  trash.addEventListener("dragleave", () => {
    trash.classList.remove("hover");
  });
  
  trash.addEventListener("drop", e => {
    e.preventDefault();
    trash.classList.remove("hover");
  
    const data = JSON.parse(
      e.dataTransfer.getData("application/json")
    );
  
    if (data.type === "timeline") {
      arrangement.splice(data.index, 1);
      renderTimelineBlocks();
    }
  
    if (data.type === "bank") {
      savedLoops = savedLoops.filter(l => l.id != data.id);
      localStorage.setItem("savedLoops", JSON.stringify(savedLoops));
      renderBank();
    }
  });

  let isPlaying = false;
let currentTimeouts = [];

const playBtn = document.getElementById("playSongBtn");
const pauseBtn = document.getElementById("pauseSongBtn");
const restartBtn = document.getElementById("restartSongBtn");

playBtn.addEventListener("click", playArrangement);
pauseBtn.addEventListener("click", pauseArrangement);
restartBtn.addEventListener("click", restartArrangement);

function updateSongLength() {

  const beatDur = getColumnDuration();

  songLengthMs = arrangement.reduce((max,item)=>{

    const end = (item.col + item.length) * beatDur;

    return Math.max(max,end);

  },0);

}

const BPM = 120;
const BEATS_PER_BAR = 4;

function getBeatDuration() {
  return 60000 / BPM;
}

function getColumnDuration() {
  return getBeatDuration(); // 1 column = 1 beat
}

function startPlayheadAnimation() {

  const playhead = document.getElementById("song-playhead");
  const timeline = document.getElementById("song-timeline");

  const timelineWidth = timeline.scrollWidth;

  function animate() {

    if (!isPlaying) return;

    const elapsed = Date.now() - songStartTime;

    const progress = Math.min(elapsed / songLengthMs, 1);

    playhead.style.transform =
      `translateX(${progress * timelineWidth}px)`;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      isPlaying = false;
    }

  }

  requestAnimationFrame(animate);

}

function playArrangement() {

  if (isPlaying) return;

  isPlaying = true;
  currentTimeouts = [];

  const beatDur = getColumnDuration();

  songStartTime = Date.now();

  startPlayheadAnimation();

  arrangement.forEach(item => {

    const startTime = item.col * beatDur;

    const loopLength = item.loop.events.reduce(
      (m,e)=>Math.max(m,e.time),
      0
    );

    const repeats = Math.ceil((item.length * beatDur) / loopLength);

    for (let r = 0; r < repeats; r++) {

      item.loop.events.forEach(event => {

        const timeout = setTimeout(() => {

          if (isPlaying) {
            playSound(event.category, event.i);
          }

        }, startTime + event.time + r * loopLength);

        currentTimeouts.push(timeout);

      });

    }

  });

  updateSongLength();

}

function pauseArrangement() {

  currentTimeouts.forEach(t => clearTimeout(t));
  currentTimeouts = [];

  isPlaying = false;

}

function restartArrangement() {

  pauseArrangement();

  const playhead = document.getElementById("song-playhead");
  playhead.style.transform = "translateX(0px)";

  playArrangement();

}

let songLengthMs = 10000; // default 10 seconds
let playheadInterval = null;
let songStartTime = 0;

const toggleBtn = document.getElementById("toggleBankBtn");
const bankSection = document.querySelector(".bank-section");

toggleBtn.addEventListener("click", () => {
  bankSection.classList.toggle("collapsed");

  toggleBtn.textContent =
    bankSection.classList.contains("collapsed") ? "+" : "–";
});


const blocks = document.querySelectorAll(".loop-tile");

// Create multiple rows dynamically if needed
function getTimelineRow(index) {
  let rows = timeline.querySelectorAll(".timeline-row");
  if (!rows[index]) {
    const row = document.createElement("div");
    row.classList.add("timeline-row");
    timeline.appendChild(row);
    return row;
  }
  return rows[index];
}
