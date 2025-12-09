  
  
// ------------------------------------
// Mobile Map — Styled Like Scene 1
// ------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  buildMobileMap();
});

// ------------------------------------
// Build mobile map
// ------------------------------------
async function buildMobileMap() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Clear previous SVG
  d3.select("#mobile-map-svg").remove();

  // Create SVG (Scene 1 style)
  const svg = d3.select("#map")
      .append("svg")
      .attr("id", "mobile-map-svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "#FC7D01");

  const g = svg.append("g");

  // Projection (same as Scene 1)
  window.mobileProjection = d3.geoMercator()
      .center([-74.006, 40.7128])
      .scale(130000)
      .translate([width / 2, height / 2]);

      const path = d3.geoPath().projection(window.mobileProjection);


  // Tooltip (Scene 1 style but mobile-friendly)
  const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip mobile-tooltip")
      .style("opacity", 0);

  // --------- LOAD MAP + DATA ----------
  try {
      const boroughs = await d3.json("data/nyc-boroughs.geojson");
      const restrooms = await d3.csv("data/public-restrooms-data.csv");

      // Draw borough shapes
      g.selectAll("path")
          .data(boroughs.features)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("fill", "#806763")
          .attr("stroke", "#806763")
          .attr("stroke-width", 1);

      // Normalize restroom CSV headers
      restrooms.forEach(d => {
          d.Name = d["Facility Name"] || d["Facility"] || "Unnamed";
          d.Latitude = +d.Latitude || +d.lat || +d.Lat || +d["Latitude"];
          d.Longitude = +d.Longitude || +d.lon || +d.Lon || +d["Longitude"];

          // Normalize Operator
          const op = (d["Operator"] || "").toLowerCase();
          if (op.includes("park")) d.Operator = "Parks Department";
          else if (op.includes("library") || op.includes("bpl")) d.Operator = "Library";
          else if (op.includes("mta") || op.includes("transit")) d.Operator = "Transit Hub";
          else if (op.includes("community")) d.Operator = "Community Center";
          else d.Operator = "Other";

          // Normalize Status
          const s = (d["Status"] || "").toLowerCase();
          if (s.includes("operat") || s.includes("open") || s.includes("service")) d.Status = "Operational";
          else if (s.includes("closed") || s.includes("construction")) d.Status = "Closed for Construction";
          else d.Status = "Not Operational";
      });

      const valid = restrooms.filter(d => !isNaN(d.Latitude) && !isNaN(d.Longitude));
        window.mobileRestrooms = valid; // ✅ make data available to GPS feature


      // Scene 1 color palette
      const typeColors = {
          "Parks Department": "#06d6a0",
          "Library": "#ffd60a",
          "Transit Hub": "#2ca02c",
          "Community Center": "#d62728",
          "Other": "#FF2269"
      };

      // Draw dots
      // Draw dots with click/touch showing full details
      g.selectAll("circle.restroom")
      .data(valid)
      .enter()
      .append("circle")
      .attr("class", "restroom")
      .attr("cx", d => window.mobileProjection([d.Longitude, d.Latitude])[0])
      .attr("cy", d => window.mobileProjection([d.Longitude, d.Latitude])[1])
      .attr("r", 2)
      .attr("fill", d => typeColors[d.Operator])
      .style("opacity", 1)
     .on("click touchstart", (event, d) => {
  event.stopPropagation();
  showInfoPanel(d);
  highlightNearest(d);   // ✅ ADD THIS
});

    

// ----------------------------
// Bottom Info Panel Logic
// ----------------------------
function showInfoPanel(d) {
  const panel = document.getElementById("info-panel");
  const box = document.getElementById("info-content");

  const hours = d["Hours of Operation"] || d.Hours || "Not Listed";
  const open = d.Open || "—";
  const accessibility = d.Accessibility || "Not Listed";

  box.innerHTML = `
    <h3>${d.Name}</h3>
    <p><b>Type:</b> ${d.Operator}</p>
    <p><b>Status:</b> ${d.Status}</p>
    <p><b>Open:</b> ${open}</p>
    <p><b>Hours:</b> ${hours}</p>
    <p><b>Accessibility:</b> ${accessibility}</p>
`;

  panel.classList.add("show");
} 

      // --------- ZOOM + TOUCH DRAG ----------
      const zoom = d3.zoom()
          .scaleExtent([1, 9])
          .on("zoom", event => g.attr("transform", event.transform));

      svg.call(zoom);
// expose map objects so other functions can zoom/transform it
window.mobileZoom = zoom;
window.mobileSvg = svg;
window.mobileG = g;
window.mobileProjection = window.mobileProjection || window.mobileProjection; // you already set this
window.mobileWidth = width;
window.mobileHeight = height;

  } catch (err) {
      console.error("Mobile map error:", err);
  }
}

// ------------------------------------
// FIND NEAREST RESTROOM (GPS)
// ------------------------------------
console.log("GPS SCRIPT LOADED ✅");

let userLocation = null;

document.addEventListener("DOMContentLoaded", () => {
    const findMeBtn = document.getElementById("find-me");
  
    if (!findMeBtn) {
      console.error("❌ FIND-ME BUTTON NOT FOUND");
      return;
    }
  
    findMeBtn.addEventListener("click", () => {
      console.log("FIND ME CLICKED ✅");
  
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your device.");
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        position => {
          userLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
        
          // show user on map right away
          showUserOnMap();
        
          // smoothly zoom and center map on user, then highlight nearby restrooms
          revealMapAndZoomToUser(3);
        
          // highlight nearest restroom in the panel
          findNearestRestroom();
        },
        
        error => {
          alert("Location access denied. Please enable it in your browser.");
        }
      );
    });
  });
  

