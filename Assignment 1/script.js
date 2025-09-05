let level = "hour"; // can be "hour", "minute", "second"
let selectedHour = null;
let selectedMinute = null;
let lastMinute = -1;

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(240);

  let h = hour();
  let m = minute();
  let s = second();

  // Log minute when it changes
  if (m !== lastMinute) {
    console.log("Minute changed:", m);
    lastMinute = m;
  }

  if (level === "hour") {
    drawGrid(24, h); // 24 rectangles, highlight current hour
  } else if (level === "minute") {
    drawGrid(60, m); // 60 rectangles, highlight current minute
  } else if (level === "second") {
    drawGrid(60, s); // 60 rectangles, highlight current second
  }
}

function drawGrid(n, currentIndex) {
    let cols = ceil(sqrt(n));
    let rows = ceil(n / cols);
  
    let margin = 20;       // outer margin around the whole grid
    let spacing = 20;       // space between each box
  
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
          fill(50, 150, 250); // highlight active
        } else {
          fill(255); // empty
        }
  
        stroke(0);
        strokeWeight(1);
  
        // Shrink rect to leave spacing between neighbors
        rect(x + spacing / 2, y + spacing / 2, cellW - spacing, cellH - spacing);
  
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