/* script.js
   Based on your original file — added:
   - higher zoom options
   - smaller cow icon
   - AM/PM time formatting
   - playback speed control wired to the play loop
*/


/* CONFIG */
const CSV_PATH = "data/cow-herd-movement.csv"; // put your downloaded Movebank CSV here
const TIME_FORMAT_OPTIONS = { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:true };

/* MAP SETUP */
// preserve your map but allow deeper zoom and smoother zoom increments
const map = L.map("map", { zoomControl: true, zoomSnap: 0.5, zoomDelta: 0.5, maxZoom: 20 }).setView([10.7, 14.89], 11);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 20,
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

// --- Remove any default layer or legend controls (like "Animals") ---
document.querySelectorAll(".leaflet-control-layers, .leaflet-control-attribution").forEach(el => {
  if (el.textContent.toLowerCase().includes("animals")) el.remove();
});



// --- Adjust cow icon size dynamically based on zoom ---
// --- Scale cow <img> elements slightly on zoom (using transform scale) ---
const baseZoomForScale = 11;        // the zoom level where scale === 1
const scaleFactorPerZoom = 0.15;    // tweak this to increase/reduce scaling

map.on('zoom', () => {
  const zoom = map.getZoom();
  // compute a scale value: 1 at baseZoomForScale, grows as you zoom in
  const scale = Math.max(0.6, 1 + (zoom - baseZoomForScale) * scaleFactorPerZoom);

  // update all cow images that exist in the DOM
  const imgs = document.querySelectorAll('.cow-img');
  imgs.forEach(img => {
    // use transform for smooth GPU-accelerated scaling
    img.style.transform = `translateY(0px) scale(${scale})`;
  });

  // optionally adjust z-index so larger icons stay visible
  imgs.forEach(img => {
    img.style.zIndex = Math.round(scale * 1000);
  });
});




/* UI refs */
const slider = document.getElementById("timeSlider");
const tsDisplay = document.getElementById("timestamp");
const playBtn = document.getElementById("playBtn");
const animalListEl = document.getElementById("animalList");
const speedSelect = document.getElementById("speedSelect");

let dataByAnimal = {};        // { tagId: [{ts:Date, lat, lon, raw}] }
let animals = [];             // array of tagIds
let sortedTimestamps = [];    // array of Date objects (unique, sorted)
let markers = {};             // leaflet markers per tag
let labels = {};              // optional label popups
let anim = { playing:false, interval:null, speed:1, baseDelayMs:80 };


/* -------------------------
   CSV loader + parser
   Detects delimiter (tab or comma) and maps header columns using sample header names
   ------------------------- */
async function loadAndParseCSV(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error("Failed to load CSV: " + res.status);
  const text = await res.text();
  const lines = text.trim().split(/\r?\n/);
  if(lines.length < 2) return [];

  // detect delimiter using header line
  const header = lines[0];
  const delim = header.includes("\t") ? "\t" : ",";
  const headers = header.split(delim).map(h => h.trim());

  // helper to find column index by possible names
  function colIndex(possibleNames){
    for(const name of possibleNames){
      const idx = headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
      if(idx >= 0) return idx;
    }
    return -1;
  }

  const idxTimestamp = colIndex(["timestamp", "date", "time"]);
  const idxLon = colIndex(["location-long", "location_long", "lon", "longitude"]);
  const idxLat = colIndex(["location-lat", "location_lat", "lat", "latitude"]);
  const idxTag = colIndex(["tag-local-identifier", "tag_local_identifier", "individual-local-identifier", "tag_id"]);

  if(idxTimestamp<0 || idxLon<0 || idxLat<0 || idxTag<0){
    throw new Error("CSV missing one of required columns (timestamp, location-long, location-lat, tag-local-identifier). Found headers: " + headers.join(", "));
  }

  // parse rows
  const rows = [];
  for(let i=1;i<lines.length;i++){
    const raw = lines[i];
    if(!raw.trim()) continue;
    const cols = raw.split(delim);
    const tsRaw = cols[idxTimestamp]?.trim();
    const lonRaw = cols[idxLon]?.trim();
    const latRaw = cols[idxLat]?.trim();
    const tagId = cols[idxTag]?.trim() || "unknown";

    const ts = tsRaw ? new Date(tsRaw.replace(" ", "T")) : null; // try simple ISO-friendly transform
    const lon = Number(lonRaw);
    const lat = Number(latRaw);
    if(!ts || Number.isNaN(lat) || Number.isNaN(lon)) continue;

    rows.push({ ts, lat, lon, tagId, rawLine: raw });
  }

  // group by tag id
  const byAnimal = {};
  rows.sort((a,b)=>a.ts - b.ts);
  for(const r of rows){
    if(!byAnimal[r.tagId]) byAnimal[r.tagId] = [];
    byAnimal[r.tagId].push(r);
  }

  return { byAnimal, rows };
}

