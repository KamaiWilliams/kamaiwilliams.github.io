// ------------------------------
// Scene 1 — Full NYC Map
// ------------------------------

async function showRestroomMap() {
    // Remove old map elements but keep buttons
    d3.selectAll("#map-svg, #map-svg-les, #map-svg-les-nearest, .tooltip, #filter-panel, #les-desc-overlay, #chart-popup-1")
      .remove();
  
    const width = window.innerWidth;
    const height = window.innerHeight;
  
    // Reset description
    d3.select("#map-description")
      .html(`
        <h2>Public Restrooms Across NYC</h2>
        <p>
          Where are all the public restrooms in the city?
        In a place with over eight million people, finding a public restroom shouldn’t feel impossible. 
        A lot of them are hiding in plain sight! On this map, each dot represents a public bathroom recorded by NYC Open Data.
        This includes ones in parks, libraries, transit hubs, and community spaces maintained by the city.
          <br><br>
        At first glance, it might seem like there are plenty of public restrooms available.
        But when you <b>zoom in</b>, you’ll start to see how few and far between these points really are. 
        Explore a bit more, and you’ll notice that many of the restrooms shown here aren’t even in operation.
        </p>
        <button id="explore-button">Explore →</button>
      `)
      .style("display", "block")
      .style("opacity", 1)
      .classed("hidden", false);
  
    // SVG map
    const svg = d3.select("body")
      .append("svg")
      .attr("id", "map-svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "#FFFFFF");
  
    const g = svg.append("g");
    const projection = d3.geoMercator()
      .center([-74.006, 40.7128])
      .scale(120000)
      .translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
  
    try {
      // Load borough map
      const nycMap = await d3.json("data/nyc-boroughs.geojson");
      g.selectAll("path")
        .data(nycMap.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#FFFFFF")
        .attr("stroke", "#000000")
        .attr("stroke-width", 1);
  
      // Load restrooms CSV
      const restrooms = await d3.csv("data/public-restrooms-data.csv");
  
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
  
      // Normalize data
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
  
      const validData = restrooms.filter(d => !isNaN(d.Latitude) && !isNaN(d.Longitude));
  
      const typeColors = {
        "Parks Department": "#DD572F",
        "Library": "#EEAFB7",
        "Transit Hub": "#2ca02c",
        "Community Center": "#d62728",
        "Other": "#EC78B3"
      };
  
      // Draw restroom dots
      const dots = g.selectAll("circle.restroom")
        .data(validData)
        .enter()
        .append("circle")
        .attr("class", "restroom")
        .attr("cx", d => projection([d.Longitude, d.Latitude])[0])
        .attr("cy", d => projection([d.Longitude, d.Latitude])[1])
        .attr("r", 1.5)
        .attr("fill", d => typeColors[d.Operator] || "#7f7f7f")
        .attr("opacity", 0.95)
        .attr("stroke", "#FAAF43")
        .attr("stroke-width", 0.5)
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(120).style("opacity", 0.95);
          tooltip.html(`<strong>${d.Name}</strong><br>Type: ${d.Operator}<br>Status: ${d.Status}<br>Accessibility: ${d.Accessibility}`)
            .style("left", (event.pageX + 8) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(150).style("opacity", 0));
  
      // Filter panel
      d3.select("#filter-panel").remove();
      const panel = d3.select("body").append("div").attr("id", "filter-panel");
      buildFilterPanel(panel, dots, typeColors);
  
      d3.select("#explore-button").on("click", () => {
        const isShown = panel.classed("show");
        panel.classed("show", !isShown);
      });
  
      // --- CHART POPUP SETUP ---
      const chartBtn = d3.select("body")
        .append("button")
        .attr("id", "chart-button")
        .text("View Data Insights →");
  
      chartBtn.on("click", () => showCharts(validData));
  
      // Create popup container
      d3.select("body")
        .append("div")
        .attr("id", "chart-popup-1")
        .style("display", "none")
        .html(`
          <div id="chart-content-1">
            <button id="close-chart">✕</button>
            <h2>NYC Public Restroom Insights</h2>
            <div id="chart-type" class="chart"></div>
            <div id="chart-accessibility" class="chart"></div>
            <div id="chart-status" class="chart"></div>
          </div>
        `);
  
      d3.select("body").on("click", (event) => {
        if (event.target.id === "close-chart") {
          d3.select("#chart-popup-1").style("display", "none");
        }
      });
  
      const zoom = d3.zoom().scaleExtent([1, 10]).on("zoom", (event) => g.attr("transform", event.transform));
      svg.call(zoom);
    } catch (err) {
      console.error("Error in showRestroomMap:", err);
    }
  }
  
  // --- FUNCTION TO SHOW CHARTS (ANIMATED + CUSTOM COLORS + LABELS) ---
function showCharts(data) {
    const popup = d3.select("#chart-popup-1");
    popup.style("display", "flex");
  
    d3.selectAll(".chart svg").remove();
    const w = 300, h = 250, margin = 40;
  
    // 🎨 Editable chart colors
    const chartColors = {
      typeBars: "#FAAF43", // orange
      statusBars: "#4F77B0", // blue
      accessibility: {
        "Fully Accessible": "#4CAF50",
        "Partially Accessible": "#FFC107",
        "Not Accessible": "#E53935"
      }
    };
  
    // 1️⃣ Animated Bar Chart — Restrooms by Type
    const typeCounts = d3.rollup(data, v => v.length, d => d.Operator);
    const typeData = Array.from(typeCounts, ([key, value]) => ({ key, value }));
  
    const x1 = d3.scaleBand().domain(typeData.map(d => d.key)).range([margin, w - margin]).padding(0.2);
    const y1 = d3.scaleLinear().domain([0, d3.max(typeData, d => d.value)]).nice().range([h - margin, margin]);
  
    const svgType = d3.select("#chart-type").append("svg").attr("width", w).attr("height", h);
  
    svgType.selectAll("rect")
      .data(typeData)
      .enter()
      .append("rect")
      .attr("x", d => x1(d.key))
      .attr("y", h - margin)
      .attr("width", x1.bandwidth())
      .attr("height", 0)
      .attr("fill", chartColors.typeBars)
      .transition()
      .duration(1200)
      .ease(d3.easeCubicOut)
      .attr("y", d => y1(d.value))
      .attr("height", d => h - margin - y1(d.value));
  
    svgType.append("g").attr("transform", `translate(0,${h - margin})`).call(d3.axisBottom(x1));
    svgType.append("g").attr("transform", `translate(${margin},0)`).call(d3.axisLeft(y1));
    svgType.append("text").attr("x", w / 2).attr("y", 20).attr("text-anchor", "middle").text("Restrooms by Type");
  
    // 2️⃣ Animated Pie Chart — Accessibility (with labels + counts)
    const accessCounts = d3.rollup(data, v => v.length, d => d.Accessibility);
    const accessData = Array.from(accessCounts, ([key, value]) => ({ key, value }));
  
    const radius = 80;
    const svgAccess = d3.select("#chart-accessibility")
      .append("svg").attr("width", w).attr("height", h)
      .append("g").attr("transform", `translate(${w / 2},${h / 2})`);
  
    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
  
    svgAccess.selectAll("path")
      .data(pie(accessData))
      .enter()
      .append("path")
      .attr("fill", d => chartColors.accessibility[d.data.key] || "#ccc")
      .attr("d", d3.arc().innerRadius(0).outerRadius(0))
      .transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attrTween("d", function(d) {
        const i = d3.interpolate(
          { startAngle: d.startAngle, endAngle: d.startAngle },
          d
        );
        return function(t) {
          return arc(i(t));
        };
      });
  
    // ✳️ Add category + value labels
    svgAccess.selectAll("text")
      .data(pie(accessData))
      .enter()
      .append("text")
      .text(d => `${d.data.key} (${d.data.value})`)
      .attr("transform", d => {
        const pos = arc.centroid(d);
        const offset = 30; // move slightly outward
        const angle = (d.startAngle + d.endAngle) / 2.;
        const x = Math.cos(angle - Math.PI / 2) * (radius + offset);
        const y = Math.sin(angle - Math.PI / 2) * (radius + offset);
        return `translate(${x},${y})`;
      })
      .style("font-size", "11px")
      .style("text-anchor", "middle")
      .style("opacity", 0)
      .transition()
      .delay(1500)
      .duration(600)
      .style("opacity", 1);
  
    // 3️⃣ Animated Status Chart — Restrooms by Status
    const statusCounts = d3.rollup(data, v => v.length, d => d.Status);
    const statusData = Array.from(statusCounts, ([key, value]) => ({ key, value }));
  
    const x2 = d3.scaleBand().domain(statusData.map(d => d.key)).range([margin, w - margin]).padding(0.2);
    const y2 = d3.scaleLinear().domain([0, d3.max(statusData, d => d.value)]).nice().range([h - margin, margin]);
  
    const svgStatus = d3.select("#chart-status").append("svg").attr("width", w).attr("height", h);
  
    svgStatus.selectAll("rect")
      .data(statusData)
      .enter()
      .append("rect")
      .attr("x", d => x2(d.key))
      .attr("y", h - margin)
      .attr("width", x2.bandwidth())
      .attr("height", 0)
      .attr("fill", chartColors.statusBars)
      .transition()
      .duration(1200)
      .ease(d3.easeCubicOut)
      .attr("y", d => y2(d.value))
      .attr("height", d => h - margin - y2(d.value));
  
    svgStatus.append("g").attr("transform", `translate(0,${h - margin})`).call(d3.axisBottom(x2));
    svgStatus.append("g").attr("transform", `translate(${margin},0)`).call(d3.axisLeft(y2));
    svgStatus.append("text").attr("x", w / 2).attr("y", 20).attr("text-anchor", "middle").text("Restrooms by Status");
  }
  
  
  // --- DOM Ready ---
  document.addEventListener("DOMContentLoaded", () => {
    showRestroomMap();
    document.getElementById("back-button").onclick = () => window.location.href = "index.html";
    document.getElementById("next-button").onclick = () => window.location.href = "scene2.html";
  });
  