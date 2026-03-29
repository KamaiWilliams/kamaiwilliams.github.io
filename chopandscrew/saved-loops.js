const savedLoopsGrid = document.getElementById("saved-loops-grid");

let previewTimeouts = [];



/* -----------------------------
   LOAD SAVED LOOPS
------------------------------ */

function loadSavedLoops() {

  const savedLoops = JSON.parse(localStorage.getItem("savedLoops")) || [];

  savedLoopsGrid.innerHTML = "";

  if (!savedLoops.length) {

    savedLoopsGrid.innerHTML = `
      <div class="no-loops">
        no loops saved yet :(
      </div>
    `;

    return;
  }
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
  
  savedLoops.forEach(loop => {
    if (!loop.color) {
      loop.color = loopColors[Math.floor(Math.random() * loopColors.length)];
    }
  });
  
  // persist fix
  localStorage.setItem("savedLoops", JSON.stringify(savedLoops));
  savedLoops.forEach(loop => {

    const tile = document.createElement("div");
    tile.classList.add("saved-loop-tile");
    
    if (loop.color) {
      tile.style.background = loop.color;
    }

    tile.innerHTML = `
      <div class="loop-progress"></div>
      <span class="loop-label">${loop.name}</span>
    `;

    tile.addEventListener("click", () => {

        document
          .querySelectorAll(".saved-loop-tile")
          .forEach(t => t.classList.remove("active"));
      
        tile.classList.add("active");
      
        if (loop.events && loop.events.length) {
          playLoopPreview(loop, tile);
        }
      
        localStorage.setItem("selectedLoopName", loop.name);
      
      });

    savedLoopsGrid.appendChild(tile);

  });

}

/* -----------------------------
   LOOP PREVIEW
------------------------------ */

function playLoopPreview(loop, tile) {

  const progress = tile.querySelector(".loop-progress");
  // clear any existing playback
  previewTimeouts.forEach(t => clearTimeout(t));
  previewTimeouts = [];

  if (!loop.events || !loop.events.length) return;

  const bpm = 90; // match your app BPM (or pull dynamically later)
  const beatDuration = 60000 / bpm;

  // find loop length
  const loopLength = loop.events.reduce(
    (max, e) => Math.max(max, e.time),
    0
  );

  // animate ring (optional but 🔥)
  const color = loop.color || "#ffffff"; // fallback if needed

  if (progress) {
    progress.style.background = `conic-gradient(${color} 0deg, transparent 0deg)`;
  }

  const startTime = performance.now();

  function scheduleLoop(startOffset = 0) {

    loop.events.forEach(event => {
  
      const timeout = setTimeout(() => {
        playSound(event.category, event.i);
      }, event.time + startOffset);
  
      previewTimeouts.push(timeout);
    });
  
    // repeat loop
    const loopTimeout = setTimeout(() => {
      scheduleLoop(startOffset + loopLength);
    }, loopLength);
  
    previewTimeouts.push(loopTimeout);
  }
  
  scheduleLoop();


}
/* -----------------------------
   PLAY BUTTON
------------------------------ */

document.getElementById("playSavedBtn")
.addEventListener("click", () => {

  const savedLoops =
    JSON.parse(localStorage.getItem("savedLoops")) || [];

  const selectedName =
    localStorage.getItem("selectedLoopName");

  if (!selectedName) {

    alert("select a loop to play!");
    return;

  }

  const selectedLoop =
    savedLoops.find(l => l.name === selectedName);

  localStorage.setItem(
    "currentLoop",
    JSON.stringify(selectedLoop)
  );

  window.location.href = "loop-pad.html";

});

/* -----------------------------
   PAUSE BUTTON
------------------------------ */

document.getElementById("pauseSavedBtn")
.addEventListener("click", () => {

  previewTimeouts.forEach(t => clearTimeout(t));
  previewTimeouts = [];

});

/* -----------------------------
   LOOP PAD BUTTON
------------------------------ */

document.getElementById("loopPadBtn")
.addEventListener("click", () => {

  window.location.href = "loop-pad.html";

});

/* -----------------------------
   INIT
------------------------------ */

loadSavedLoops();