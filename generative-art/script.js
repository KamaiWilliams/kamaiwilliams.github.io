/* Keyboard Pixel Visualizer - Dynamic Intensity Edition */

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
let DPR = Math.max(1, window.devicePixelRatio || 1);

function resizeCanvas() {
  DPR = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * DPR);
  canvas.height = Math.floor(window.innerHeight * DPR);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const keyPatternMap = {
  a: 'bigBlock', s: 'smallBlock', d: 'lineH', f: 'lineV', g: 'rainbowPixels',
  h: 'grid', j: 'circleDots', k: 'diagonal', l: 'cross'
};

let activeKeys = {}; // currently held keys
let lastKeyTime = {}; // for speed-based intensity

// ---------- pattern functions ----------
function drawPattern(key, intensity=1) {
  const type = keyPatternMap[key] || 'bigBlock';
  const count = Math.floor(1 * intensity) + 1;

  for (let i = 0; i < count; i++) {
    switch (type) {
      case 'bigBlock':
        drawBlock(24); break;
      case 'smallBlock':
        drawBlock(8); break;
      case 'lineH':
        drawLine(true); break;
      case 'lineV':
        drawLine(false); break;
      case 'rainbowPixels':
        drawRainbow(4, 200*intensity); break;
      case 'grid':
        drawGrid(); break;
      case 'circleDots':
        drawCircles(); break;
      case 'diagonal':
        drawDiagonals(); break;
      case 'cross':
        drawCrosses(); break;
      default:
        drawBlock(24);
    }
  }
}

function drawBlock(size) {
  const x = Math.random()*(canvas.width/DPR-size);
  const y = Math.random()*(canvas.height/DPR-size);
  ctx.fillStyle = `hsl(${Math.random()*360},70%,50%)`;
  ctx.fillRect(x, y, size, size);
}

function drawLine(horizontal=true){
  if(horizontal){
    const y = Math.random()*canvas.height/DPR;
    ctx.fillStyle = `hsl(${Math.random()*360},80%,60%)`;
    ctx.fillRect(0,y,canvas.width/DPR,2+Math.random()*4);
  } else {
    const x = Math.random()*canvas.width/DPR;
    ctx.fillStyle = `hsl(${Math.random()*360},80%,60%)`;
    ctx.fillRect(x,0,2+Math.random()*4,canvas.height/DPR);
  }
}

function drawRainbow(size=4, count=100){
  for(let i=0;i<count;i++){
    const x = Math.floor(Math.random()*canvas.width/DPR/size)*size;
    const y = Math.floor(Math.random()*canvas.height/DPR/size)*size;
    ctx.fillStyle = `hsl(${Math.random()*360},100%,50%)`;
    ctx.fillRect(x,y,size,size);
  }
}

function drawGrid(){
  const step = 40;
  for(let x=0;x<canvas.width/DPR;x+=step){
    for(let y=0;y<canvas.height/DPR;y+=step){
      ctx.fillStyle = `hsl(${Math.random()*360},80%,50%)`;
      ctx.fillRect(x,y,step-4,step-4);
    }
  }
}

function drawCircles(){
  const count = 30;
  for(let i=0;i<count;i++){
    const x = Math.random()*canvas.width/DPR;
    const y = Math.random()*canvas.height/DPR;
    const r = 4+Math.random()*12;
    ctx.fillStyle = `hsl(${Math.random()*360},80%,60%)`;
    ctx.beginPath();
    ctx.arc(x,y,r,0,2*Math.PI);
    ctx.fill();
  }
}

function drawDiagonals(){
  const count = 50;
  for(let i=0;i<count;i++){
    const x = Math.random()*canvas.width/DPR;
    const y = Math.random()*canvas.height/DPR;
    const length = 10+Math.random()*30;
    ctx.strokeStyle = `hsl(${Math.random()*360},80%,60%)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x+length,y+length);
    ctx.stroke();
  }
}

function drawCrosses(){
  const count = 20;
  for(let i=0;i<count;i++){
    const x = Math.random()*canvas.width/DPR;
    const y = Math.random()*canvas.height/DPR;
    const size = 10+Math.random()*20;
    ctx.strokeStyle = `hsl(${Math.random()*360},90%,60%)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x-size/2,y); ctx.lineTo(x+size/2,y);
    ctx.moveTo(x,y-size/2); ctx.lineTo(x,y+size/2);
    ctx.stroke();
  }
}

// ---------- keyboard events ----------
window.addEventListener('keydown', ev=>{
  if(ev.repeat) return;
  const key = ev.key.toLowerCase();
  if(key.length===1){
    activeKeys[key] = true;
    lastKeyTime[key] = performance.now();
    drawPattern(key, 2); // initial intensity
  }
});

window.addEventListener('keyup', ev=>{
  const key = ev.key.toLowerCase();
  delete activeKeys[key];
});

// ---------- animation loop ----------
function animate(){
  const now = performance.now();
  for(const key in activeKeys){
    const delta = now - lastKeyTime[key];
    const intensity = Math.min(5, delta/100); // longer hold = more pixels
    drawPattern(key, intensity);
    lastKeyTime[key] = now;
  }
  requestAnimationFrame(animate);
}
animate();

// ---------- clear canvas ----------
document.getElementById('clearBtn').addEventListener('click', ()=>{
  ctx.clearRect(0,0,canvas.width,DPR,canvas.height/DPR);
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,canvas.width/DPR,canvas.height/DPR);
});
// Cmd+Z / Ctrl+Z to restart
window.addEventListener('keydown', (ev) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    if ((isMac && ev.metaKey && ev.key.toLowerCase() === 'z') ||
        (!isMac && ev.ctrlKey && ev.key.toLowerCase() === 'z')) {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width/DPR, canvas.height/DPR);
      ctx.fillStyle = '#000'; // optional: fill with black background
      ctx.fillRect(0, 0, canvas.width/DPR, canvas.height/DPR);
    }
  });
  