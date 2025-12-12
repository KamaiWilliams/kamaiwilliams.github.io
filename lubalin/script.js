/* Survey prototype logic
   - dynamic slide generator for Section 1 & 2
   - layered sign groups for Section 3 (manual click-through)
   - progress bar and basic response aggregation (client-side)
*/

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby0u_qFcaq52Gx1JlbUu7IOrVra5u03sfnU1qEVYzo_hgUAEUfgnVhKo3avVlNJ8m5auw/exec";

/* -------------------------- CONFIG -------------------------- */

const fontFiles = [];
for (let i = 1; i <= 15; i++) {
  fontFiles.push(`font${i}.png`);
}


const symbolFiles = [];
for (let i = 1; i <= 18; i++) {
  symbolFiles.push(`symbol${i}.png`);
}


const layeredGroups = [
  { id:'cowboy', label:'Cowboy', prefix:'images/cowboy' },
  { id:'folklore', label:'Folklore', prefix:'images/folklore' },
  { id:'rotulos', label:'Rotulos', prefix:'images/rotulos' },
  { id:'flag', label:'Flag', prefix:'images/flag' }
];
const LAYERS = 10;

/* -------------------------- DOM & STATE -------------------------- */

let slides = [];
const progressBar = document.getElementById('progressBar');
const fontsContainer = document.getElementById('fonts-container');
const symbolsContainer = document.getElementById('symbols-container');
const layeredContainer = document.getElementById('layered-container');
const responses = [];
let currentIndex = 0;

/* -------------------------- NAVIGATION -------------------------- */

function showSlideByIndex(i){
  slides.forEach(s => s.classList.remove('active'));
  if(i < 0) i = 0;
  if(i >= slides.length) i = slides.length - 1;
  slides[i].classList.add('active');
  currentIndex = i;
  updateProgress();
}

function goNext(){ showSlideByIndex(currentIndex + 1); }
function goBack(){ showSlideByIndex(currentIndex - 1); }

function updateProgress(){
  const pct = (currentIndex / (slides.length - 1)) * 100;
  progressBar.style.width = `${pct}%`;
}

/* ✅ FIXED: SINGLE VALIDATION FUNCTION */
function isSlideAnswered(slide){
  // ✅ if ranked cuisine tiles exist, require at least 1 selected
  const ranked = slide.querySelectorAll('.checkbox-item.selected');
  if (ranked.length) return true;

  // ✅ otherwise fall back to normal inputs
  const inputs = slide.querySelectorAll('input, select, textarea');
  if(!inputs.length) return true;

  return Array.from(inputs).some(el => {
    return el.value && el.value.trim() !== '';
  });
}


/* -------------------------- MAIN NAV HANDLER -------------------------- */

document.addEventListener('click', (e) => {
  const t = e.target;

  if(t.id === 'startBtn'){
    goNext();
    return;
  }

  if(t.classList.contains('navBtn')){
    const action = t.getAttribute('data-action');
    const active = slides[currentIndex];

    if(action === 'next'){
      if(!isSlideAnswered(active)){
        alert("Please answer before continuing.");
        return;
      }
      goNext();
    }

    if(action === 'back'){
      goBack();
    }
  }
});

/* -------------------------- COLOR SECTION -------------------------- */

const palette = [
  { name: "Red", color: "#FE0000" },
  { name: "Orange", color: "#FF7900" },
  { name: "Yellow", color: "#FFD800" },
  { name: "Green", color: "#4CBB17" },
  { name: "Blue", color: "#273BE2" },
  { name: "Purple", color: "#9400D3" },
  { name: "Brown", color: "#6F4E37" },
];

