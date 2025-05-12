function updateDateTime() {
  const now = new Date();

  const timeOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  };

  const dateOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  const currentTime = now.toLocaleTimeString([], timeOptions);
  const currentDate = now.toLocaleDateString([], dateOptions);

  document.getElementById('time').textContent = currentTime;
  document.getElementById('date').textContent = currentDate;
}

// Time update
updateDateTime();
setInterval(updateDateTime, 1000);

// Sky color update
function updateSkyColor() {
  const sky = document.querySelector('.sky');
  const hour = new Date().getHours();

  let color;

  if (hour >= 5 && hour < 8) {
    color = '#FFD9A0'; // morning
  } else if (hour >= 8 && hour < 11) {
    color = '#BDF6FF'; // day
  } else if (hour >= 11 && hour < 12) {
    color = '#A7EBFE'; // late morning
  } else if (hour >= 12 && hour < 14) {
    color = '#9CDEF9'; // afternoon
  } else if (hour >= 14 && hour < 17) {
    color = '#93CEFA'; // early evening
  } else if (hour >= 17 && hour < 19) {
    color = '#6D9AE8'; // sunset
  } else if (hour >= 19 && hour < 21) {
    color = '#3B408F'; // dusk
  } else {
    color = '#13194D'; // night
  }

  sky.style.backgroundColor = color;
}

updateSkyColor();
setInterval(updateSkyColor, 5 * 60 * 1000); // every 5 min

// Caterpillar setup
const caterpillar = document.getElementById("caterpillar");
const hour = new Date().getHours() % 12 || 12;

caterpillar.innerHTML = ""; // clear first

for (let i = 0; i < hour; i++) {
  const segment = document.createElement("div");
  segment.classList.add("segment");
  if (i === 0) {
    segment.classList.add("head");
    segment.innerHTML = "<div class='eyes'></div><div class='mouth'></div>";
  }
  caterpillar.appendChild(segment);
}

const segments = Array.from(document.getElementsByClassName("segment"));

// Mouse tracking & movement
let centerX = window.innerWidth / 2;
let centerY = window.innerHeight / 2;
const restX = centerX;
const restY = centerY + 170;

let isMouseDown = false;
let mouseX = centerX;
let mouseY = centerY;

document.addEventListener("mousedown", (event) => {
  // Prevent caterpillar from reacting when clicking on form elements
  if (event.target.closest('label') || event.target.tagName === 'INPUT') return;
  
  isMouseDown = true;
});

document.addEventListener("mouseup", () => {
  isMouseDown = false;
});

document.addEventListener("mousemove", function(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

let positions = new Array(segments.length).fill([centerX, centerY]);

function animateCaterpillar() {
  const isAtBottom = mouseY > window.innerHeight - 100;
  const targetX = isAtBottom ? centerX : mouseX;
  const targetY = isAtBottom ? centerY : mouseY;

  if (isMouseDown) {
    positions.unshift([targetX, targetY]);
  } else {
    positions.unshift([restX, restY]);
  }

  positions = positions.slice(0, segments.length);

  segments.forEach((seg, i) => {
    const [x, y] = positions[i];
    seg.style.position = "absolute";
    seg.style.left = `${x - i * 40}px`; // spread spacing
    seg.style.top = `${y}px`;
  });

  requestAnimationFrame(animateCaterpillar);
}

animateCaterpillar();

// Caterpillar & leg color pickers
const caterpillarInput = document.getElementById('caterpillarColor');
const legInput = document.getElementById('legColor');

caterpillarInput.addEventListener('input', () => {
  document.documentElement.style.setProperty('--caterpillar-color', caterpillarInput.value);
});

legInput.addEventListener('input', () => {
  document.documentElement.style.setProperty('--leg-color', legInput.value);
});
