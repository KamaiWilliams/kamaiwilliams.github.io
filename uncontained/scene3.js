// ------------------------------
// Scene 3 — Nearest Restroom Activity
// ------------------------------

document.addEventListener("DOMContentLoaded", () => {
    showScene3();
});

async function showScene3() {
    if (typeof setCurrentScene === 'function') setCurrentScene('scene3');

    const width = window.innerWidth;
    const height = window.innerHeight;

    // --- Container ---
    const container = d3.select("#scene3-container");
    container.html(""); // clear old content

    // --- Description box ---
    container.append("div")
        .attr("id", "map-description")
        .html(`
            <h2>FIND THE <br>NEAREST RESTROOM</h2>
            <p><b>Drag the white dot</b> to a spot on the map <br>to see the distance to the nearest public restroom.</p>
        `);

    // --- SVG ---
    const svg = container.append("svg")
        .attr("id", "map-svg-scene3")
        .attr("width", width)
        .attr("height", height)
        .style("background", "#FC7D01")
        .style("position", "absolute")
        .style("top", "0")
        .style("left", "0")
        .style("z-index", "1");

    const g = svg.append("g");
    const tooltip = container.append("div").attr("class", "tooltip");

    // --- Projection (match Scene 2) ---
    const projection = d3.geoMercator()
        .center([-73.995, 40.717])
        .scale(250000)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // --- Zoom ---
    const zoom = d3.zoom().scaleExtent([1, 12]).on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    // --- Load map and restroom data ---
    try {
        const [geoData, restroomDataRaw] = await Promise.all([
            d3.json("data/nyc_streets_blocks.geojson"),
            d3.csv("data/public-restrooms-data.csv")
        ]);

        // Draw map blocks
        g.selectAll(".block-outline")
            .data(geoData.features)
            .enter()
            .append("path")
            .attr("class", "block-outline")
            .attr("d", path)
            .attr("fill", "#806763")
            .attr("stroke", "#FC7D01")
            .attr("stroke-width", 1);

        // Prepare restroom data
        const restroomData = restroomDataRaw.map(d => {
            const latKey = Object.keys(d).find(k => /lat/i.test(k)) || "Latitude";
            const lonKey = Object.keys(d).find(k => /lon/i.test(k)) || "Longitude";
            return {
                Name: d["Facility Name"] || d["Facility"] || "Unnamed",
                Latitude: +d[latKey],
                Longitude: +d[lonKey],
                Operator: (d["Operator"] || "").trim()
            };
        });

        // Normalize operator colors
        // --- Draw Restrooms ---
        const typeColors = {
            "Parks Department": "#06d6a0",
        "Library": "#ffd60a",
        "Transit Hub": "#2ca02c",
        "Community Center": "#d62728",
        "Other": "#FF2269"
        };


        restroomData.forEach(d => {
            const op = (d.Operator || "").toLowerCase();
            if (!op) d.Operator = "Other";
            else if (op.includes("park")) d.Operator = "Parks Department";
            else if (op.includes("library")) d.Operator = "Library";
            else if (op.includes("mta") || op.includes("transit")) d.Operator = "Transit Hub";
            else if (op.includes("community") || op.includes("center")) d.Operator = "Community Center";
            else d.Operator = "Other";
        });

        // --- Filter LES / Chinatown / SoHo restrooms ---
const lesBounds = [[-74.004, 40.710], [-73.98, 40.730]]; // expanded to include SoHo
const lesRestrooms = restroomData
  .map(d => ({
      Longitude: d.Longitude,
      Latitude: d.Latitude,
      ...d
  }))
  .filter(d =>
      d.Longitude >= lesBounds[0][0] &&
      d.Longitude <= lesBounds[1][0] &&
      d.Latitude >= lesBounds[0][1] &&
      d.Latitude <= lesBounds[1][1]
  );


        // --- Draw restroom dots ---
        g.selectAll("circle.restroom")
            .data(lesRestrooms)
            .enter()
            .append("circle")
            .attr("class", "restroom")
            .attr("cx", d => projection([d.Longitude, d.Latitude])[0])
            .attr("cy", d => projection([d.Longitude, d.Latitude])[1])
            .attr("r", 2.5)
            .attr("fill", d => typeColors[d.Operator] || "#1789FC")
            .attr("stroke", "transparent")
            .attr("stroke-width", 0)
            .on("mouseover", (event, d) => {
                tooltip.transition().duration(120).style("opacity", 1);
                tooltip.html(`<strong>${d.Name}</strong><br>${d.Operator}`)
                       .style("left", (event.pageX + 8) + "px")
                       .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => tooltip.transition().duration(120).style("opacity", 0));

        // --- Zoom to LES bounds and lock ---
        const topLeft = projection([lesBounds[0][0], lesBounds[1][1]]);
        const bottomRight = projection([lesBounds[1][0], lesBounds[0][1]]);
        const dx = bottomRight[0] - topLeft[0];
        const dy = bottomRight[1] - topLeft[1];
        const cx = (topLeft[0] + bottomRight[0]) / 2;
        const cy = (topLeft[1] + bottomRight[1]) / 2;
        const scale = Math.min(width / dx, height / dy) * 0.65;
            const xOffset = 150; // pixels — tweak this number for how far right you want it
            const translate = [width / 2 - scale * cx + xOffset, height / 2 - scale * cy];
            g.transition().duration(800).attr("transform", `translate(${translate}) scale(${scale})`);


        g.transition().duration(800)
            .attr("transform", `translate(${translate}) scale(${scale})`)
            .on("end", () => {
                // lock zoom after animation
                svg.on(".zoom", null);
            });

        // --- Draggable marker setup ---
        let dragBehavior = d3.drag().on("drag", function(event) {
            const x = Math.max(0, Math.min(width, event.x));
            const y = Math.max(0, Math.min(height, event.y));
            dragMarker.attr("cx", x).attr("cy", y);
            updateNearestRestroom(x, y);
        });

        // --- Initialize red marker near a real restroom (first in LES list) ---
        const startRestroom = lesRestrooms[0] || {Longitude: -73.99, Latitude: 40.717};
        const startCoords = projection([startRestroom.Longitude, startRestroom.Latitude]);

        dragMarker = g.append("circle")
            .attr("class", "marker")
            .attr("r", 3.5)
            .attr("fill", "#CAE4E3")
            .attr("cx", startCoords[0])
            .attr("cy", startCoords[1])
            .call(dragBehavior);

        dragLine = g.append("line")
            .attr("stroke", "#CAE4E3")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "6,4");

        // show initial line and tooltip
        updateNearestRestroom(startCoords[0], startCoords[1]);

        // --- Haversine function ---
        function haversine(lat1, lon1, lat2, lon2) {
            const R = 6371; // km
            const toRad = deg => deg * Math.PI / 180;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat/2)**2 +
                      Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        }

        function updateNearestRestroom(x, y) {
            if (!lesRestrooms.length) return;
        
            const [lon, lat] = projection.invert([x, y]);
            let nearest = null;
            let minDist = Infinity;
        
            lesRestrooms.forEach(d => {
                const dist = haversine(lat, lon, d.Latitude, d.Longitude);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = d;
                }
            });
        
            if (!nearest) return;
        
            const [nx, ny] = projection([nearest.Longitude, nearest.Latitude]);
        
            dragLine.attr("x1", x)
                    .attr("y1", y)
                    .attr("x2", nx)
                    .attr("y2", ny);
        
            // --- Convert distance to miles ---
            const miles = minDist * 0.621371; // km → miles
        
            // --- Walking time in minutes, NYC realistic pace ~2.5 mph ---
            const walkTime = Math.round(miles / (1.45 / 60)); // 2.5 mph = 2.5 miles/60 min
        
            const milesFormatted = miles.toFixed(2);
        
            tooltip.transition().duration(150).style("opacity", 1);
            tooltip.html(
                `Nearest restroom: <strong>${nearest.Name}</strong><br>` +
                `${milesFormatted} miles (~${walkTime} min walk)`
            )
            .style("left", `${Math.min(x + 30, width - 180)}px`)
            .style("top", `${Math.max(10, y - 50)}px`);
        }
        
        

        // --- Navigation buttons ---
        const navButtons = d3.select("body").append("div")
            .attr("id", "scene3-nav")
            .style("position", "absolute")
            .style("width", "100%")
            .style("bottom", "0px")
            .style("display", "flex")
            .style("justify-content", "space-between")
            .style("padding", "0 0px")
            .style("z-index", 9999);

            navButtons.append("button")
            .attr("id", "back-button")
            .style("display", "block")   // ✅ FORCE VISIBILITY
            .text("←")
            .on("click", () => window.location.href = "scene2.html");
          
          navButtons.append("button")
            .attr("id", "next-button")
            .style("display", "block")   // ✅ FORCE VISIBILITY
            .text("→")
            .on("click", () => window.location.href = "info.html");
          

    } catch (err) {
        console.error("🚨 Error in showLESScene():", err);
    }
}
