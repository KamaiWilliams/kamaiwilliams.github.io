/* script.js
   Farm-to-Table: Apple Picker (Hand-Controlled)
*/

// ------------------------
// Constants & DOM refs
// ------------------------
const svg = document.getElementById('svg');
const sceneLayer = document.getElementById('sceneLayer');
const overlay = document.getElementById('overlayLayer');
const video = document.getElementById('video');

const NAT_W = 1000, NAT_H = 700; // matches your SVG viewBox
let camera = null;
let hands = null;

// Hand state
let hand = { x: NAT_W/2, y: NAT_H/2, vx: 0, vy: 0 };
const handHistory = [];
const smoothFactor = 0.22;

// Scene state
let sceneIndex = 0;
let sceneData = {};
let heldItem = null;
let heldOffset = { x: 0, y: 0 };
let appleId = 1;

// ------------------------
// Helpers
// ------------------------
function now(){ return performance.now(); }
function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }
function showInstruction(text, duration=3000){
  overlay.innerHTML = '';
  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  const t = document.createElementNS('http://www.w3.org/2000/svg','text');
  t.setAttribute('x', NAT_W/2);
  t.setAttribute('y', 40);
  t.setAttribute('class','instruction');
  t.setAttribute('text-anchor','middle');
  t.textContent = text;
  g.appendChild(t);
  overlay.appendChild(g);
  if(duration) setTimeout(()=> { if(overlay.contains(g)) overlay.removeChild(g); }, duration);
}

// ------------------------
// SVG Primitives
// ------------------------
function makeTree(x, y){
  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('transform', `translate(${x},${y})`);
  const trunk = document.createElementNS('http://www.w3.org/2000/svg','rect');
  trunk.setAttribute('x', -18); trunk.setAttribute('y', 60); trunk.setAttribute('width', 36); trunk.setAttribute('height', 80);
  trunk.setAttribute('class', 'tree-trunk');
  g.appendChild(trunk);
  const crownCols = [-60, -20, 20, 60];
  crownCols.forEach(cx=>{
    const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', 0); c.setAttribute('r', 60);
    c.setAttribute('class', 'tree-crown');
    g.appendChild(c);
  });
  return g;
}

function makeApple(type, cx, cy){
  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('class','appleGroup');
  g.setAttribute('data-type', type);
  g.setAttribute('data-id', appleId);
  const r = 16;
  const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
  c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
  c.setAttribute('class','apple');
  let fill = '#e23b3b';
  if(type==='green') fill = '#6fbf49';
  if(type==='yellow') fill = '#f1c40f';
  c.setAttribute('fill', fill);
  g.appendChild(c);
  const stem = document.createElementNS('http://www.w3.org/2000/svg','rect');
  stem.setAttribute('x', cx - 2); stem.setAttribute('y', cy - r - 6);
  stem.setAttribute('width', 4); stem.setAttribute('height', 8);
  stem.setAttribute('fill','#5b3a1a');
  g.appendChild(stem);
  const id = appleId++;
  g.appleState = { id, type, cx, cy, held:false };
  return g;
}

function stemPosFix(appleGroup){
  const c = appleGroup.querySelector('circle');
  const cx = parseFloat(c.getAttribute('cx')), cy = parseFloat(c.getAttribute('cy'));
  const stem = appleGroup.querySelector('rect');
  if(stem){
    stem.setAttribute('x', cx - 2);
    stem.setAttribute('y', cy - 22);
  }
}

function makeBasket(x, y, label){
  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('transform', `translate(${x},${y})`);
  const box = document.createElementNS('http://www.w3.org/2000/svg','rect');
  box.setAttribute('x', -60); box.setAttribute('y', -30); box.setAttribute('width', 120); box.setAttribute('height', 60);
  box.setAttribute('class','basket');
  g.appendChild(box);
  const t = document.createElementNS('http://www.w3.org/2000/svg','text');
  t.setAttribute('x',0); t.setAttribute('y',50); t.setAttribute('text-anchor','middle');
  t.setAttribute('class','buttonless-hint');
  t.textContent = label;
  g.appendChild(t);

  // Transparent hitbox for drop detection
  const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  hitbox.setAttribute("x", -60);
  hitbox.setAttribute("y", -30);
  hitbox.setAttribute("width", 120);
  hitbox.setAttribute("height", 60);
  hitbox.setAttribute("fill", "transparent");
  hitbox.setAttribute("pointer-events", "none");
  g.appendChild(hitbox);
  g._hitbox = hitbox;

  return g;
}