function buildColorAssociationSlides() {
  const cuisineOptions = [
    "Italian","Chinese","Indian","Mexican","Korean","Thai",
    "Egyptian","Puerto Rican","Brazilian","American",
    "Not sure","None of the above"
  ];

  const container = document.createElement("div");

  palette.forEach((swatch) => {
    const slide = document.createElement("div");
    slide.className = "slide";

    const h2 = document.createElement("h2");
    h2.textContent = "Which cuisine do you associate this color with? (pick up to 3)";
    slide.appendChild(h2);

    const content = document.createElement("div");
    content.className = "slide-content";
    slide.appendChild(content);

    const swatchBox = document.createElement("div");
    swatchBox.className = "single-swatch-display";
    swatchBox.style.background = swatch.color;
    content.appendChild(swatchBox);

    const q = document.createElement("p");
    
    content.appendChild(q);

    const list = document.createElement("div");
    list.className = "checkbox-list";
    content.appendChild(list);

    cuisineOptions.forEach(c => {
      const item = document.createElement("label");
      item.className = "checkbox-item";
      item.innerHTML = `<span>${c}</span>`;
      list.appendChild(item);
    });

    // ✅ RANKED SELECTION LOGIC (MAX 3)
    list.querySelectorAll(".checkbox-item").forEach(item => {
      item.addEventListener("click", () => {
        const selected = list.querySelectorAll(".checkbox-item.selected");

        if (item.classList.contains("selected")) {
          item.classList.remove("selected");
          item.removeAttribute("data-rank");
        } else {
          if (selected.length >= 3) return;
          item.classList.add("selected");
        }

        // ✅ RE-RANK
        list.querySelectorAll(".checkbox-item.selected").forEach((el, i) => {
          el.setAttribute("data-rank", i + 1);
        });
      });
    });

    const explain = document.createElement("textarea");
    explain.className = "explain-box";
    explain.placeholder = "Explain your answer (optional)";
    content.appendChild(explain);

    // ✅ ONLY ONE CONTROLS BLOCK
    const controls = document.createElement("div");
    controls.className = "controls";
    controls.innerHTML = `
      <button class="navBtn" data-action="back">Back</button>
      <button class="navBtn" data-action="next">Next</button>
    `;
    slide.appendChild(controls);

    // ✅ SAFE NEXT BUTTON HANDLER
    const nextBtn = controls.querySelector('[data-action="next"]');
    nextBtn.addEventListener("click", () => {
      const selected = Array.from(
        list.querySelectorAll(".checkbox-item.selected")
      ).map(el => el.innerText.trim());

      responses.push({
        section: "color",
        colorName: swatch.name,
        colorValue: swatch.color,
        cuisines: selected,
        explanation: explain.value || null
      });
    });

    container.appendChild(slide);
  });

  document.getElementById("slide-formal-intro")
    .insertAdjacentElement("afterend", container);
}

/* -------------------------- FONT SLIDES ✅ FIXED -------------------------- */

