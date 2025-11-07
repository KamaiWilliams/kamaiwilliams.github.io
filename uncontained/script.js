// ------------------------------
// Scene 1 — Title → Full NYC Map
// ------------------------------
d3.select("#start").on("click", () => {
  d3.select("#title-screen")
    .transition()
    .duration(800)
    .style("opacity", 0)
    .remove();

  showRestroomMap();
});

async function showRestroomMap() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // make sure the map description is visible again for this scene
  d3.select("#map-description")
    .style("display", "block")
    .style("opacity", 1);

  const svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#FDFC54");

  const g = svg.append("g"); // zoomable group

  const projection = d3.geoMercator()
    .center([-74.006, 40.7128]) // NYC center
    .scale(120000)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);
  const tooltip = d3.select("body").append("div").attr("class", "tooltip");

  try {
    // --- Load base map (NYC borough outlines) ---
    const nycMap = await d3.json("data/nyc-boroughs.geojson");

    g.selectAll("path")
      .data(nycMap.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#FDFC54")
      .attr("stroke", "#000000")
      .attr("stroke-width", .5);

    // --- Load restroom data ---
    const restrooms = await d3.csv("data/public-restrooms-data.csv");
    restrooms.forEach(d => {
      d.Name = d["Facility Name"] || "Unnamed";
      d.Latitude = +d["Latitude"];
      d.Longitude = +d["Longitude"];
      d.Operator = d["Operator"];
      d.Status = d["Status"];
      d.Accessibility = d["Accessibility"];
    });

    const validData = restrooms.filter(d => !isNaN(d.Latitude) && !isNaN(d.Longitude));

    g.selectAll("circle")
      .data(validData)
      .enter()
      .append("circle")
      .attr("cx", d => projection([d.Longitude, d.Latitude])[0])
      .attr("cy", d => projection([d.Longitude, d.Latitude])[1])
      .attr("r", 1.250)
      .attr("fill", "#000000")
      .attr("opacity", 1)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`
          <strong>${d.Name}</strong><br>
          ${d.Operator || ""}<br>
          Status: ${d.Status || "Unknown"}<br>
          Accessibility: ${d.Accessibility || "Unknown"}
        `)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

    // --- Enable Zoom and Pan ---
    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);

    // --- Add Next button ---
    d3.select("body").append("button")
      .attr("id", "next-button")
      .text("Next →")
      .on("click", () => {
        // Fade out map description, then hide
        d3.select("#map-description")
          .transition()
          .duration(500)
          .style("opacity", 0)
          .on("end", () => d3.select("#map-description").style("display", "none"));

        // move to next scene
        showHomelessnessTrends();
      });

  } catch (err) {
    console.error("🚨 Error loading data:", err);
  }
}


