// script.js

// Entry: start button (only wired once)
d3.select("#start").on("click", () => {
  d3.select("#title-screen")
    .transition()
    .duration(800)
    .style("opacity", 0)
    .remove();

  showRestroomMap();
});

// ------------------------------
// Reusable helpers
// ------------------------------
function removeSceneElements() {
  d3.selectAll("#map-svg, #map-svg-les, .tooltip, #filter-panel, #next-button, #back-button, #les-desc-overlay").remove();
}

function buildFilterPanel(containerSelection, dotsSelection, typeColors, dataKeyNames = { operator: "Operator", status: "Status", access: "Accessibility" }) {
  // containerSelection: d3 selection (div) where panel will be appended
  // dotsSelection: d3 selection of circles to filter (update via .attr("display"))
  // returns an object with update function and panel selection
  const typeCategories = Object.keys(typeColors);
  const statusCategories = ["Operational", "Not Operational", "Closed for Construction"];
  const accessCategories = ["Fully Accessible", "Partially Accessible", "Not Accessible"];

  const activeTypes = Object.fromEntries(typeCategories.map(t => [t, true]));
  const activeStatus = Object.fromEntries(statusCategories.map(s => [s, true]));
  const activeAccess = Object.fromEntries(accessCategories.map(a => [a, true]));

  // Build DOM
  containerSelection.html(""); // clear
  containerSelection
    .style("position", "absolute")
    .style("top", "280px")
    .style("left", "60px")
    .style("width", "320px")
    .style("background", "white")
    .style("padding", "18px")
    .style("border-radius", "12px")
    .style("box-shadow", "0 6px 18px rgba(0,0,0,0.12)")
    .style("z-index", 60)
    .style("display", "none"); // start hidden

  // Close button
  containerSelection.append("div")
    .attr("class", "close-btn")
    .html("&times;")
    .style("position", "absolute")
    .style("top", "8px")
    .style("right", "12px")
    .style("font-size", "20px")
    .style("cursor", "pointer")
    .on("click", () => containerSelection.classed("show", false).style("display", "none"));

  containerSelection.append("h3").text("Filter Restrooms").style("margin", "0 0 8px 0");

  // helper to build a section
  function buildSection(title, categories, activeObj, colorMap) {
    const sec = containerSelection.append("div").style("margin", "8px 0 12px 0");
    sec.append("div").text(title).style("font-weight", "600").style("margin-bottom", "6px");
    const list = sec.append("div");
    categories.forEach(cat => {
      const row = list.append("label").style("display", "flex").style("align-items", "center").style("margin-bottom", "6px").style("cursor", "pointer");
      row.append("input")
        .attr("type", "checkbox")
        .property("checked", true)
        .on("change", function() {
          activeObj[cat] = this.checked;
          update();
        });
      row.append("span").text(" " + cat).style("margin-left", "8px").style("color", colorMap ? colorMap[cat] : "#111");
    });
  }

  buildSection("Type", typeCategories, activeTypes, typeColors);
  buildSection("Status", statusCategories, activeStatus, null);
  buildSection("Accessibility", accessCategories, activeAccess, null);

  // Update function
  function update() {
    dotsSelection.each(function(d) {
      const vType = activeTypes[d.Operator];
      const vStatus = activeStatus[d.Status];
      const vAccess = activeAccess[d.Accessibility];
      const visible = !!(vType && vStatus && vAccess);
      d3.select(this).attr("display", visible ? null : "none");
    });
  }

  return {
    panel: containerSelection,
    update
  };
}

