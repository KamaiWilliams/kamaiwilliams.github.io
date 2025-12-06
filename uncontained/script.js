
// ---------- Global navigation helper ----------
/*
 - Use the global buttons (global-back / global-next) for navigation.
 - Scenes should call setCurrentScene('scene1'|'scene2'|'scene3') when activated.
*/

let currentScene = 'title'; // default

function setCurrentScene(sceneId) {
  currentScene = sceneId;
  // decide whether to show nav on this page
  const backBtn = document.getElementById('global-back');
  const nextBtn = document.getElementById('global-next');

  // if the global buttons don't exist on the page, do nothing
  if (!backBtn || !nextBtn) return;

  // hide on title
  if (sceneId === 'title') {
    backBtn.hidden = true;
    nextBtn.hidden = true;
    return;
  }

  // show for scenes
  backBtn.hidden = false;
  nextBtn.hidden = false;
}

// navigation actions (full-page navigation to avoid partial/broken DOM states)
function navBack() {
  if (currentScene === 'scene1') return window.location.href = 'index.html';
  if (currentScene === 'scene2') return window.location.href = 'scene1.html';
  if (currentScene === 'scene3') return window.location.href = 'scene2.html';
  // fallback
  window.location.href = 'index.html';
}
function navNext() {
  if (currentScene === 'scene1') return window.location.href = 'scene2.html';
  if (currentScene === 'scene2') return window.location.href = 'scene3.html';
  if (currentScene === 'scene3') return window.location.href = 'info.html';
  // fallback
  window.location.href = 'scene1.html';
}

// wire global buttons after DOM ready (safe even if buttons missing)
document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.getElementById('global-back');
  const nextBtn = document.getElementById('global-next');

  if (backBtn) backBtn.addEventListener('click', navBack);
  if (nextBtn) nextBtn.addEventListener('click', navNext);

  // ensure title screen hides nav
  setCurrentScene('title');
});

// ------------------------------
// Entry point: title → Scene 1
// ------------------------------
d3.select("#start").on("click", () => {
  d3.select("#title-screen")
    .transition()
    .duration(800)
    .style("opacity", 0)
    .remove();

  // ✅ SHOW NAV BUTTONS
  d3.select("#back-button").style("display", "block");
  d3.select("#next-button").style("display", "block");

  // ✅ SHOW DESCRIPTION PANEL
  d3.select("#map-description").style("display", "block");

  // ✅ LOAD SCENE
  showRestroomMap();
});

// ------------------------------
// Shared helpers
// ------------------------------
function removeSceneElements() {
  d3.selectAll(`
    #map-svg,
    #map-svg-les,
    #map-svg-les-nearest,
    .tooltip,
    #filter-panel,
    #les-desc-overlay,
    #chart-popup
  `).remove();
}


function buildFilterPanel(containerSelection, dotsSelection, typeColors, dataKeyNames = { operator: "Operator", status: "Status", access: "Accessibility" }) {
  const typeCategories = Object.keys(typeColors);
  const statusCategories = ["Operational", "Not Operational", "Closed for Construction"];
  const accessCategories = ["Fully Accessible", "Partially Accessible", "Not Accessible"];

  const activeTypes = Object.fromEntries(typeCategories.map(t => [t, true]));
  const activeStatus = Object.fromEntries(statusCategories.map(s => [s, true]));
  const activeAccess = Object.fromEntries(accessCategories.map(a => [a, true]));

  containerSelection.html("");
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
    .classed("show", false);

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

  function buildSection(title, categories, activeObj, colorMap) {
    const sec = containerSelection.append("div").style("margin", "8px 0 12px 0");
    sec.append("div").text(title).style("font-weight", "600").style("margin-bottom", "6px");
    const list = sec.append("div");
    categories.forEach(cat => {
      const row = list.append("label")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin-bottom", "6px")
        .style("cursor", "pointer");
      row.append("input")
        .attr("type", "checkbox")
        .property("checked", true)
        .on("change", function() {
          activeObj[cat] = this.checked;
          update();
        });
      row.append("span").text(" " + cat)
        .style("margin-left", "8px")
        .style("color", colorMap ? colorMap[cat] : "#111");
    });
  }

  buildSection("Type", typeCategories, activeTypes, typeColors);
  buildSection("Status", statusCategories, activeStatus, null);
  buildSection("Accessibility", accessCategories, activeAccess, null);

  function update() {
    dotsSelection.each(function(d) {
      const visible =
        activeTypes[d.Operator] &&
        activeStatus[d.Status] &&
        activeAccess[d.Accessibility];
      d3.select(this).attr("display", visible ? null : "none");
    });
  }

  return { panel: containerSelection, update };
}

// Distance helper
function haversine(lat1, lon1, lat2, lon2){
  const toRad = d => d * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