/* -------------------------
   Build timeline (unique timestamps)
   ------------------------- */
function buildTimeline(rows){
  const set = new Set(rows.map(r => +r.ts));
  const arr = Array.from(set).map(n=>new Date(n)).sort((a,b)=>a-b);
  return arr;
}

/* -------------------------
   For a given tag's sorted array, get last known record <= time
   binary search for efficiency
   ------------------------- */
function lastBefore(records, time){
  let lo = 0, hi = records.length - 1, ans = null;
  const t = +time;
  while(lo <= hi){
    const mid = Math.floor((lo + hi)/2);
    const mt = +records[mid].ts;
    if(mt <= t){ ans = records[mid]; lo = mid + 1; }
    else hi = mid - 1;
  }
  return ans;
}

/* -------------------------
   Create an inline SVG cow icon as a data URI (small, neutral)
   We overlay a numeric badge using a DivIcon.
   (smaller size to reduce overlap when zooming)
   ------------------------- */
function createCowIconDataURI(){
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' width='26' height='18' viewBox='0 0 36 24'>
    <g transform="translate(0,0)">
      <ellipse cx="18" cy="12" rx="12" ry="6" fill="#ffffff" stroke="#222" stroke-width="1"/>
      <circle cx="12" cy="9" r="1.6" fill="#222"/>
      <circle cx="24" cy="9" r="1.6" fill="#222"/>
      <rect x="4" y="6" width="2.4" height="2.4" rx="0.6" fill="#222"/>
      <rect x="29" y="6" width="2.4" height="2.4" rx="0.6" fill="#222"/>
    </g>
  </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}


/* -------------------------
   Draw initial markers (one per animal) with random cow PNG icons
   ------------------------- */
   /* Replace initMarkers() with this version */
   function initMarkers(tagIds){
    for(let i=0;i<tagIds.length;i++){
      const tag = tagIds[i];
      const cowNum = (i % 9) + 1; // pick cow image from 1–9
      const iconUrl = `images/cow${cowNum}.png`;
  
      const div = L.divIcon({
        className: "cow-divicon",
        html: `<img class="cow-img" src="${iconUrl}" style="width:26px;height:auto;transform-origin:center center;transform:translateY(0px) scale(1)" />`,
        iconSize: [26,18],
        iconAnchor: [13,9]
      });
      markers[tag] = L.marker([0,0], { icon: div, opacity:0 }).addTo(map);
    }
  }
  

/* Modal logic — add at the very bottom of your JS file */
/* Modal logic — add at the very bottom of your JS file */
/* --- About the Cows Pop-out --- */
const aboutBtn = document.getElementById("aboutBtn");
const aboutBox = document.getElementById("aboutBox");
const closeAbout = document.getElementById("closeAbout");
const gallery = aboutBox.querySelector(".cow-gallery");

for (let i = 1; i <= 9; i++) {
  const div = document.createElement("div");
  div.innerHTML = `<img src="images/cow${i}.png" alt="Cow ${i}"><div class="label">Cow ${i}</div>`;
  gallery.appendChild(div);
}

aboutBtn.onclick = () => {
  aboutBox.classList.toggle("hidden");
};

closeAbout.onclick = () => {
  aboutBox.classList.add("hidden");
};


/* -------------------------
   Render animal list in the legend with color/badge
   ------------------------- */
function populateLegend(tagIds){
  animalListEl.innerHTML = "";
  for(let i=0;i<tagIds.length;i++){
    const tag = tagIds[i];
    const li = document.createElement("li");
    li.innerHTML = `<span class="cowBadge">${i+1}</span>
                    <div style="flex:1;padding-left:6px">
                      <div style="font-weight:600">${tag}</div>
                      <div style="font-size:12px;color:#9aa6b2">records: ${dataByAnimal[tag].length}</div>
                    </div>`;
    animalListEl.appendChild(li);
  }
}