function buildFontSlides(){
  fontFiles.forEach((fn, idx) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.id = `font-${idx+8}`;

    const h2 = document.createElement('h2');
    h2.textContent = 'Which cuisine is best representative of this font? (pick up to 3)';
    slide.appendChild(h2);

    const content = document.createElement('div');
    content.className = 'slide-content';
    slide.appendChild(content);

    const q = document.createElement('p');

    content.appendChild(q);

    const preview = document.createElement('div');
    preview.className = 'font-preview';
    preview.innerHTML = `<img class="font-img" src="images/${fn}">`;

    content.appendChild(preview);

    const list = document.createElement('div');
    list.className = 'checkbox-list';
    content.appendChild(list);

    const cuisines = [
      "Italian","Chinese","Indian","Mexican","Korean","Thai",
    "Egyptian","Puerto Rican","Brazilian","American",
    "Not sure","None of the above"
    ];

    cuisines.forEach(c => {
      const item = document.createElement('label');
      item.className = 'checkbox-item';
      item.innerHTML = `<span>${c}</span>`;
      list.appendChild(item);
    });

    // ✅ RANKED TILE SELECTION (MAX 3)
    list.querySelectorAll(".checkbox-item").forEach(item => {
      item.addEventListener("click", () => {
        const selected = list.querySelectorAll(".checkbox-item.selected");

        if (item.classList.contains("selected")) {
          item.classList.remove("selected");
          item.removeAttribute("data-rank");
        } else {
          if (selected.length >= 3) return;
          item.classList.add("selected");
        }

        // ✅ RE-RANK AFTER EACH CHANGE
        list.querySelectorAll(".checkbox-item.selected").forEach((el, i) => {
          el.setAttribute("data-rank", i + 1);
        });
      });
    });

    const explain = document.createElement('textarea');
    explain.className = 'explain-box';
    explain.placeholder = "Explain your answer (optional)";
    content.appendChild(explain);

    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.innerHTML = `
      <button class="navBtn" data-action="back">Back</button>
      <button class="navBtn" data-action="next">Next</button>
    `;
    slide.appendChild(controls);

    // ✅ SAVE FONT RESPONSES
    const nextBtn = controls.querySelector('[data-action="next"]');
    nextBtn.addEventListener("click", () => {
      const selected = Array.from(
        list.querySelectorAll(".checkbox-item.selected")
      ).map(el => el.innerText.trim());

      responses.push({
        section: "font",
        fontFile: fn,
        cuisines: selected,
        explanation: explain.value || null
      });
    });

    fontsContainer.appendChild(slide);
  });
}


/* -------------------------- SYMBOL SLIDES ✅ FIXED -------------------------- */
function buildSymbolSlides(){
  symbolFiles.forEach((fn, idx) => {
    const slide = document.createElement('div');
    slide.className = 'slide';

    const h2 = document.createElement('h2');
    h2.textContent = 'Which cuisine is best representative of this symbol? (pick up to 3)';
    slide.appendChild(h2);

    const img = document.createElement('img');
    img.src = `images/${fn}`;
    img.className = 'symbol-img';
    slide.appendChild(img);

    const q = document.createElement('p');
    
    slide.appendChild(q);

    const list = document.createElement('div');
    list.className = 'checkbox-list';
    slide.appendChild(list);

    const cuisines = [
      "Italian","Chinese","Indian","Mexican","Korean","Thai",
    "Egyptian","Puerto Rican","Brazilian","American",
    "Not sure","None of the above"
    ];

    cuisines.forEach(c => {
      const item = document.createElement('label');
      item.className = 'checkbox-item';
      item.innerHTML = `<span>${c}</span>`;
      list.appendChild(item);
    });

    // ✅ RANKED TILE SELECTION (MAX 3)
    list.querySelectorAll(".checkbox-item").forEach(item => {
      item.addEventListener("click", () => {
        const selected = list.querySelectorAll(".checkbox-item.selected");

        if (item.classList.contains("selected")) {
          item.classList.remove("selected");
          item.removeAttribute("data-rank");
        } else {
          if (selected.length >= 3) return;
          item.classList.add("selected");
        }

        // ✅ RE-RANK AFTER EACH CHANGE
        list.querySelectorAll(".checkbox-item.selected").forEach((el, i) => {
          el.setAttribute("data-rank", i + 1);
        });
      });
    });

    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.innerHTML = `
      <button class="navBtn" data-action="back">Back</button>
      <button class="navBtn" data-action="next">Next</button>
    `;
    slide.appendChild(controls);

    // ✅ SAVE SYMBOL RESPONSES
    const nextBtn = controls.querySelector('[data-action="next"]');
    nextBtn.addEventListener("click", () => {
      const selected = Array.from(
        list.querySelectorAll(".checkbox-item.selected")
      ).map(el => el.innerText.trim());

      responses.push({
        section: "symbol",
        symbolFile: fn,
        cuisines: selected
      });
    });

    symbolsContainer.appendChild(slide);
  });
}

/* -------------------------- LAYERED SLIDES ✅ FIXED -------------------------- */

