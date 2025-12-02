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
function makeTree(x, y, w = 400, h = 500){
  const tree = document.createElementNS("http://www.w3.org/2000/svg", "image");

  tree.setAttribute("href", "svg/tree.svg"); // ✅ your Illustrator file
  tree.setAttribute("x", x);
  tree.setAttribute("y", y);
  tree.setAttribute("width", w);
  tree.setAttribute("height", h);

  tree.setAttribute("pointer-events", "none"); // ✅ hand passes through it
  tree.setAttribute("style", "user-select:none;");

  return tree;
}


function makeApple(type, cx, cy){
  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('class', 'appleGroup');
  g.setAttribute('data-type', type);
  g.setAttribute('data-id', appleId);

  // Pick random version 1–3
  const version = Math.floor(Math.random() * 3) + 1;

  let file = '';
  if(type === 'red') file = `svg/redapple${version}.svg`;
  if(type === 'green') file = `svg/greenapple${version}.svg`;
  if(type === 'yellow') file = `svg/yellowapple${version}.svg`;

  const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  img.setAttribute('href', file);
  img.setAttribute('x', cx - 50);
  img.setAttribute('y', cy - 50);
  img.setAttribute('width', 100);
  img.setAttribute('height', 100);
  img.setAttribute('pointer-events', 'none');

  g.appendChild(img);

  const id = appleId++;
  g.appleState = { id, type, cx, cy, held:false };

  return g;
}




