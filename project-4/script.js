function updateDateTime() {
    const now = new Date();
    
    const timeOptions = {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
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
  
  // time
  updateDateTime();
  
  // Upd every second
  setInterval(updateDateTime, 1000);

  const caterpillar = document.getElementById("caterpillar");
  const hour = new Date().getHours() % 12 || 12;

  caterpillar.innerHTML = ""; 
  for (let i = 0; i < hour; i++) {
    const segment = document.createElement("div");
    segment.classList.add("segment");
    caterpillar.appendChild(segment);
  }
  
function updateSkyColor() {
  const sky = document.querySelector('.sky');
  const hour = new Date().getHours();

  let color;

  if (hour >= 5 && hour < 8) {
    // morning
    color = '#FFD9A0';
  } else if (hour >= 8 && hour < 11) {
    // Day
    color = '#BDF6FF';
  } else if (hour >= 10 && hour < 12) {
    // Day
    color = '#A7EBFE';
  } else if (hour >= 12 && hour < 14) {
    // afternoon
    color = '#9CDEF9';
  } else if (hour >= 14 && hour < 17) {
    // evening
    color = '#93CEFA'; 
  } else if (hour >= 17 && hour < 19) {
    // Sunset
    color = '#6D9AE8'; 
  } else if (hour >= 19 && hour < 21) {
    // almost night
    color = '#3B408F'; 
  } else {
    // Night
    color = '#13194D'; 
  }

  sky.style.backgroundColor = color;
}

updateSkyColor();
// Optional: update every 5 minutes
setInterval(updateSkyColor, 5 * 60 * 1000);

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

// Track mouse position
document.addEventListener("mousemove", function(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

const segments = Array.from(document.getElementsByClassName("segment"));
let positions = new Array(segments.length).fill([mouseX, mouseY]);

function animateCaterpillar() {
  positions.unshift([mouseX, mouseY]); // insert new position at start
  positions = positions.slice(0, segments.length); // limit length

  segments.forEach((seg, i) => {
    const [x, y] = positions[i];
    seg.style.position = "absolute";
    seg.style.left = x - 25 + "px"; // center
    seg.style.top = y - 25 + "px";
  });

  requestAnimationFrame(animateCaterpillar);
}

animateCaterpillar();

document.getElementById("colorPicker").addEventListener("input", (e) => {
  const newColor = e.target.value;
  segments.forEach(seg => seg.style.backgroundColor = newColor);
});

for (let i = 0; i < hour; i++) {
  const segment = document.createElement("div");
  segment.classList.add("segment");
  if (i === 0) {
    segment.classList.add("head");
    segment.innerHTML = "<div class='eyes'></div><div class='mouth'></div>";
  }
  caterpillar.appendChild(segment);
}