// ----------------------------------------
// Scene 2 — Homelessness vs Public Restrooms
// ----------------------------------------
async function showHomelessnessTrends() {
  d3.selectAll("svg, .tooltip, #next-button").remove();

  const width = window.innerWidth;
  const height = window.innerHeight;

  const svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 60)
    .attr("text-anchor", "middle")
    .attr("font-size", "28px")
    .attr("font-weight", "bold")
    .text("The Numbers Don’t Add Up");

  try {
    const dhs = await d3.csv("data/dhs-daily-reports-data.csv");

    dhs.forEach(d => {
      d.Date = new Date(d["Date of Census"]);
      d.TotalAdults = +d["Total Adults in Shelter"];
    });

    const monthlyData = d3.rollups(
      dhs,
      v => d3.mean(v, d => d.TotalAdults),
      d => d.Date.getFullYear() + "-" + (d.Date.getMonth() + 1)
    ).map(([month, avg]) => {
      const [year, m] = month.split("-");
      return { date: new Date(year, m - 1), value: avg };
    });

    const x = d3.scaleTime()
      .domain(d3.extent(monthlyData, d => d.date))
      .range([100, width - 100]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(monthlyData, d => d.value) * 1.1])
      .range([height - 100, 150]);

    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(monthlyData)
      .attr("fill", "none")
      .attr("stroke", "#ff4f4f")
      .attr("stroke-width", 3)
      .attr("d", line);

    const restroomCount = 1500;
    svg.append("line")
      .attr("x1", 100)
      .attr("x2", width - 100)
      .attr("y1", y(restroomCount))
      .attr("y2", y(restroomCount))
      .attr("stroke", "#1789FC")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");

    svg.append("g")
      .attr("transform", `translate(0, ${height - 100})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b %Y")));

    svg.append("g")
      .attr("transform", `translate(100, 0)`)
      .call(d3.axisLeft(y));

    svg.append("text")
      .attr("x", 110)
      .attr("y", y(restroomCount) - 10)
      .attr("fill", "#1789FC")
      .text("≈ 1,500 Public Restrooms in NYC (unchanged)");

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 40)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("fill", "#666")
      .text("Monthly average of adults in NYC shelters (2021–2025)");

    // Add back + next
    d3.select("body").append("button")
      .attr("id", "back-button")
      .text("← Back")
      .on("click", () => {
        d3.selectAll("svg, #back-button, #next-button").remove();
        showRestroomMap();
      });

    d3.select("body").append("button")
      .attr("id", "next-button")
      .text("Next →")
      .on("click", () => showLESRestrooms());

  } catch (err) {
    console.error("🚨 Error loading DHS data:", err);
  }
}


// ------------------------------------------
// Scene 3 — Zoom in on LES + distance feature
// ------------------------------------------
async function showLESRestrooms() {
  d3.selectAll("svg, .tooltip, #next-button, #back-button").remove();

  const width = window.innerWidth;
  const height = window.innerHeight;

  const svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#55FCFC");

  const g = svg.append("g");

  // Focus projection on Lower East Side / Chinatown
  const projection = d3.geoMercator()
    .center([-73.992, 40.715]) // LES/Chinatown center
    .scale(250000)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);
  const tooltip = d3.select("body").append("div").attr("class", "tooltip");

  try {
    // --- NYC outline again for context ---
    const nycMap = await d3.json("data/nyc-boroughs.geojson");
    g.selectAll("path")
      .data(nycMap.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#FDFC54")
      .attr("stroke", "#F8D119")
      .attr("stroke-width", 1.5);

    // --- Restrooms ---
    const restrooms = await d3.csv("data/public-restrooms-data.csv");
    restrooms.forEach(d => {
      d.Latitude = +d["Latitude"];
      d.Longitude = +d["Longitude"];
      d.Name = d["Facility Name"];
      d.Operator = d["Operator"];
    });

    // ✅ Filter by LES / Chinatown boundaries (in geographic coords)
    // Rough bounding box (you can adjust slightly if needed)
    const lesRestrooms = restrooms.filter(d =>
      d.Longitude > -74.01 &&  // west
      d.Longitude < -73.975 && // east
      d.Latitude > 40.707 &&   // south
      d.Latitude < 40.725      // north
    );

    const restroomPoints = g.selectAll("circle")
      .data(lesRestrooms)
      .enter()
      .append("circle")
      .attr("cx", d => projection([d.Longitude, d.Latitude])[0])
      .attr("cy", d => projection([d.Longitude, d.Latitude])[1])
      .attr("r", 4)
      .attr("fill", "#1789FC")
      .attr("opacity", 0.85)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`<strong>${d.Name}</strong><br>${d.Operator || ""}`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

    // --- Click anywhere → find nearest restroom ---
    svg.on("click", function (event) {
      const [x, y] = d3.pointer(event);
      const [lon, lat] = projection.invert([x, y]);

      let nearest = null;
      let minDist = Infinity;

      lesRestrooms.forEach(d => {
        const dx = lon - d.Longitude;
        const dy = lat - d.Latitude;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearest = d;
        }
      });

      if (nearest) {
        const [nx, ny] = projection([nearest.Longitude, nearest.Latitude]);

        g.selectAll(".temp-line").remove();

        g.append("line")
          .attr("class", "temp-line")
          .attr("x1", x)
          .attr("y1", y)
          .attr("x2", nx)
          .attr("y2", ny)
          .attr("stroke", "#ff4f4f")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4,4");

        const distance = (minDist * 111139).toFixed(0); // meters
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`Nearest restroom: ${nearest.Name}<br>Distance: ${distance} m`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      }
    });

    // --- Zoom + pan ---
    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);

    // --- Back button ---
    d3.select("body").append("button")
      .attr("id", "back-button")
      .text("← Back")
      .on("click", () => {
        d3.selectAll("svg, .tooltip, #back-button").remove();
        showHomelessnessTrends();
      });

  } catch (err) {
    console.error("🚨 Error loading LES map:", err);
  }
}