/* ---------------- SCENE 0 ---------------- */
function enterScene0(){
  sceneLayer.innerHTML = "";
  sceneData = { apples: [], basketCount: 0, pickedApples: [] };

  const tree = makeTree(180, 140);
  sceneLayer.appendChild(tree);

  const types = ["red","green","yellow"];
  for(let i=0;i<12;i++){
    const angle = Math.random()*Math.PI*2;
    const rx = 120 + Math.cos(angle)*80 + (Math.random()*40 - 20);
    const ry = 80 + Math.sin(angle)*50 + (Math.random()*30 - 15);
    const type = types[Math.floor(Math.random()*types.length)];
    const a = makeApple(type, rx + 60, ry + 40);
    stemPosFix(a);
    sceneLayer.appendChild(a);
    sceneData.apples.push(a);
  }

  const basket = makeBasket(820, 440, "Basket");
  sceneLayer.appendChild(basket);
  sceneData.basket = basket;

  showInstruction('Move your hand over an apple to pick it up. Move it over the basket to drop it in.', 6000);
}

function tickScene0(){
  if(!sceneData || !sceneData.apples) return;

  if(!heldItem){
    for(const apple of sceneData.apples){
      if(apple.appleState.held) continue;
      const circle = apple.querySelector('circle');
      const ax = parseFloat(circle.getAttribute('cx'));
      const ay = parseFloat(circle.getAttribute('cy'));
      if(dist({x:ax,y:ay},{x:hand.x,y:hand.y}) < 40){
        heldItem = apple;
        apple.appleState.held = true;
        heldOffset.x = ax - hand.x;
        heldOffset.y = ay - hand.y;
        break;
      }
    }
  }

  if(heldItem){
    const circle = heldItem.querySelector('circle');
    const newX = hand.x + heldOffset.x;
    const newY = hand.y + heldOffset.y;
    circle.setAttribute('cx', newX);
    circle.setAttribute('cy', newY);
    heldItem.appleState.cx = newX;
    heldItem.appleState.cy = newY;
    stemPosFix(heldItem);

    // check basket
    const bx = 820, by = 440;
    if(Math.abs(newX - bx) < 60 && Math.abs(newY - by) < 40){
      // store picked apple type for next scene
      sceneData.pickedApples.push({ type: heldItem.appleState.type });

      // remove apple visually
      sceneLayer.removeChild(heldItem);
      sceneData.apples = sceneData.apples.filter(a => a !== heldItem);
      sceneData.basketCount++;
      heldItem = null;

      // advance to Scene 1 when all apples picked
      if(sceneData.apples.length === 0){
        setTimeout(()=> runScene(1, sceneData.pickedApples), 600);
      }
    }
  }
}

/* ------------------------
   Scene 1: Sorting Apples
------------------------- */
function enterScene1(prevPicked){
  sceneLayer.innerHTML = '';
  sceneData = { apples: [], sortedCount: 0, needed: prevPicked.length, baskets: {} };

  // Create baskets
  const bx = 700, byStart = 150;
  const labels = ['Red','Green','Yellow'];
  const colors = ['red','green','yellow'];
  for(let i=0;i<3;i++){
    const b = makeBasket(bx, byStart + i*180, labels[i]);
    sceneLayer.appendChild(b);

    // Attach hitbox for dropping
    const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    hitbox.setAttribute("x", bx - 60);
    hitbox.setAttribute("y", byStart + i*180 - 30);
    hitbox.setAttribute("width", 120);
    hitbox.setAttribute("height", 60);
    hitbox.setAttribute("fill", "transparent");
    hitbox.setAttribute("pointer-events", "none");
    sceneLayer.appendChild(hitbox);

    sceneData.baskets[colors[i]] = { node: b, hitbox: hitbox, type: colors[i] };
  }

  // Create apples
  let startX = 300, startY = 220;
  prevPicked.forEach((ap, idx) => {
    const a = makeApple(ap.type, startX + (idx%5)*28 - 60, startY + Math.floor(idx/5)*28 );

    // Ensure appleState is correct for auto-grab
    a.appleState = { id: a.appleState.id, type: ap.type, cx: a.appleState.cx, cy: a.appleState.cy, held: false };

    stemPosFix(a);
    sceneLayer.appendChild(a);
    sceneData.apples.push(a);
  });

  showInstruction('Sort apples into matching baskets. Move your hand over an apple to pick it up; move it into a basket to drop.', 6000);
}

