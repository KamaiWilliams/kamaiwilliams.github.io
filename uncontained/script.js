/* Guided Uncontained — D3 starter
   - Expects CSVs in data/: public-restrooms-data.csv, dis-daily-reports-data.csv, public-restrooms-conditions.csv
   - Flexible about common column name variants.
*/
Promise.all([
  d3.csv("data/public-restrooms-data.csv"),
  d3.csv("data/public-restrooms-conditions.csv"),
  d3.csv("data/dis-daily-reports-data.csv")
]).then(([restrooms, conditions, disReports]) => {
  console.log("Data loaded:", restrooms.length, conditions.length, disReports.length);
  
  // Once loaded, pass them into your visualization sequence
  initVisualization(restrooms, conditions, disReports);
});
// ---------- Utilities ----------
function chooseField(obj, possibilities) {
  // returns first existing field name from possibilities (case-insensitive)
  if (!obj) return null;
  const keys = Object.keys(obj);
  for (let p of possibilities) {
    const found = keys.find(k => k.toLowerCase() === p.toLowerCase());
    if (found) return found;
  }
  return null;
}

function parseNumberField(obj, fieldNames) {
  const f = chooseField(obj, fieldNames);
  return f ? +obj[f] : NaN;
}

function haversine(lat1, lon1, lat2, lon2) {
  // simple haversine in km
  const toRad = d => d * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ---------- Scene management ----------
const scenes = {
  title: document.getElementById('scene-title'),
  mapAll: document.getElementById('scene-map-all'),
  ratio: document.getElementById('scene-ratio'),
  density: document.getElementById('scene-density'),
  lower: document.getElementById('scene-lower'),
  conditions: document.getElementById('scene-conditions'),
};

function showScene(key) {
  Object.values(scenes).forEach(s => s.classList.add('hide'));
  if (key === 'title') scenes.title.classList.remove('hide');
  if (key === 'map-all') scenes.mapAll.classList.remove('hide');
  if (key === 'ratio') scenes.ratio.classList.remove('hide');
  if (key === 'density') scenes.density.classList.remove('hide');
  if (key === 'lower') scenes.lower.classList.remove('hide');
  if (key === 'conditions') scenes.conditions.classList.remove('hide');
}

// nav buttons
document.querySelectorAll('#nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    const s = btn.getAttribute('data-scene');
    if (s === 'title') showScene('title');
    else if (s === 'map-all') { showScene('map-all'); drawMapAll(); }
    else if (s === 'ratio') { showScene('ratio'); drawRatio(); }
    else if (s === 'density') { showScene('density'); drawDensity(); }
    else if (s === 'lower') { showScene('lower'); drawLower(); }
    else if (s === 'conditions') { showScene('conditions'); drawConditions(); }
  });
});

document.getElementById('begin').addEventListener('click', () => {
  showScene('map-all'); drawMapAll();
});

// ---------- Data loading ----------
let DATA = {
  restrooms: null,
  dis: null,
  conditions: null
};