/* -------------------------
   Update view for a given timestamp (Date)
   For each animal, interpolate smoothly between nearest points
   ------------------------- */
   function updateForTime(time){
    for(const tag of animals){
      const records = dataByAnimal[tag];
      if(!records || records.length === 0) continue;
  
      // find the two records around the current time
      let prev = null, next = null;
      for(let i=0; i<records.length; i++){
        if(records[i].ts <= time) prev = records[i];
        if(records[i].ts > time){ next = records[i]; break; }
      }
  
      const marker = markers[tag];
  
      if(!prev && !next){
        marker.setOpacity(0);
        continue;
      }
  
      // if exact match or no next point, just show prev
      if(!next){
        marker.setLatLng([prev.lat, prev.lon]);
        marker.setOpacity(1);
        continue;
      }
  
      if(!prev){
        marker.setLatLng([next.lat, next.lon]);
        marker.setOpacity(1);
        continue;
      }
  
      // interpolate between prev and next
      const total = next.ts - prev.ts;
      const elapsed = time - prev.ts;
      const t = total > 0 ? elapsed / total : 0;
  
      const lat = prev.lat + (next.lat - prev.lat) * t;
      const lon = prev.lon + (next.lon - prev.lon) * t;
  
      marker.setLatLng([lat, lon]);
      marker.setOpacity(1);

      
    }
  
    // show formatted time
    tsDisplay.textContent = new Date(time).toLocaleString(undefined, TIME_FORMAT_OPTIONS);
  }
  

/* -------------------------
   Playback helpers
   ------------------------- */
function startIntervalPlayback(){
  // compute actual delay from baseDelay and speed
  const speed = anim.speed || 1;
  const delay = Math.max(20, Math.round(anim.baseDelayMs / speed));
  anim.interval = setInterval(()=>{
    const next = Math.min(Number(slider.max), Number(slider.value) + 1);
    slider.value = next;
    slider.dispatchEvent(new Event("input"));
    if(next >= Number(slider.max)){
      clearInterval(anim.interval);
      anim.playing = false;
      playBtn.textContent = "▶";
    }
  }, delay);
}

function stopIntervalPlayback(){
  if(anim.interval) clearInterval(anim.interval);
  anim.interval = null;
}

/* -------------------------
   Wire up slider & play & speed control
   ------------------------- */
function setupControls(timestamps){
  slider.min = 0;
  slider.max = Math.max(0, timestamps.length - 1);
  slider.value = 0;

  slider.oninput = () => {
    const idx = Number(slider.value);
    const t = timestamps[idx];
    updateForTime(t);
  };

  // play/pause button
  playBtn.onclick = () => {
    anim.playing = !anim.playing;
    playBtn.textContent = anim.playing ? "⏸" : "▶";
    if(anim.playing){
      // start interval using current speed
      startIntervalPlayback();
    } else {
      stopIntervalPlayback();
    }
  };

  // speed selector wiring
  speedSelect.addEventListener("change", (e) => {
    const val = Number(e.target.value) || 1;
    anim.speed = val;
    // if currently playing, restart interval with new speed
    if(anim.playing){
      stopIntervalPlayback();
      startIntervalPlayback();
    }
  });

  // initialize speed to selected value
  anim.speed = Number(speedSelect.value) || 1;
}

/* -------------------------
   ENTRY: load CSV, build model, init UI
   ------------------------- */
(async function init(){
  try {
    const parsed = await loadAndParseCSV(CSV_PATH);
    dataByAnimal = parsed.byAnimal;
    const rows = parsed.rows;
    animals = Object.keys(dataByAnimal).sort();
    if(animals.length === 0){
      tsDisplay.textContent = "No animals found in CSV";
      return;
    }

    // keep only sorted arrays per animal (they were sorted already)
    // expose as array of records with Date objects
    animals.forEach(tag => {
      // ensure sorted by timestamp
      dataByAnimal[tag].sort((a,b)=>a.ts - b.ts);
    });

    sortedTimestamps = buildTimeline(rows);
    initMarkers(animals);
    populateLegend(animals);
    setupControls(sortedTimestamps);

    // center map to bounding box of all data (quick compute)
    const allCoords = rows.map(r => [r.lat, r.lon]);
    const bounds = L.latLngBounds(allCoords);
    if(bounds.isValid()) map.fitBounds(bounds.pad(0.2));

    // initialize to first timestamp
    updateForTime(sortedTimestamps[0]);
    tsDisplay.textContent = new Date(sortedTimestamps[0]).toLocaleString(undefined, TIME_FORMAT_OPTIONS);
  } catch (err) {
    console.error(err);
    tsDisplay.textContent = "Error: " + err.message;
  }
})();
