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

  savedLoops.forEach(loop => {

    const tile = document.createElement("div");
    tile.classList.add("saved-loop-tile");

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