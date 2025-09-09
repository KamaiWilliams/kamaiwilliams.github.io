let level = "hour"; // can be "hour", "minute", "second"
let selectedHour = null;
let selectedMinute = null;
let lastMinute = -1;

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background("#D90368"); //bg color

  let h = hour();
  let m = minute();
  let s = second();

  // min change
  if (m !== lastMinute) {
    console.log("Minute changed:", m);
    lastMinute = m;
  }

  if (level === "hour") {
    let h = hour(); 
    // midnight is box 24
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

  // even grid layout 
  if (n === 24) {
    cols = 6;  // 24 hrs
    rows = 4;
  } else if (n === 60) {
    cols = 10; // 60 min/sec
    rows = 6;
  } else {
    cols = ceil(sqrt(n));  // fallback
    rows = ceil(n / cols);
  }

   let isPhone = windowWidth < 700;

  if (isPhone) {
    // ---- PHONE VERSION ----
    // If phone, swap row/col orientation
if (isPhone) {
  let temp = cols;
  cols = rows;
  rows = temp;
}
    let spacing = 20; // gap between circles
    // pick diameter so grid fits inside canvas with margins
    let maxCircleW = (width - (cols + 1) * spacing) / cols;
    let maxCircleH = (height - (rows + 1) * spacing) / rows;
    let diameter = min(maxCircleW, maxCircleH);

    // total grid dimensions
    let gridW = cols * diameter + (cols - 1) * spacing;
    let gridH = rows * diameter + (rows - 1) * spacing;

    // top-left corner (to center the grid)
    let startX = (width - gridW) / 2;
    let startY = (height - gridH) / 2;

    let count = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (count >= n) break;

        let x = startX + c * (diameter + spacing);
        let y = startY + r * (diameter + spacing);

        if (count === currentIndex) {
          fill("#04A777");
        } else {
          fill("#FB6107");
        }
        stroke("#FBB02D");
        strokeWeight(diameter * 0.08); // proportional border

        ellipse(x + diameter / 2, y + diameter / 2, diameter, diameter);

        count++;
      }
    }
  } else {
    // ---- DESKTOP VERSION (your original) ----
    let margin = 21;
    let spacing = 21;

    let cellW = (width - margin * 2) / cols;
    let cellH = (height - margin * 2) / rows;

    let count = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (count >= n) break;

        let x = margin + c * cellW;
        let y = margin + r * cellH;

        if (count === currentIndex) {
          fill("#04A777");
        } else {
          fill("#FB6107");
        }
        stroke("#FBB02D");
        strokeWeight(7.5);

        ellipse(x + cellW / 2, y + cellH / 2, cellW - spacing, cellH - spacing);

        count++;
      }
    }
  }
}

function mousePressed() { // for clicking to view hr screen, min screen, sec screen
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