// ------------------------------------
// SHOW USER DOT ON MAP
// ------------------------------------
function showUserOnMap() {
  if (!userLocation) return;
  const svg = d3.select("#mobile-map-svg");
  const g = window.mobileG || svg.select("g");
  const projection = window.mobileProjection;
  if (!projection) return;

  d3.select("#user-dot").remove();

  g.append("circle")
    .attr("id", "user-dot")
    .attr("cx", projection([userLocation.lon, userLocation.lat])[0])
    .attr("cy", projection([userLocation.lon, userLocation.lat])[1])
    .attr("r", 3)
    .attr("fill", "#FC7D01")
    .attr("stroke", "#1F0E02")
    .attr("stroke-width", 1);
}

  
// call this after userLocation is set
function revealMapAndZoomToUser(k = 3) {

  // ✅ HIDE THE REAL INTRO OVERLAY
  const overlay = document.getElementById("intro-overlay");
  if (overlay) {
    overlay.classList.add("hide");
  }

  // ✅ ACTIVATE UI BUTTONS + DETAILS
  activateUI();

  if (!window.mobileSvg || !window.mobileProjection || !window.mobileZoom) return;

  const [x, y] = window.mobileProjection([userLocation.lon, userLocation.lat]);

  const tx = window.mobileWidth / 2 - k * x;
  const ty = window.mobileHeight / 2 - k * y;

  window.mobileSvg.transition().duration(800).call(
    window.mobileZoom.transform,
    d3.zoomIdentity.translate(tx, ty).scale(k)
  );

  // ✅ show user dot
  showUserOnMap();

  // ✅ show STOP button
  const stopBtn = document.getElementById("stop-sharing");
  if (stopBtn) stopBtn.style.display = "block";
}



// ------------------------------------
// FIND NEAREST RESTROOM
// ------------------------------------
function findNearestRestroom() {
    if (!userLocation) {
      console.warn("No user location yet.");
      return;
    }
  
    if (!window.mobileRestrooms || window.mobileRestrooms.length === 0) {
      alert("Restroom data not loaded yet. Try again in a second.");
      return;
    }
  
    let closest = null;
    let minDist = Infinity;
  
    window.mobileRestrooms.forEach(r => {
      const d = haversine(
        userLocation.lat,
        userLocation.lon,
        r.Latitude,
        r.Longitude
      );
  
      if (d < minDist) {
        minDist = d;
        closest = r;
      }
    });
  
    if (closest) {
      showInfoPanel(closest);
    } else {
      alert("No restroom found.");
    }
    if (closest) {
      showInfoPanel(closest);
      highlightNearest(closest);
    }
    
  }
  function highlightNearest(restroom) {

    // Reset all dots
    d3.selectAll(".restroom")
      .classed("active", false);
  
    // Activate only the selected one
    d3.selectAll(".restroom")
      .filter(d => d === restroom)
      .raise()
      .classed("active", true);
  }
  
  
  
// ------------------------------------
// DISTANCE FORMULA
// ------------------------------------
function haversine(lat1, lon1, lat2, lon2) {
  const toRad = d => d * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

document.getElementById("stop-sharing").addEventListener("click", () => {
    userLocation = null;
    d3.select("#user-dot").remove();
    alert("Location sharing stopped.");
  });

  if (location.protocol !== "https:" && location.hostname !== "localhost") {
    alert("⚠️ Location only works on HTTPS or localhost.");
  }
  document.addEventListener("DOMContentLoaded", () => {

    const closeBtn = document.getElementById("info-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        document.getElementById("info-panel").classList.remove("show");
      });
    }
  
    const stopBtn = document.getElementById("stop-sharing");
    if (stopBtn) {
      stopBtn.addEventListener("click", () => {
        userLocation = null;
        d3.select("#user-dot").remove();
        alert("Location sharing stopped.");
      });
    }
  
    if (location.protocol !== "https:" && location.hostname !== "localhost") {
      alert("⚠️ Location only works on HTTPS or localhost.");
    }
  
  });
  document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("start-gps");
  
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        document.getElementById("find-me").click();
      });
    }
  });
  
  function activateUI() {
    document.getElementById("intro-overlay").classList.add("hide");
    document.getElementById("overlay-controls").classList.add("active");
    document.getElementById("details-section").classList.add("active");
  }
  function zoomToUser() {
    if (!userLocation) return;
  
    const svg = d3.select("#mobile-map-svg");
    const zoom = d3.zoom();
    const projection = window.mobileProjection;
  
    const [x, y] = projection([userLocation.lon, userLocation.lat]);
  
    svg.transition()
      .duration(1200)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(window.innerWidth / 2 - x, window.innerHeight / 2 - y)
          .scale(3)
      );
  }
    
  // ------------------------------
// Location Settings Dropdown Toggle
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("location-toggle");
  const dropdown = document.getElementById("location-dropdown");

  if (!toggle || !dropdown) return;

  toggle.addEventListener("click", () => {
    const isOpen = dropdown.style.display === "flex";
    dropdown.style.display = isOpen ? "none" : "flex";
  });
});
