// ------------------------------
// Scene 2 — LES / Chinatown Focus
// ------------------------------

document.addEventListener("DOMContentLoaded", () => {
    showLESScene();
});

async function showLESScene() {
    if (typeof setCurrentScene === 'function') setCurrentScene('scene2');

    removeSceneElements();

    const width = window.innerWidth;
    const height = window.innerHeight;

    const container = d3.select("#scene2-container");
    container.html(""); // clear old content

    // --- Description box ---
    container.append("div")
        .attr("id", "map-description")
        .html(`
            <h2>LOWER MANHATTAN'S SHOPPING AREAS</h2>
            <p>
              Welcome to one of the busiest parts of the city! <br>Lower Manhattan’s shopping corridors.
              <br>Every day, thousands of locals, workers, and tourists move through these blocks, creating constant foot traffic.
              Despite all that activity, public restrooms here are surprisingly scarce. 
              For restaurant workers, delivery couriers, and members of the unhoused community, the lack of access
              can turn an everyday need into a real struggle.
            </p>
            <button id="foot-traffic-toggle">SHOW FOOT TRAFFIC →</button>
        `);

    // --- SVG Map ---
    const svg = container.append("svg")
        .attr("id", "map-svg-les")
        .attr("width", width)
        .attr("height", height)
        .style("background", "#FC7D01")
        .style("position", "absolute")
        .style("top", "0")
        .style("left", "0")
        .style("z-index", "1");

    const g = svg.append("g");
    const projection = d3.geoMercator()
        .center([-73.995, 40.717])
        .scale(250000)
        .translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    let zoomLocked = false;
    const zoom = d3.zoom().scaleExtent([1, 12]).on("zoom", (event) => {
        if (!zoomLocked) g.attr("transform", event.transform);
    });
    svg.call(zoom);

    try {
        // --- Base outlines ---
        const base = await d3.json("data/nyc_streets_blocks.geojson");
        g.selectAll(".block-outline")
            .data(base.features)
            .enter()
            .append("path")
            .attr("class", "block-outline")
            .attr("d", path)
            .attr("fill", "#806763")
            .attr("stroke", "#FC7D01")
            .attr("stroke-width", 1);

        // --- Restrooms data ---
        const restrooms = await d3.csv("data/public-restrooms-data.csv");
        restrooms.forEach(d => {
            d.Name = d["Facility Name"] || d["Facility"] || "Unnamed";
            const latKey = Object.keys(d).find(k => /lat/i.test(k)) || "Latitude";
            const lonKey = Object.keys(d).find(k => /lon/i.test(k)) || "Longitude";
            d.Latitude = +d[latKey];
            d.Longitude = +d[lonKey];
            d.Operator = (d["Operator"] || "").trim();
            d.Status = (d["Status"] || "").trim();
            d.Accessibility = (d["Accessibility"] || d["ADA"] || "").trim();
        });

        // Normalize fields
        restrooms.forEach(d => {
            const op = (d.Operator || "").toLowerCase();
            if (!op) d.Operator = "Other";
            else if (op.includes("park")) d.Operator = "Parks Department";
            else if (op.includes("library")) d.Operator = "Library";
            else if (op.includes("mta") || op.includes("transit")) d.Operator = "Transit Hub";
            else if (op.includes("community") || op.includes("center")) d.Operator = "Community Center";
            else d.Operator = "Other";

            const s = (d.Status || "").toLowerCase();
            if (s.includes("operat") || s.includes("open")) d.Status = "Operational";
            else if (s.includes("closed") || s.includes("construction")) d.Status = "Closed for Construction";
            else d.Status = "Not Operational";

            const a = (d.Accessibility || "").toLowerCase();
            if (a.includes("fully") || a.includes("yes")) d.Accessibility = "Fully Accessible";
            else if (a.includes("partial")) d.Accessibility = "Partially Accessible";
            else d.Accessibility = "Not Accessible";
        });

        // Filter to LES + SoHo bounding box
        const lesPoints = restrooms.filter(d =>
            !isNaN(d.Latitude) && !isNaN(d.Longitude) &&
            d.Longitude >= -74.004 && d.Longitude <= -73.98 &&
            d.Latitude >= 40.710 && d.Latitude <= 40.730
        );

        // --- Draw Restrooms ---
        const typeColors = {
            "Parks Department": "#06d6a0",
        "Library": "#ffd60a",
        "Transit Hub": "#2ca02c",
        "Community Center": "#d62728",
        "Other": "#FF2269"
        };

        g.selectAll("circle.les")
            .data(lesPoints)
            .enter()
            .append("circle")
            .attr("class", "les-restroom")
            .attr("cx", d => projection([d.Longitude, d.Latitude])[0])
            .attr("cy", d => projection([d.Longitude, d.Latitude])[1])
            .attr("r", 2.5)
            .attr("fill", d => typeColors[d.Operator] || "#1789FC")
            .attr("opacity", 0.95)
            .attr("stroke", "transparent")
            .attr("stroke-width", 1);

        // --- Foot traffic toggle ---
        let footTrafficVisible = false;
        d3.select("#foot-traffic-toggle").on("click", async function () {
            const btn = d3.select(this);
            const container = d3.select("#map-description");
            container.select("#foot-traffic-info").remove();

            if (footTrafficVisible) {
                g.selectAll(".ped-demand").remove();
                d3.select("#chart-popup").remove();
                btn.text("SHOW FOOT TRAFFIC →");
                zoomLocked = false;
                svg.call(zoom);
                footTrafficVisible = false;
                return;
            }

            const pedCounts = await d3.csv("data/bi-annual-pedestrian-counts.csv");
            const lesFootTraffic = pedCounts.map(d => {
                const match = d["the_geom"]?.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
                if (!match) return null;
                const lon = +match[1];
                const lat = +match[2];
                if (lon < -73.995 || lon > -73.98 || lat < 40.710 || lat > 40.725) return null;
                return { Longitude: lon, Latitude: lat, ...d };
            }).filter(Boolean);

            zoomLocked = true;
            svg.on(".zoom", null);

            // Zoom to LES bounds
            const lesBounds = [[-73.995, 40.710], [-73.98, 40.725]];
            const topLeft = projection([lesBounds[0][0], lesBounds[1][1]]);
            const bottomRight = projection([lesBounds[1][0], lesBounds[0][1]]);
            const dx = bottomRight[0] - topLeft[0];
            const dy = bottomRight[1] - topLeft[1];
            const cx = (topLeft[0] + bottomRight[0]) / 2;
            const cy = (topLeft[1] + bottomRight[1]) / 2;
            const scale = Math.min(width / dx, height / dy) * 0.4;
            const xOffset = 290; // pixels — tweak this number for how far right you want it
            const translate = [width / 2 - scale * cx + xOffset, height / 2 - scale * cy];
            g.transition().duration(800).attr("transform", `translate(${translate}) scale(${scale})`);

            g.selectAll(".ped-demand")
                .data(lesFootTraffic)
                .enter()
                .append("circle")
                .attr("class", "ped-demand")
                .attr("cx", d => projection([d.Longitude, d.Latitude])[0])
                .attr("cy", d => projection([d.Longitude, d.Latitude])[1])
                .attr("r", 5)
                .attr("fill", "#CAE4E3")
                .attr("opacity", 1)
                .style("cursor", "pointer")
                .on("click", function (event, d) {
                    showPedestrianChart(event, d);
                });

            container.append("p")
                .attr("id", "foot-traffic-info")
                .style("margin-top", "8px")
                .style("font-size", "18px")
                .style("line-height", "1.25")
                .style("color", "#CAE4E3")
                .html(
                    `The <b>white dots</b> on the map show locations where pedestrian foot traffic 
                    has been recorded. <b>Click a dot</b> to see how foot traffic in that area persists 
                    over time. Think about where all those people might actually go when they need to use the restroom.`
                );

            btn.text("HIDE FOOT TRAFFIC ←");
            footTrafficVisible = true;
        });

        // --- Navigation buttons ---
        const navButtons = container.append("div")
            .attr("id", "scene2-nav")
            .style("position", "absolute")
            .style("width", "100%")
            .style("bottom", "0px")
            .style("display", "flex")
            .style("justify-content", "space-between")
            .style("padding", "0 0px")
            .style("z-index", 1000);

            navButtons.append("button")
            .attr("id", "back-button")
            .style("display", "block")   // ✅ FORCE VISIBILITY
            .text("←")
            .on("click", () => window.location.href = "scene1.html");
          
          navButtons.append("button")
            .attr("id", "next-button")
            .style("display", "block")   // ✅ FORCE VISIBILITY
            .text("→")
            .on("click", () => window.location.href = "scene3.html");
          

    } catch (err) {
        console.error("🚨 Error in showLESScene():", err);
    }
}