function buildLayeredSlides(){
  layeredGroups.forEach(group => {

    let currentLayer = 1; // ✅ track which image layer you're on

    const main = document.createElement('div');
    main.className = 'slide';

    main.innerHTML = `
      <h2>Please select the first design where you can confidently identify this as a Mexican restaurant. Pressing next will change the image. </h2>

      <img class="layered-img" src="${group.prefix}1.png">


      <div class="logo-buttons">
        <button class="navBtn nextLayerBtn">Show Next Layer)</button>
        <button class="navBtn stopBtn">STOP</button>
        
      </div>

      <div class="logo-count">Layer 1 of ${LAYERS}</div>
    `;

    const img = main.querySelector('.layered-img');
    const stopBtn = main.querySelector('.stopBtn');
    const nextBtn = main.querySelector('.nextLayerBtn');
    const count = main.querySelector('.logo-count');

    // ✅ NEXT LAYER BUTTON
    nextBtn.addEventListener('click', () => {
      if (currentLayer < LAYERS) {
        currentLayer++;
        img.src = `${group.prefix}${currentLayer}.png`;
        count.textContent = `Layer ${currentLayer} of ${LAYERS}`;
      }
    });

    // ✅ STOP BUTTON (records layer + moves on)
    stopBtn.addEventListener('click', () => {
      responses.push({
        section: "layered-sign",
        group: group.label,
        stoppedAtLayer: currentLayer
      });

      goNext(); // ✅ advance to next survey slide
    });

    layeredContainer.appendChild(main);
  });
}

function buildFinalReflectionSlide(){
  const slide = document.createElement('div');
  slide.className = 'slide';

  slide.innerHTML = `
    <h2>Final Reflection</h2>

    <p class="reflection-question">
      What does it mean to sell Mexico to an American audience? Do you perceive the Mexican restaurant design you see in the world as reliant on stereotype, cultural signifiers, authentic experiences, nostalgia, or something else? Explain.
    </p>

    <textarea 
      class="reflection-box"
      placeholder="Type your thoughts here..."
      rows="7"
    ></textarea>

    <div class="controls">
      <button class="navBtn" data-action="back">Back</button>
      <button class="navBtn" data-action="next">Next</button>
    </div>
  `;

  const textBox = slide.querySelector(".reflection-box");
  const nextBtn = slide.querySelector('[data-action="next"]');

  nextBtn.addEventListener("click", () => {
    responses.push({
      section: "final_reflection",
      answer: textBox.value.trim()
    });
  });

  // ✅ APPEND IT TO THE MAIN CONTAINER (NOT surveyContainer)
  document.querySelector(".container").insertBefore(
    slide,
    document.getElementById("slide-final") // ✅ puts it RIGHT BEFORE Thank You
  );
}


/* -------------------------- FINALIZE ✅ FIXED -------------------------- */

function finalizeSlides(){
  slides = Array.from(document.querySelectorAll('.container .slide'));
  showSlideByIndex(0);
}

/* -------------------------- INIT -------------------------- */

function init(){
  buildColorAssociationSlides();
  buildFontSlides();
  buildSymbolSlides();
  buildLayeredSlides();
  buildFinalReflectionSlide();
  setTimeout(finalizeSlides, 80);
}

init();

/* -------------------------- FINISH BUTTON -------------------------- */

document.getElementById('finishBtn').addEventListener('click', async () => {
  const finalText = document.getElementById('finalComments').value || '';

  responses.push({
    section: 'finalComments',
    text: finalText
  });

  await submitToGoogleSheet();

  alert("Thank you! Your responses have been submitted.");
  showSlideByIndex(0);
  responses.length = 0;
});


async function submitToGoogleSheet() {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: crypto.randomUUID(),
        answers: responses
      })
    });

    console.log("Sent to Google Sheets:", responses);
  } catch (err) {
    console.error("SEND ERROR:", err);
  }
}
