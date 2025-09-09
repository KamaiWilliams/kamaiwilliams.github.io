let level = "hour"; // can be "hour", "minute", "second"
let selectedHour = null;
let selectedMinute = null;
let lastMinute = -1;

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background("#99EDCC");

  let h = hour();
  let m = minute();
  let s = second();

  // Log minute when it changes
  if (m !== lastMinute) {
    console.log("Minute changed:", m);
    lastMinute = m;
  }

  if (level === "hour") {
    let h = hour(); 
    // convert 0 → 24, so midnight = 24
    let index = (h === 0 ? 23 : h - 1); 
    drawGrid(24, index);
  } else if (level === "minute") {
    let m = minute();
    let index = (m === 0 ? 59 : m - 1);
    drawGrid(60, index);
  } else if (level === "second") {
    let s = second();
    let index = (s === 0 ? 59 : s - 1);
    drawGrid(60, index);
  }
}

function drawGrid(n, currentIndex) {
  let cols, rows;

  // Force "clean" grid layouts for common cases
  if (n === 24) {
    cols = 6;  // 6 × 4 = 24
    rows = 4;
  } else if (n === 60) {
    cols = 10; // 10 × 6 = 60
    rows = 6;
  } else {
    cols = ceil(sqrt(n));  // fallback
    rows = ceil(n / cols);
  }

  let margin = 20;   // outer margin around grid
  let spacing = 20;  // space between boxes

  let cellW = (width - margin * 2) / cols;
  let cellH = (height - margin * 2) / rows;

  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (count >= n) break;

      let x = margin + c * cellW;
      let y = margin + r * cellH;

      // Fill for current active time unit
      if (count === currentIndex) {
        fill("#4CAF50"); // green for active
      } else {
        fill("#FFE942"); // yellow for inactive
      }

      stroke("#F61067");  // pink outline
      strokeWeight(3);

      // Shrink rect to leave spacing between neighbors
      rect(
        x + spacing / 2,
        y + spacing / 2,
        cellW - spacing,
        cellH - spacing
      );

      count++;
    }
  }
}

function mousePressed() {
  if (level === "hour") {
    selectedHour = hour();
    level = "minute";
  } else if (level === "minute") {
    selectedMinute = minute();
    level = "second";
  } else if (level === "second") {
    level = "hour"; // go back out
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}