// ---------- haversine helper (km) ----------
function haversine(lat1, lon1, lat2, lon2){
  const toRad = d => d * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ------------------------------
// Scene 1 — Full NYC Map
// ------------------------------
async function showRestroomMap() {
  // Clean up any previous elements
  removeSceneElements();

  const width = window.innerWidth;
  const height = window.innerHeight;

  // Ensure the description is visible (your HTML element)
  d3.select("#map-description")
    .classed("hidden", false)
    .style("display", "block")
    .style("opacity", 1);

  // create SVG
  const svg = d3.select("body")
    .append("svg")
    .attr("id", "map-svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#FDFC54");

  const g = svg.append("g");
  const projection = d3.geoMercator()
    .center([-74.006, 40.7128])
    .scale(120000)
    .translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);
  const tooltip = d3.select("body").append("div").attr("class", "tooltip");

  // Load map + data
  try {
    const nycMap = await d3.json("data/nyc-boroughs.geojson");
    g.selectAll("path")
      .data(nycMap.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#FDFC54")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5);

    const restrooms = await d3.csv("data/public-restrooms-data.csv");

    // normalize and flexible keys
    restrooms.forEach(d => {
      d.Name = d["Facility Name"] || d["Facility"] || "Unnamed";
      const latKey = Object.keys(d).find(k => /lat/i.test(k)) || "Latitude";
      const lonKey = Object.keys(d).find(k => /lon/i.test(k)) || "Longitude";
      d.Latitude = +d[latKey];
      d.Longitude = +d[lonKey];
      d.Operator = (d["Operator"] || d["Operator Name"] || d["Operator/Owner"] || "").toString().trim();
      d.Status = (d["Status"] || "").toString().trim();
      d.Accessibility = (d["Accessibility"] || d["ADA"] || "").toString().trim();
    });

    const validData = restrooms.filter(d => !isNaN(d.Latitude) && !isNaN(d.Longitude));

    // conservative normalization
    validData.forEach(d => {
      const op = (d.Operator || "").toLowerCase();
      if (!op) d.Operator = "Other";
      else if (op.includes("park")) d.Operator = "Parks Department";
      else if (op.includes("library") || op.includes("bpl")) d.Operator = "Library";
      else if (op.includes("mta") || op.includes("transit") || op.includes("subway")) d.Operator = "Transit Hub";
      else if (op.includes("community") || op.includes("center")) d.Operator = "Community Center";
      else d.Operator = "Other";

      const s = (d.Status || "").toLowerCase();
      if (s.includes("operat") || s.includes("open") || s.includes("in service")) d.Status = "Operational";
      else if (s.includes("closed") || s.includes("construction")) d.Status = "Closed for Construction";
      else d.Status = "Not Operational";

      const a = (d.Accessibility || "").toLowerCase();
      if (a.includes("fully") || a.includes("yes") || a.includes("accessible")) d.Accessibility = "Fully Accessible";
      else if (a.includes("partial") || a.includes("partially")) d.Accessibility = "Partially Accessible";
      else d.Accessibility = "Not Accessible";
    });

    // colors
    const typeColors = {
      "Parks Department": "#1f77b4",
      "Library": "#ff7f0e",
      "Transit Hub": "#2ca02c",
      "Community Center": "#d62728",
      "Other": "#7f7f7f"
    };

    // Draw dots
    const dots = g.selectAll("circle.restroom")
      .data(validData)
      .enter()
      .append("circle")
      .attr("class", "restroom")
      .attr("cx", d => projection([d.Longitude, d.Latitude])[0])
      .attr("cy", d => projection([d.Longitude, d.Latitude])[1])
      .attr("r", 2.75)
      .attr("fill", d => typeColors[d.Operator] || "#7f7f7f")
      .attr("opacity", 0.95)
      .attr("data-operator", d => d.Operator)
      .attr("data-status", d => d.Status)
      .attr("data-access", d => d.Accessibility)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(120).style("opacity", 0.95);
        tooltip.html(`<strong>${d.Name}</strong><br>Type: ${d.Operator}<br>Status: ${d.Status}<br>Accessibility: ${d.Accessibility}`)
          .style("left", (event.pageX + 8) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(150).style("opacity", 0));

    // zoom/pan
    const zoom = d3.zoom().scaleExtent([1, 10]).on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    // Build the filter panel (hidden until Explore clicked)
    d3.select("#filter-panel").remove(); // ensure no duplicate
    const panel = d3.select("body").append("div").attr("id", "filter-panel");
    const filters = buildFilterPanel(panel, dots, typeColors);

    // Hook Explore button (assumes your HTML has #explore-button inside #map-description)
    d3.select("#explore-button").on("click", () => {
      // toggle panel visibility
      const isShown = panel.style("display") === "block";
      if (isShown) {
        panel.style("display", "none");
      } else {
        panel.style("display", "block");
      }
    });

    // Add Next button (to LES focused scene)
    d3.selectAll("#next-button").remove();
    d3.select("body").append("button")
      .attr("id", "next-button")
      .text("Next →")
      .on("click", () => {
        // hide description so it doesn't persist
        d3.select("#map-description")
          .transition()
          .duration(300)
          .style("opacity", 0)
          .on("end", () => d3.select("#map-description").style("display", "none"));

        // cleanup and show LES
        removeSceneElements();
        showLESScene();
      });

    // Also show a Back button only if desired (here we hide on first scene)
    d3.select("#back-button").style("display", "none");

  } catch (err) {
    console.error("🚨 Error in showRestroomMap():", err);
  }
}

// ------------------------------
// Scene 2 — LES / Chinatown Focus
// ------------------------------
async function showLESScene() {
  removeSceneElements(); // ensure clean

  const width = window.innerWidth;
  const height = window.innerHeight;

  // show a LES-specific description overlay (same style as your main description)
  d3.select("#les-desc-overlay").remove();
  d3.select("body").append("div")
    .attr("id", "les-desc-overlay")
    .style("position", "absolute")
    .style("top", "40px")
    .style("left", "60px")
    .style("width", "340px")
    .style("background", "transparent")
    .style("z-index", 60)
    .html(`
      <h2>Lower East Side / Chinatown</h2>
      <p>
        This area experiences <strong>massive daily foot traffic</strong> from both locals and tourists.
        It's one of the most visited areas in Manhattan but with <strong>few public restrooms</strong>.
        <br><br>
        A high number of visitors, restaurant workers, and a sizable homeless population
        make restroom accessibility here even more urgent.
      </p>
      <button id="les-explore-button" style="margin-top:8px;">Explore →</button>
    `);

  // Setup SVG focused on LES
  const svg = d3.select("body")
    .append("svg")
    .attr("id", "map-svg-les")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#ffffff");

  const g = svg.append("g");
  const projection = d3.geoMercator()
    .center([-73.995, 40.717])
    .scale(250000)
    .translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);
  const tooltip = d3.select("body").append("div").attr("class", "tooltip");

  try {
    const nycMap = await d3.json("data/nyc-boroughs.geojson");
    g.selectAll("path")
      .data(nycMap.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#FDFC54")
      .attr("stroke", "#F8D119")
      .attr("stroke-width", 1);

    const restrooms = await d3.csv("data/public-restrooms-data.csv");
    restrooms.forEach(d => {
      d.Name = d["Facility Name"] || d["Facility"] || "Unnamed";
      const latKey = Object.keys(d).find(k => /lat/i.test(k)) || "Latitude";
      const lonKey = Object.keys(d).find(k => /lon/i.test(k)) || "Longitude";
      d.Latitude = +d[latKey];
      d.Longitude = +d[lonKey];
      d.Operator = (d["Operator"] || "").toString().trim();
      d.Status = (d["Status"] || "").toString().trim();
      d.Accessibility = (d["Accessibility"] || d["ADA"] || "").toString().trim();
    });

    // Normalize similarly as Scene 1 (conservative)
    restrooms.forEach(d => {
      const op = (d.Operator || "").toLowerCase();
      if (!op) d.Operator = "Other";
      else if (op.includes("park")) d.Operator = "Parks Department";
      else if (op.includes("library") || op.includes("bpl")) d.Operator = "Library";
      else if (op.includes("mta") || op.includes("transit") || op.includes("subway")) d.Operator = "Transit Hub";
      else if (op.includes("community") || op.includes("center")) d.Operator = "Community Center";
      else d.Operator = "Other";

      const s = (d.Status || "").toLowerCase();
      if (s.includes("operat") || s.includes("open") || s.includes("in service")) d.Status = "Operational";
      else if (s.includes("closed") || s.includes("construction")) d.Status = "Closed for Construction";
      else d.Status = "Not Operational";

      const a = (d.Accessibility || "").toLowerCase();
      if (a.includes("fully") || a.includes("yes") || a.includes("accessible")) d.Accessibility = "Fully Accessible";
      else if (a.includes("partial") || a.includes("partially")) d.Accessibility = "Partially Accessible";
      else d.Accessibility = "Not Accessible";
    });

    // filter to LES bounding box (user confirmed)
    const lesPoints = restrooms.filter(d =>
      !isNaN(d.Latitude) && !isNaN(d.Longitude) &&
      d.Longitude >= -73.995 && d.Longitude <= -73.98 &&
      d.Latitude >= 40.710 && d.Latitude <= 40.725
    );

    const typeColors = {
      "Parks Department": "#1f77b4",
      "Library": "#ff7f0e",
      "Transit Hub": "#2ca02c",
      "Community Center": "#d62728",
      "Other": "#7f7f7f"
    };

    const dots = g.selectAll("circle.les")
      .data(lesPoints)
      .enter()
      .append("circle")
      .attr("class", "les-restroom")
      .attr("cx", d => projection([d.Longitude, d.Latitude])[0])
      .attr("cy", d => projection([d.Longitude, d.Latitude])[1])
      .attr("r", 5)
      .attr("fill", d => typeColors[d.Operator] || "#1789FC")
      .attr("opacity", 0.95)
      .attr("data-status", d => d.Status)
      .attr("data-access", d => d.Accessibility)
      .attr("data-operator", d => d.Operator)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(120).style("opacity", 0.95);
        tooltip.html(`<strong>${d.Name}</strong><br>${d.Operator}<br>${d.Status}<br>${d.Accessibility}`)
          .style("left", (event.pageX + 8) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(120).style("opacity", 0));

    // click anywhere -> nearest restroom
    svg.on("click", function(event) {
      const [x, y] = d3.pointer(event);
      const clicked = projection.invert([x, y]); // [lon, lat]
      if (!clicked) return;
      const [clickLon, clickLat] = clicked;

      let nearest = null;
      let minKm = Infinity;
      lesPoints.forEach(p => {
        const dkm = haversine(clickLat, clickLon, p.Latitude, p.Longitude);
        if (dkm < minKm) { minKm = dkm; nearest = p; }
      });

      if (nearest) {
        const [nx, ny] = projection([nearest.Longitude, nearest.Latitude]);
        g.selectAll(".click-mark").remove();
        g.append("line").attr("class", "click-mark")
          .attr("x1", x).attr("y1", y).attr("x2", nx).attr("y2", ny)
          .attr("stroke", "#ff4f4f").attr("stroke-width", 2).attr("stroke-dasharray", "6,4");
        g.append("circle").attr("class", "click-mark").attr("cx", x).attr("cy", y).attr("r", 6).attr("fill", "rgba(255,0,0,0.6)");
        const meters = Math.round(minKm * 1000);
        tooltip.transition().duration(120).style("opacity", 0.95);
        tooltip.html(`Nearest restroom: <strong>${nearest.Name}</strong><br>Distance ≈ ${meters} m`)
          .style("left", (event.pageX + 8) + "px")
          .style("top", (event.pageY - 28) + "px");
      }
    });

    // zoom/pan
    const zoom = d3.zoom().scaleExtent([1, 12]).on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    // Build filter panel for LES (re-uses same panel id, but cleaned)
    d3.select("#filter-panel").remove();
    const panel = d3.select("body").append("div").attr("id", "filter-panel");
    const filters = buildFilterPanel(panel, dots, typeColors);

    // Hook LES Explore button
    d3.select("#les-explore-button").on("click", () => {
      const isShown = panel.style("display") === "block";
      panel.style("display", isShown ? "none" : "block");
    });

    // Back + Next buttons
    d3.selectAll("#back-button").remove();
    d3.selectAll("#next-button").remove();

    d3.select("body").append("button")
      .attr("id", "back-button")
      .text("← Back")
      .on("click", () => {
        // remove LES overlays and go back to full map
        removeSceneElements();
        // show main description again
        d3.select("#map-description").style("display", "block").style("opacity", 1);
        showRestroomMap();
      });

    d3.select("body").append("button")
      .attr("id", "next-button")
      .text("Next →")
      .on("click", () => {
        removeSceneElements();
        showFootTrafficTrends();
      });

  } catch (err) {
    console.error("🚨 Error in showLESScene():", err);
  }
}

// ------------------------------
// Scene 3 — Foot traffic vs restrooms (placeholder)
// ------------------------------
async function showFootTrafficTrends() {
  removeSceneElements();

  // small placeholder layout styled like other scenes
  d3.select("body").append("div")
    .attr("id", "foot-traffic-placeholder")
    .style("position", "absolute")
    .style("top", "40px")
    .style("left", "60px")
    .style("width", "540px")
    .style("background", "transparent")
    .style("z-index", 60)
    .html(`
      <h2>Foot Traffic vs Public Restrooms</h2>
      <p>Choose datasets (DOT pedestrian counts, MTA turnstiles, Citi Bike trips, SafeGraph) to visualize foot traffic
         in LES/Chinatown and compare with restroom locations.</p>
    `);

  // Add Back button to return to LES
  d3.select("body").append("button")
    .attr("id", "back-button")
    .text("← Back")
    .on("click", () => {
      d3.select("#foot-traffic-placeholder").remove();
      d3.selectAll("#back-button").remove();
      showLESScene();
    });

  // Next could go to another scene; for now we omit it.
}
