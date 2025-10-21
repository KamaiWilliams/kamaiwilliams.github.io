// Step 1: Floating title screen
d3.select("body").append("div")
  .attr("id", "title-screen")
  .html("<h1>Uncontained</h1>")
  .on("click", () => {
    d3.select("#title-screen")
      .transition()
      .duration(800)
      .style("opacity", 0)
      .remove();
    showDescription();
  });

// Step 2: Project description
function showDescription() {
  const desc = d3.select("body").append("div")
    .attr("id", "description")
    .html(`
      <h2>The Sanitation Cycle of NYC</h2>
      <p>Exploring how infrastructure neglect shapes urban ecosystems.<br>
      Focus: Lower Manhattan.</p>
      <button id="enter-map">View Map</button>
    `);

  d3.select("#enter-map").on("click", () => {
    desc.transition().duration(800).style("opacity", 0).remove();
    showNYCMap();
  });
}

// Step 3: Main map visualization
async function showNYCMap() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const svg = d3.select("body")
    .append("svg")
    .attr("id", "map-svg")
    .attr("width", width)
    .attr("height", height);

  const projection = d3.geoMercator()
    .center([-74.006, 40.72]) // Lower Manhattan
    .scale(130000)
    .translate([width / 2, height / 2]);

  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  try {
    const [restrooms, conditions] = await Promise.all([
      d3.csv("data/public-restrooms-data.csv"),
      d3.csv("data/public-restrooms-conditions-data.csv")
    ]);

    restrooms.forEach(d => {
      d.Latitude = +d.Latitude;
      d.Longitude = +d.Longitude;
    });

    restrooms.forEach((r, i) => {
      const condition = conditions[i % conditions.length];
      r.ConditionType = condition.Type || "N/A";
      r.ConditionProblem = condition.Problem || "Unknown";
      r.ConditionExtent = condition.Extent || "";
      r.ConditionPriority = condition.Priority || "0";
    });

    // --- Create a group for zoom ---
    const g = svg.append("g");

    // Plot restroom points
    const circles = g.selectAll("circle")
      .data(restrooms)
      .enter()
      .append("circle")
      .attr("cx", d => projection([d.Longitude, d.Latitude])[0])
      .attr("cy", d => projection([d.Longitude, d.Latitude])[1])
      .attr("r", 3)
      .attr("fill", "#1789FC")
      .attr("opacity", 0.8)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`<strong>${d["Facility Name"]}</strong>`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0))
      .on("click", (event, d) => showInfo(d, event));

    // Info box function
    function showInfo(d, event) {
      // Zoom in on clicked point
      const [x, y] = projection([d.Longitude, d.Latitude]);
      g.transition()
        .duration(800)
        .attr("transform", `translate(${width / 2 - x * 3},${height / 2 - y * 3}) scale(3)`);

      // Remove any existing box
      d3.select("#info-box").remove();

      // Create info box
      const box = d3.select("body")
        .append("div")
        .attr("id", "info-box")
        .html(`
          <h3>${d["Facility Name"]}</h3>
          <p><b>Type:</b> ${d["Location Type"]}<br/>
          <b>Condition:</b> ${d.ConditionType}<br/>
          <b>Problem:</b> ${d.ConditionProblem}<br/>
          <b>Extent:</b> ${d.ConditionExtent}<br/>
          <b>Priority:</b> ${d.ConditionPriority}</p>
          <button id="close-info">Close</button>
        `);

      // Close button resets zoom and hides box
      d3.select("#close-info").on("click", () => {
        g.transition().duration(800).attr("transform", "translate(0,0) scale(1)");
        box.transition().duration(300).style("opacity", 0).remove();
      });
    }

  } catch (err) {
    console.error("🚨 Error loading data:", err);
  }
}