// ------------------------------
// Pedestrian Chart Function (no hover, ignore zero y-values in average)
// ------------------------------
function showPedestrianChart(event, d) {
    d3.select("#chart-popup").remove();

    const chartContainer = d3.select("body")
        .append("div")
        .attr("id", "chart-popup")
        .style("position", "fixed")
        .style("top", "50px")
        .style("right", "60px")
        .style("width", "350px")
        .style("height", "auto")
        .style("background", "#CAE4E3")
        .style("padding", "15px")
        .style("border", "2px solid transparent")
        .style("border-radius", "0px")
        .style("box-shadow", "0px 2px 10px transparent")
        .style("z-index", 9999)
        .style("font-family", "elizeth, serif")
        .style("color", "#2E2518");

    const locationName = `${d.Borough || ""} | ${d.Street_Nam || ""} | ${d.From_Street || ""} → ${d.To_Street || ""}`;
    chartContainer.append("h3")
        .style("margin", "5px 0")
        .style("font-size", "18px")
        .style("text-align", "center")
        .text(locationName);

    // Aggregate months
    const pedColumns = Object.keys(d).filter(k => /^[A-Za-z]{3,4}\d{2}_/.test(k));
    const monthTotalsMap = {};
    pedColumns.forEach(col => {
        const monthKey = col.replace(/_(AM|PM|MD)/i, "");
        if (!monthTotalsMap[monthKey]) monthTotalsMap[monthKey] = 0;
        monthTotalsMap[monthKey] += +(d[col] || 0);
    });

    let fullData = Object.keys(monthTotalsMap).map(monthKey => {
        const label = monthKey.replace(/([a-zA-Z]+)(\d\d)/, "$1 20$2"); 
        return { month: label, count: monthTotalsMap[monthKey] };
    });

    fullData.sort((a,b) => new Date(a.month) - new Date(b.month));

    if (!fullData.length) {
        chartContainer.append("p").style("padding","10px").text("No historical counts available for this point.");
        return;
    }

    // Ignore zeros for average
    const avgCount = Math.round(d3.mean(fullData.filter(dd=>dd.count>0), dd => dd.count));

    const simplifiedData = fullData.filter((_, i) => i % 3 === 0);

    drawChart(chartContainer, simplifiedData);

    const toggleButton = chartContainer.append("button")
        .text("EXPAND →")
        .style("margin", "10px auto 0")
        .style("display", "block")
        .style("padding", "6px 12px")
        .style("border-radius", "0px")
        .style("border", "1px solid transparent")
        .style("font-family", "elizeth, serif")
        .style("font-weight", "600")
        .style("background", "#CAE4E3")
        .style("color", "#FF2269")
        .style("cursor", "pointer");

    let expanded = false;
    toggleButton.on("click", () => {
        if (!expanded) {
            drawChart(chartContainer, fullData, 700, 300);
            chartContainer.style("width", "750px");
            toggleButton.text("MINIMIZE →");
            expanded = true;
        } else {
            drawChart(chartContainer, simplifiedData, 300, 150);
            chartContainer.style("width", "350px");
            toggleButton.text("EXPAND →");
            expanded = false;
        }
    });

    chartContainer.append("p")
        .style("margin-top", "8px")
        .style("font-size", "14px")
        .style("text-align", "center")
        .style("color", "#2E2518")
        .style("font-weight", "500")
        .text(`On average, ${avgCount} pedestrians consistently travel through this area everyday.`);

    event.stopPropagation();
    d3.select("body").on("click.chart", function(event2) {
        if (!chartContainer.node().contains(event2.target)) {
            chartContainer.remove();
            d3.select("body").on("click.chart", null);
        }
    });
}