function tickScene1(){
  if(!sceneData || !sceneData.apples) return;

  // AUTO-GRAB
  if(!heldItem){
    for(const apple of sceneData.apples){
      if(apple.appleState.held) continue;
      const circle = apple.querySelector('circle');
      const ax = parseFloat(circle.getAttribute('cx')), ay = parseFloat(circle.getAttribute('cy'));
      const d = dist({x:ax,y:ay}, {x:hand.x, y:hand.y});
      if(d < 40){
        heldItem = apple;
        apple.appleState.held = true;
        heldOffset.x = ax - hand.x;
        heldOffset.y = ay - hand.y;
        break;
      }
    }
  }

  // Move held apple
  if(heldItem){
    const circle = heldItem.querySelector('circle');
    const newX = hand.x + heldOffset.x, newY = hand.y + heldOffset.y;
    circle.setAttribute('cx', newX);
    circle.setAttribute('cy', newY);
    heldItem.appleState.cx = newX; heldItem.appleState.cy = newY;
    stemPosFix(heldItem);

    // Check each basket for drop
    for(const key in sceneData.baskets){
      const basket = sceneData.baskets[key];
      const bb = basket.hitbox.getBBox();
      if(newX > bb.x && newX < bb.x + bb.width && newY > bb.y && newY < bb.y + bb.height){
        if(heldItem.appleState.type === key){
          // Correct: remove apple
          sceneLayer.removeChild(heldItem);
          const idx = sceneData.apples.indexOf(heldItem);
          if(idx >= 0) sceneData.apples.splice(idx,1);
          sceneData.sortedCount++;
          heldItem = null;

          if(sceneData.sortedCount >= sceneData.needed){
            // Pass the sorted apples to the next scene
            const sortedApples = sceneData.apples.map(a => ({ type: a.appleState.type, id: a.appleState.id }));
            setTimeout(() => runScene(2, sortedApples), 500);
        }
          return;
        } else {
          // Incorrect: just drop it
          heldItem.appleState.held = false;
          heldItem = null;
          return;
        }
      }
    }
  }
}

/* Scene 2: Wash Apples */
function enterScene2(prevPicked) {
  sceneLayer.innerHTML = '';
  sceneData = { apples: [], washedCount: 0, needed: prevPicked.length };

  // Water tub
  const tub = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  tub.setAttribute("x", 700);
  tub.setAttribute("y", 250);
  tub.setAttribute("width", 180);
  tub.setAttribute("height", 150);
  tub.setAttribute("rx", 20);
  tub.setAttribute("fill", "#4aa1d8");
  tub.setAttribute("class", "water-tub");
  sceneLayer.appendChild(tub);

  // Save for hit detection
  tub._hitbox = tub;
  sceneData.tub = tub;

  // Place apples to be washed
  let cx = 300, cy = 220;
  prevPicked.forEach((ap, idx) => {
    const a = makeApple(ap.type, cx + (idx % 5) * 28 - 60, cy + Math.floor(idx / 5) * 28);

    // Ensure appleState is correct for auto-grab
    a.appleState = { id: ap.id || idx, type: ap.type, cx: cx + (idx % 5) * 28 - 60, cy: cy + Math.floor(idx / 5) * 28, held: false };

    stemPosFix(a);
    sceneLayer.appendChild(a);
    sceneData.apples.push(a);
  });

  showInstruction('Wash the apples! Hover over an apple to pick it up, then move it over the tub to wash it.', 6000);
}


function tickScene2() {
  if (!sceneData || !sceneData.apples) return;

  // AUTO-GRAB anywhere
  if (!heldItem) {
    for (const apple of sceneData.apples) {
      if (apple.appleState.held) continue;
      const circle = apple.querySelector('circle');
      const ax = parseFloat(circle.getAttribute('cx')),
        ay = parseFloat(circle.getAttribute('cy'));
      const d = dist({ x: ax, y: ay }, { x: hand.x, y: hand.y });
      if (d < 40) {
        heldItem = apple;
        apple.appleState.held = true;
        heldOffset.x = ax - hand.x;
        heldOffset.y = ay - hand.y;
        break;
      }
    }
  }

  // Move held apple with hand
  if (heldItem) {
    const circle = heldItem.querySelector('circle');
    const newX = hand.x + heldOffset.x,
      newY = hand.y + heldOffset.y;
    circle.setAttribute('cx', newX);
    circle.setAttribute('cy', newY);
    heldItem.appleState.cx = newX;
    heldItem.appleState.cy = newY;
    stemPosFix(heldItem);

    // Check if over tub
    const bb = sceneData.tub._hitbox.getBBox();
    const inside =
      newX > bb.x &&
      newX < bb.x + bb.width &&
      newY > bb.y &&
      newY < bb.y + bb.height;

    if (inside) {
      // remove apple visually
      sceneLayer.removeChild(heldItem);
      const idx = sceneData.apples.indexOf(heldItem);
      if (idx >= 0) sceneData.apples.splice(idx, 1);
      sceneData.washedCount++;
      // optional: show splash animation
      showSplash(newX, newY);
      heldItem = null;

      // move to next scene when done
      if (sceneData.washedCount >= sceneData.needed) {
        setTimeout(() => runScene(3, sceneData.apples || []), 600);
      }
    }
  }
}