function makeBasket(x, y, label) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${x},${y})`);

  // ✅ Your custom basket SVG
  const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
  img.setAttribute("href", "svg/basket.svg"); // <-- your file
  img.setAttribute("x", -190);
  img.setAttribute("y", -130);
  img.setAttribute("width", 300);
  img.setAttribute("height", 340);
  img.setAttribute("pointer-events", "none");
  g.appendChild(img);

  // ✅ Label under basket (still works)
  const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
  t.setAttribute("x", 0);
  t.setAttribute("y", 70);
  t.setAttribute("text-anchor", "middle");
  t.setAttribute("class", "buttonless-hint");
  t.textContent = label;
  g.appendChild(t);

  // ✅ Invisible hitbox for dropping apples
  const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  hitbox.setAttribute("x", -70);
  hitbox.setAttribute("y", -50);
  hitbox.setAttribute("width", 140);
  hitbox.setAttribute("height", 100);
  hitbox.setAttribute("fill", "transparent");
  hitbox.setAttribute("pointer-events", "none");
  g.appendChild(hitbox);

  g._hitbox = hitbox;

  return g;
}


/* ---------------- SCENE 0 ---------------- */


function enterScene0(){
  sceneLayer.innerHTML = "";
  sceneData = { apples: [], pickedApples: [] };
  heldItem = null;

  const tree = makeTree(80, 10, 400, 500);
  sceneLayer.appendChild(tree);

  const types = ["red","green","yellow"];

  for(let i=0;i<20;i++){
    const angle = Math.random()*Math.PI*2;
    const rx = 120 + Math.cos(angle) * 150 + (Math.random() * 70 - 35);
    const ry = 70 + Math.sin(angle) * 90 + (Math.random() * 50 - 25);
    const type = types[Math.floor(Math.random()*types.length)];

    const a = makeApple(type, rx + 160, ry + 160);
    sceneLayer.appendChild(a);
    sceneData.apples.push(a);
  }

  const basket = makeBasket(820, 440, "Basket");
  sceneLayer.appendChild(basket);
  sceneData.basket = basket;

  showInstruction(
    "Move your hand over an apple to pick it up. Drop it in the basket.",
    6000
  );
}

function tickScene0(){
  if(!sceneData || !sceneData.apples) return;

  // AUTO GRAB
  if(!heldItem){
    for(const apple of sceneData.apples){
      if(apple.appleState.held) continue;

      const ax = apple.appleState.cx;
      const ay = apple.appleState.cy;

      if(dist({x:ax,y:ay},{x:hand.x,y:hand.y}) < 40){
        heldItem = apple;
        apple.appleState.held = true;
        heldOffset.x = ax - hand.x;
        heldOffset.y = ay - hand.y;
        break;
      }
    }
  }

  // MOVE HELD APPLE
  if(heldItem){
    const newX = hand.x + heldOffset.x;
    const newY = hand.y + heldOffset.y;

    const img = heldItem.querySelector("image");
    img.setAttribute("x", newX - 22);
    img.setAttribute("y", newY - 22);

    heldItem.appleState.cx = newX;
    heldItem.appleState.cy = newY;

    // BASKET DROP CHECK
    const bx = 820;
    const by = 440;

    if(Math.abs(newX - bx) < 60 && Math.abs(newY - by) < 40){
      sceneData.pickedApples.push({
        type: heldItem.appleState.type,
        id: heldItem.appleState.id
      });

      sceneLayer.removeChild(heldItem);
      sceneData.apples = sceneData.apples.filter(a => a !== heldItem);
      heldItem = null;

      if(sceneData.apples.length === 0){
        setTimeout(() => runScene(1, sceneData.pickedApples), 600);
      }
    }
  }
}

/* ---------------- SCENE 1 ---------------- */
function enterScene1(prevPicked){
  sceneLayer.innerHTML = '';
  heldItem = null;

  sceneData = {
    apples: [],
    sortedCount: 0,
    needed: prevPicked.length,
    baskets: {}
  };

  // ✅ HORIZONTAL BASKET LAYOUT (TOP OF SCREEN)
  const by = 120;          // vertical position
  const bxStart = 280;    // starting X
  const spacing = 220;    // space between baskets

  const labels = ['Red','Green','Yellow'];
  const colors = ['red','green','yellow'];

  for(let i=0;i<3;i++){
    const bx = bxStart + i * spacing;

    const b = makeBasket(bx, by, labels[i]);
    sceneLayer.appendChild(b);

    const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    hitbox.setAttribute("x", bx - 60);
    hitbox.setAttribute("y", by - 30);
    hitbox.setAttribute("width", 120);
    hitbox.setAttribute("height", 60);
    hitbox.setAttribute("fill", "transparent");

    sceneLayer.appendChild(hitbox);

    sceneData.baskets[colors[i]] = {
      node: b,
      hitbox: hitbox,
      type: colors[i]
    };
  }

  // ✅ Apples spawn lower so they move upward into baskets
  let startX = 260;
  let startY = 360;

  prevPicked.forEach((ap, idx) => {
    const ax = startX + (idx % 6) * 60;
    const ay = startY + Math.floor(idx / 6) * 60;

    const a = makeApple(ap.type, ax, ay);
    sceneLayer.appendChild(a);

    sceneData.apples.push(a);
  });

  showInstruction("Sort apples into matching baskets.", 5000);
}

function tickScene1(){
  if(!sceneData || !sceneData.apples) return;

  // AUTO GRAB
  if(!heldItem){
    for(const apple of sceneData.apples){
      if(apple.appleState.held) continue;

      const ax = apple.appleState.cx;
      const ay = apple.appleState.cy;

      if(dist({x:ax,y:ay}, {x:hand.x, y:hand.y}) < 40){
        heldItem = apple;
        apple.appleState.held = true;
        heldOffset.x = ax - hand.x;
        heldOffset.y = ay - hand.y;
        break;
      }
    }
  }

  // MOVE HELD APPLE
  if(heldItem){
    const newX = hand.x + heldOffset.x;
    const newY = hand.y + heldOffset.y;

    const img = heldItem.querySelector("image");
    img.setAttribute("x", newX - 22);
    img.setAttribute("y", newY - 22);

    heldItem.appleState.cx = newX;
    heldItem.appleState.cy = newY;

    // CHECK BASKETS (NOW AT TOP)
    for(const key in sceneData.baskets){
      const basket = sceneData.baskets[key];
      const bb = basket.hitbox.getBBox();

      if(newX > bb.x && newX < bb.x + bb.width &&
         newY > bb.y && newY < bb.y + bb.height){

        if(heldItem.appleState.type === key){
          sceneLayer.removeChild(heldItem);
          sceneData.apples = sceneData.apples.filter(a => a !== heldItem);
          sceneData.sortedCount++;
          heldItem = null;

          if(sceneData.sortedCount >= sceneData.needed){
            setTimeout(() => runScene(2, sceneData.apples), 600);
          }
        } else {
          heldItem.appleState.held = false;
          heldItem = null;
        }

        return;
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
    const img = heldItem.querySelector('image');
img.setAttribute('x', newX - 22);
img.setAttribute('y', newY - 22);
heldItem.appleState.cx = newX;
heldItem.appleState.cy = newY;
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