// ------------------------------
// Draw Chart Helper (line chart with dots, no hover tooltips)
// ------------------------------
function drawChart(container, data, width=300, height=150) {
    container.select("svg").remove();
    const margin = { top:30, right:20, bottom:50, left:40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svgChart = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint()
        .domain(data.map(dd => dd.month))
        .range([0, chartWidth])
        .padding(0.5);

    const y = d3.scaleLinear()
        .domain([0,d3.max(data, dd=>dd.count)]).nice()
        .range([chartHeight, 0]);

    const line = d3.line()
        .x(dd=>x(dd.month))
        .y(dd=>y(dd.count))
        .curve(d3.curveMonotoneX);

    const maxLabels = width<500?5:10;
    const step = Math.ceil(data.length/maxLabels);

    svgChart.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x)
            .tickValues(x.domain().filter((_,i)=>i%step===0))
            .tickSizeOuter(0))
        .selectAll("text")
        .style("font-size","10px")
        .attr("transform","rotate(-45)")
        .style("text-anchor","end");

    svgChart.append("g")
        .call(d3.axisLeft(y).ticks(4).tickSizeOuter(0));

    svgChart.append("g")
        .attr("class","grid")
        .call(d3.axisLeft(y).ticks(4).tickSize(-chartWidth).tickFormat(""))
        .attr("stroke-opacity",0.1);

    // --- Add line ---
    svgChart.append("path")
        .datum(data)
        .attr("fill","none")
        .attr("stroke","#1789FC")
        .attr("stroke-width",2)
        .attr("d",line);

    // --- Add dots on top of the line ---
    svgChart.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class","dot")
        .attr("cx", dd=>x(dd.month))
        .attr("cy", dd=>y(dd.count))
        .attr("r",3.5)
        .attr("fill","#1789FC");
}


// ------------------------------
// Shared helpers
// ------------------------------
function removeSceneElements() {
    d3.selectAll("#map-svg-les, .tooltip, #chart-popup").remove();
}