// optional splash effect
function showSplash(x, y) {
  const splash = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  splash.setAttribute("cx", x);
  splash.setAttribute("cy", y);
  splash.setAttribute("r", 20);
  splash.setAttribute("fill", "#cceeff");
  splash.setAttribute("opacity", "0.7");
  sceneLayer.appendChild(splash);

  // fade out
  let t = 0;
  const fade = () => {
    t += 0.05;
    splash.setAttribute("opacity", 0.7 * (1 - t));
    if (t < 1) requestAnimationFrame(fade);
    else if (sceneLayer.contains(splash)) sceneLayer.removeChild(splash);
  };
  fade();
}


// ------------------------
// Scene manager
// ------------------------
function advanceScene(){
  sceneIndex++;
  runScene(sceneIndex);
}

function runScene(i, payload){
  if(i < 0) i = 0;
  sceneIndex = i;
  if(i === 0) enterScene0();
  else if(i === 1) enterScene1(payload || []);
  else if(i === 2) enterScene2(payload || []); // <- add this
  else enterScene0(); // fallback
}

// ------------------------
// World Tick
// ------------------------
function worldTick(){
  handHistory.push({ t: now(), x: hand.x, y: hand.y });
  while(handHistory.length>60) handHistory.shift();

  // Update hand visuals
  const hc = document.getElementById('handCursor');
  const ht = document.getElementById('handHint');
  if(hc){ hc.setAttribute('cx', hand.x); hc.setAttribute('cy', hand.y); }
  if(ht){ ht.setAttribute('x', hand.x+22); ht.setAttribute('y', hand.y-20); }

  if(sceneIndex===0) tickScene0();
  else if(sceneIndex===1) tickScene1();
}

// ------------------------
// MediaPipe Integration
// ------------------------
function svgPointFromNormalized(nx, ny){ return { x: (1-nx)*NAT_W, y: ny*NAT_H }; }
function svgPointFromLandmarks(land){ return svgPointFromNormalized(land.x, land.y); }

function onHandsResults(results){
  if(!results || !results.multiHandLandmarks || results.multiHandLandmarks.length===0){
    hand.vx *= 0.9; hand.vy *= 0.9;
    hand.x += hand.vx*0.2; hand.y += hand.vy*0.2;
    return;
  }
  const lm = results.multiHandLandmarks[0];
  const p = svgPointFromLandmarks(lm[0]);
  hand.vx = p.x - hand.x;
  hand.vy = p.y - hand.y;
  hand.x += hand.vx*smoothFactor;
  hand.y += hand.vy*smoothFactor;
  hand.x = Math.max(0, Math.min(NAT_W, hand.x));
  hand.y = Math.max(0, Math.min(NAT_H, hand.y));
}

function initHands(){
  if(typeof Hands==='undefined' || typeof Camera==='undefined'){ console.error('MediaPipe not loaded'); return; }
  hands = new Hands({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
  hands.setOptions({ maxNumHands:1, modelComplexity:1, minDetectionConfidence:0.6, minTrackingConfidence:0.6 });
  hands.onResults(onHandsResults);
  camera = new Camera(video, { onFrame: async()=>{ if(hands) await hands.send({image:video}); }, width:640, height:480 });
}

function startCamera(){ if(!hands) initHands(); if(camera) camera.start(); showInstruction('Camera started. Move a single hand into view — hover over apples to pick them.',3000); }

// Start on first click
document.addEventListener('click', function firstClick(){
  document.removeEventListener('click', firstClick);
  initHands();
  startCamera();
  runScene(0);
});

// Animation loop
function animate(){ requestAnimationFrame(animate); worldTick(); }
animate();

console.log('Script ready — auto-grab anywhere. Click to start camera.');
