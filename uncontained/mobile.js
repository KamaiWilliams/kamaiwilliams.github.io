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
  const projection = d3.geoMercator()
      .center([-74.006, 40.7128])
      .scale(130000)
      .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

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
.attr("cx", d => projection([d.Longitude, d.Latitude])[0])
.attr("cy", d => projection([d.Longitude, d.Latitude])[1])
.attr("r", 2.5)
.attr("fill", d => typeColors[d.Operator])
.style("opacity", 1)
.on("click touchstart", (event, d) => {
    event.stopPropagation();

    showInfoPanel(d);
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

document.getElementById("info-close").addEventListener("click", () => {
  document.getElementById("info-panel").classList.remove("show");
});

      // --------- ZOOM + TOUCH DRAG ----------
      const zoom = d3.zoom()
          .scaleExtent([1, 9])
          .on("zoom", event => g.attr("transform", event.transform));

      svg.call(zoom);

  } catch (err) {
      console.error("Mobile map error:", err);
  }
}