async function loadAllData() {
  try {
    const [restrooms, dis, conditions] = await Promise.all([
      d3.csv('data/public-restrooms-data.csv'),
      d3.csv('data/dis-daily-reports-data.csv'),
      d3.csv('data/public-restrooms-conditions.csv')
    ]);
    // normalize column names & parse coords
    restrooms.forEach(r => {
      // find name/lat/lon in flexible ways
      r._name = r[Object.keys(r).find(k => /name/i.test(k))] || r['Facility Name'] || r['Facility'] || r['Name'] || r['facility_name'] || r['facility'];
      const latKey = Object.keys(r).find(k => /lat/i.test(k));
      const lonKey = Object.keys(r).find(k => /lon/i.test(k));
      r._lat = latKey ? +r[latKey] : NaN;
      r._lon = lonKey ? +r[lonKey] : NaN;
    });
    // dis: expect rows with Date / Borough / TotalIndividualsInShelter or similar
    dis.forEach(d => {
      // try to normalize fields
      d._borough = d[Object.keys(d).find(k => /borough/i.test(k))] || d['borough'] || d['Borough'];
      // pick a shelter/total column heuristically
      const shelterKey = Object.keys(d).find(k => /shelter|total individuals|total\sin/i.test(k) || /single adults|total individuals/i.test(k));
      d._sheltered = shelterKey ? +d[shelterKey] : NaN;
      const popKey = Object.keys(d).find(k => /population|pop/i.test(k));
      d._population = popKey ? +d[popKey] : NaN;
    });
    // conditions: keep as-is, but normalize identifying fields
    conditions.forEach(c => {
      c._feature = c[Object.keys(c).find(k => /feature|id|feature #/i.test(k))] || c['Feature #'] || c['feature#'];
      c._problem = c[Object.keys(c).find(k => /problem|issue|type/i.test(k))] || c['Problem'] || c['Type'] || c['Class'] || '';
    });

    DATA.restrooms = restrooms.filter(r => !isNaN(r._lat) && !isNaN(r._lon));
    DATA.dis = dis;
    DATA.conditions = conditions;
    console.log('Loaded data counts', {restrooms: DATA.restrooms.length, dis: DATA.dis.length, conditions: DATA.conditions.length});
    return DATA;
  } catch (err) {
    console.error('Error loading data', err);
    throw err;
  }
}

// ---------- Projection & helpers for maps ----------
const defaultCenter = [-74.006, 40.7128];
function makeProjection(width, height, center=defaultCenter, scale=90000) {
  return d3.geoMercator().center(center).scale(scale).translate([width/2, height/2]);
}

// tooltip
const tooltip = d3.select('body').append('div').attr('class','tooltip').style('opacity',0);

// ---------- Scene: Map All ----------
async function drawMapAll() {
  if (!DATA.restrooms) await loadAllData();
  const container = d3.select('#map-all');
  container.selectAll('*').remove();
  const width = container.node().clientWidth;
  const height = container.node().clientHeight;
  const svg = container.append('svg').attr('width',width).attr('height',height);
  const projection = makeProjection(width, height, [-74.006, 40.72], 85000);

  svg.append('rect').attr('width',width).attr('height',height).attr('fill','#f7fbff');

  svg.selectAll('circle')
    .data(DATA.restrooms)
    .enter().append('circle')
    .attr('cx', d => projection([d._lon,d._lat])[0])
    .attr('cy', d => projection([d._lon,d._lat])[1])
    .attr('r', 2.5)
    .attr('fill', '#1789FC')
    .attr('opacity', 0.8)
    .on('mouseover', (event,d) => {
      tooltip.transition().duration(150).style('opacity',0.95);
      tooltip.html(`<strong>${d._name||'Unknown'}</strong><br/>${(d['Location Type']||d['Location']||'')}`)
        .style('left', event.pageX+10+'px').style('top', event.pageY-28+'px');
    })
    .on('mouseout', () => tooltip.transition().duration(200).style('opacity',0));
}

// ---------- Scene: Ratio (restrooms vs population / sheltered) ----------
async function drawRatio() {
  if (!DATA.restrooms) await loadAllData();
  const container = d3.select('#ratio-viz');
  container.selectAll('*').remove();
  const width = container.node().clientWidth || 900;
  const height = container.node().clientHeight || 500;

  // aggregate restrooms by borough (try borough field in restrooms)
  const boroughKey = chooseField(DATA.restrooms[0], ['Borough','BOROUGH','borough']);
  // fallback: try to compute borough by lat/lon? (skipped – we assume restrooms csv has borough)
  const restByBoro = d3.rollups(DATA.restrooms, v=>v.length, d=>d[boroughKey]||d['Borough']||'UNKNOWN')
    .map(([k,c])=>({borough:k,count:c}));
  // aggregate dis data by borough for sheltered counts and population (if present)
  const disByBoro = d3.rollups(DATA.dis, v=>{
    const shelter = d3.sum(v, d => (!isNaN(d._sheltered)?d._sheltered:0));
    const pop = d3.sum(v, d => (!isNaN(d._population)?d._population:0));
    return {shelter, pop};
  }, d=>d._borough||'UNKNOWN').map(([k,vals])=>({borough:k, sheltered:vals.shelter, population:vals.pop}));

  // join arrays by borough name (case-insensitive)
  const byBoro = restByBoro.map(r=>{
    const match = disByBoro.find(d=> (d.borough||'').toLowerCase() === (r.borough||'').toLowerCase());
    return {borough: r.borough, restrooms: r.count, sheltered: match?match.sheltered:0, population: match?match.population:NaN};
  });

  // Prepare basic bar chart with toggle
  const svg = container.append('svg').attr('width',width).attr('height',height);
  const margin = {top:30,right:20,bottom:60,left:100};
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const g = svg.append('g').attr('transform',`translate(${margin.left},${margin.top})`);

  function draw(mode='perResident') {
    g.selectAll('*').remove();
    // compute metric: restrooms per 100k residents OR restrooms per sheltered person
    const data = byBoro.map(d=>{
      const metric = (mode==='perResident' && d.population>0) ? (d.restrooms / d.population * 100000) : 
                     (mode==='perSheltered' && d.sheltered>0) ? (d.restrooms / d.sheltered) : 0;
      return {...d, metric};
    }).sort((a,b)=>b.metric-a.metric);

    const x = d3.scaleLinear().domain([0, d3.max(data,d=>d.metric)*1.1||1]).range([0,w]);
    const y = d3.scaleBand().domain(data.map(d=>d.borough)).range([0,h]).padding(0.2);

    g.selectAll('rect').data(data).enter().append('rect')
      .attr('y', d=>y(d.borough)).attr('x',0).attr('height',y.bandwidth()).attr('width',d=>x(d.metric)).attr('fill','#1789fc');

    g.append('g').call(d3.axisLeft(y));
    g.append('g').attr('transform',`translate(0,${h})`).call(d3.axisBottom(x).ticks(5));
    g.selectAll('text.val').data(data).enter().append('text').attr('class','val')
      .attr('x', d=>x(d.metric)+6).attr('y', d=>y(d.borough)+y.bandwidth()/2+4).text(d=>d.metric?d.metric.toFixed(2):'0');
  }

  // button behavior
  d3.selectAll('#ratio-controls button').on('click', function(){
    d3.selectAll('#ratio-controls button').classed('active', false);
    d3.select(this).classed('active', true);
    const mode = this.getAttribute('data-mode');
    draw(mode === 'perResident' ? 'perResident' : 'perSheltered');
  });

  // initial draw (perResident if population data exists)
  draw('perResident');
}

// ---------- Scene: Density (grid) ----------
async function drawDensity() {
  if (!DATA.restrooms) await loadAllData();
  const container = d3.select('#density-viz'); container.selectAll('*').remove();
  const width = container.node().clientWidth;
  const height = container.node().clientHeight;
  const svg = container.append('svg').attr('width',width).attr('height',height);
  const projection = makeProjection(width, height, [-74.006,40.72], 90000);

  // project points to pixel coords
  const pts = DATA.restrooms.map(d=>{
    const p = projection([d._lon,d._lat]);
    return {x:p[0], y:p[1]};
  });

  // grid cell size ~ block size (choose 24-40 px)
  const cell = 28;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const counts = new Map();

  pts.forEach(p=>{
    if (!isFinite(p.x) || !isFinite(p.y)) return;
    const col = Math.floor(p.x / cell);
    const row = Math.floor(p.y / cell);
    const key = `${col}_${row}`;
    counts.set(key, (counts.get(key)||0)+1);
  });

  // find max
  const max = d3.max(Array.from(counts.values()));
  const color = d3.scaleLinear().domain([0, max||1]).range(['#e6f7ff','#08306b']);

  // draw cells with counts > 0
  counts.forEach((c,key)=>{
    const [col,row] = key.split('_').map(Number);
    svg.append('rect')
      .attr('x', col*cell).attr('y', row*cell).attr('width', cell).attr('height', cell)
      .attr('fill', color(c)).attr('opacity', 0.85)
      .attr('stroke', 'rgba(255,255,255,0.05)');
  });
}

// ---------- Scene: Lower Manhattan interactive ----------
async function drawLower() {
  if (!DATA.restrooms) await loadAllData();
  const container = d3.select('#lower-viz'); container.selectAll('*').remove();
  d3.select('#lower-info').text('');
  const width = container.node().clientWidth; const height = container.node().clientHeight;
  const svg = container.append('svg').attr('width',width).attr('height',height);
  // bbox for Lower Manhattan (approx): lat 40.700 to 40.735, lon -74.02 to -73.99
  const bbox = {minLat:40.700, maxLat:40.735, minLon:-74.02, maxLon:-73.99};
  const filtered = DATA.restrooms.filter(d=> d._lat >= bbox.minLat && d._lat <= bbox.maxLat && d._lon >= bbox.minLon && d._lon <= bbox.maxLon);

  const projection = makeProjection(width, height, [-74.0059, 40.7135], 220000);
  svg.append('rect').attr('width',width).attr('height',height).attr('fill','#fff');

  // draw restrooms
  svg.selectAll('circle').data(filtered).enter().append('circle')
    .attr('cx', d=>projection([d._lon,d._lat])[0])
    .attr('cy', d=>projection([d._lon,d._lat])[1])
    .attr('r',4).attr('fill','#1789FC').attr('opacity',0.9);

  // click anywhere to get distance to nearest restroom
  svg.on('click', (event) => {
    const [mx,my] = d3.pointer(event);
    // invert pointer to lat/lon not easy with mercator; instead compute nearest by pixel distance using projected coords:
    const clickLatLon = null; // we will compute distance via projected points
    // compute distances in pixel space first for finding nearest
    let nearest = null; let minDist = Infinity;
    filtered.forEach(r=>{
      const p = projection([r._lon,r._lat]);
      const dx = p[0]-mx; const dy = p[1]-my;
      const distPx = Math.sqrt(dx*dx + dy*dy);
      if (distPx < minDist){ minDist = distPx; nearest = {r,p,distPx}; }
    });
    if(!nearest) return;
    // convert pixel distance to real km by approximating using haversine between click projected inverse:
    // we can approximate lat/lon of click by projecting an inverse: use d3.geoMercator().invert if available
    const inverseProj = projection.invert ? projection.invert([mx,my]) : null; // may not be available in this simple projection
    // best path: compute haversine between click point computed by approximating with small offsets using projection - but we'll approximate using nearest restroom lat/lon and pixel ratio:
    // approximate km per pixel at this zoom: compute distance between two pixels separated by 100 px horizontally:
    const pA = [mx, my];
    const pB = [mx+100, my];
    const lonlatA = projection.invert ? projection.invert(pA) : null;
    const lonlatB = projection.invert ? projection.invert(pB) : null;
    let km = null;
    if (lonlatA && lonlatB) {
      km = haversine(lonlatA[1], lonlatA[0], lonlatB[1], lonlatB[0]) * (minDist/100);
    } else {
      // fallback: estimate 0.00001 degrees ≈ 1.11 m (approx). compute based on degree differences between nearest and another
      const degDist = Math.sqrt((nearest.r._lat - filtered[0]._lat)**2 + (nearest.r._lon - filtered[0]._lon)**2) || 0.001;
      km = degDist * 111 * (minDist/100);
    }

    // show marker on map and highlight nearest
    svg.selectAll('.click-marker').remove();
    svg.append('circle').attr('class','click-marker').attr('cx', mx).attr('cy', my).attr('r',6).attr('fill','rgba(255,0,0,0.7)');
    svg.selectAll('circle').attr('stroke', null).attr('stroke-width', 0);
    svg.append('circle').attr('cx', nearest.p[0]).attr('cy', nearest.p[1]).attr('r',8).attr('fill','none').attr('stroke','#ff6600').attr('stroke-width',2);

    const distKm = km ? (km).toFixed(2) : (minDist*0.01).toFixed(2);
    d3.select('#lower-info').html(`<strong>Nearest restroom:</strong> ${nearest.r._name || nearest.r['Facility Name'] || 'Unnamed'} — approx ${distKm} km`);
  });
}

// ---------- Scene: Conditions ----------
async function drawConditions() {
  if (!DATA.restrooms) await loadAllData();
  const container = d3.select('#conditions-viz'); container.selectAll('*').remove();
  const width = container.node().clientWidth; const height = container.node().clientHeight;
  const svg = container.append('svg').attr('width',width).attr('height',height);
  const projection = makeProjection(width, height, [-74.006,40.72], 220000);

  // attempt to match conditions to restrooms by feature or name
  // create a map keyed by possible feature id or lowercased name
  const condByName = new Map();
  DATA.conditions.forEach(c=>{
    const nameKey = (c['Facility Name'] || c['facility name'] || c._feature || c['Feature #'] || '').toString().toLowerCase().trim();
    if (nameKey) condByName.set(nameKey, c);
  });

  const filtered = DATA.restrooms.filter(d=>{
    // filter Lower Manhattan bbox like earlier
    return d._lat >= 40.700 && d._lat <= 40.735 && d._lon >= -74.02 && d._lon <= -73.99;
  });

  // color scale: if condition problem contains "Missing" or "Litter" treat as moderate; otherwise unknown
  function severityFor(c) {
    if (!c) return 0;
    const txt = (c._problem || '').toString().toLowerCase();
    if (txt.includes('missing') || txt.includes('no')) return 2;
    if (txt.includes('litter') || txt.includes('light') || txt.includes('damage')) return 1;
    return 0;
  }

  svg.append('rect').attr('width',width).attr('height',height).attr('fill','#fff');

  svg.selectAll('circle')
    .data(filtered).enter()
    .append('circle')
    .attr('cx', d=>projection([d._lon,d._lat])[0])
    .attr('cy', d=>projection([d._lon,d._lat])[1])
    .attr('r',6)
    .attr('fill', d=>{
      const key = (d._name||'').toString().toLowerCase().trim();
      const cond = condByName.get(key);
      const sev = severityFor(cond);
      if (sev===2) return '#e11d48'; // red
      if (sev===1) return '#f59e0b'; // amber
      return '#10b981'; // green-ish
    })
    .attr('opacity',0.9)
    .on('mouseover',(event,d)=>{
      const key = (d._name||'').toString().toLowerCase().trim();
      const cond = condByName.get(key);
      tooltip.transition().duration(150).style('opacity',0.95);
      tooltip.html(`<strong>${d._name||'Unnamed'}</strong><br/>${cond ? (cond._problem || cond['Problem'] || '') : 'No condition record'}`)
        .style('left',event.pageX+10+'px').style('top',event.pageY-28+'px');
    }).on('mouseout',()=>tooltip.transition().duration(100).style('opacity',0));
}

// ---------- initialize: show title
showScene('title');
