console.log("hand.js loaded");

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzIWhIcvXTDG2H8Od_m02qJi4CBgl12mZTbnBX685heRCvA7LLQvkglu4Hv7-kejf8ZHw/exec";

/* -------------------------- CONFIG -------------------------- */

const surveyData = {
  userId: crypto.randomUUID(),
  age: "",
  location: "",
  hometown: "",
  ethnicity: "",
  eatOut: "",
  mostCuisine: "",
  colors: [],
  fonts: [],
  symbols: [],
  layers: [],
  finalReflection: "",
  finalComments: ""
};

// PALETTE FIX
const palette = [
  { name: "Red", color: "#e74c3c" },
  { name: "Blue", color: "#3498db" },
  { name: "Green", color: "#2ecc71" },
  { name: "Yellow", color: "#f1c40f" },
  { name: "Purple", color: "#9b59b6" },
  { name: "Orange", color: "#e67e22" },
  { name: "Gray", color: "#95a5a6" }
];

const fontFiles = [];
for (let i = 1; i <= 15; i++) fontFiles.push(`font${i}.png`);

const symbolFiles = [];
for (let i = 1; i <= 18; i++) symbolFiles.push(`symbol${i}.png`);

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

let currentIndex = 0;

/* -------------------------- NAVIGATION -------------------------- */
function showSlideByIndex(i){
  slides.forEach(s => s.classList.remove('active'));
  if(i < 0) i = 0;
  if(i >= slides.length) i = slides.length - 1;
  slides[i].classList.add('active');
  currentIndex = i;
  updateProgress();
  updateBottomNavVisibility();
}
function goNext(){ showSlideByIndex(currentIndex + 1); }
function goBack(){ showSlideByIndex(currentIndex - 1); }
function updateProgress(){
  const pct = (currentIndex / (slides.length - 1)) * 100;
  progressBar.style.width = `${pct}%`;
}
function isSlideAnswered(slide) {
  const visibleCheckboxes = Array.from(slide.querySelectorAll(".checkbox-item"))
    .filter(cb => cb.offsetParent !== null);
  if (visibleCheckboxes.length) return visibleCheckboxes.some(cb => cb.classList.contains("selected"));
  const inputs = slide.querySelectorAll("input, select, textarea");
  if (!inputs.length) return true;
  return Array.from(inputs).some(el => el.value.trim() !== "");
}

/* -------------------------- NAV HANDLER -------------------------- */
document.addEventListener('click', (e) => {
  const t = e.target;
  if(t.id === 'startBtn'){ goNext(); return; }
  if(t.classList.contains('navBtn')){
    const action = t.getAttribute('data-action');
    const active = slides[currentIndex];
    if(action === 'next'){
      if(!isSlideAnswered(active)){ alert("Please answer before continuing."); return; }

      if (active.id === "slide-personal") {
        surveyData.age = document.getElementById("r_age")?.value || "";
        surveyData.location = document.getElementById("r_location")?.value || "";
        surveyData.hometown = document.getElementById("r_hometown")?.value || "";
        surveyData.ethnicity = document.getElementById("r_ethnicity")?.value || "";
      }
      if (active.id === "slide-respondent") {
        surveyData.eatOut = document.getElementById("r_eatout")?.value || "";
        surveyData.mostCuisine = document.getElementById("r_mostcuisine")?.value || "";
      }
      goNext();
    }
    if(action === 'back'){ goBack(); }
  }
});


/* -------------------------- FONT SLIDES ✅ FIXED -------------------------- */

function buildFontSlides(){
  fontFiles.forEach((fn, idx) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.dataset.fontIndex = idx;



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
    

    fontsContainer.appendChild(slide);
  });
}

function updateBottomNavVisibility() {
  const slide = slides[currentIndex];

  const bottomNav = document.getElementById("bottom-nav");
  if (!bottomNav) return;

  // Hide on intro
  if (slide.id === "slide-intro") {
    bottomNav.style.display = "none";
    return;
  }

  // Hide on final slide
  if (slide.id === "slide-final") {
    bottomNav.style.display = "none";
    return;
  }

  bottomNav.style.display = "flex";
}


/* -------------------------- SYMBOL SLIDES ✅ FIXED -------------------------- */
function buildSymbolSlides(){
  symbolFiles.forEach((fn, idx) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.dataset.symbolIndex = idx;


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

    const explain = document.createElement("textarea");
    explain.className = "explain-box";
    explain.placeholder = "Explain your answer (optional)";
    slide.appendChild(explain);
    

    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.innerHTML = `
      <button class="navBtn" data-action="back">Back</button>
      <button class="navBtn" data-action="next">Next</button>
    `;
    slide.appendChild(controls);

    // ✅ SAVE SYMBOL RESPONSES
    const nextBtn = controls.querySelector('[data-action="next"]');


    symbolsContainer.appendChild(slide);
  });
}

/* -------------------------- LAYERED SLIDES ✅ FIXED -------------------------- */

function buildLayeredSlides(){
  layeredGroups.forEach(group => {

    let currentLayer = 1;

    const main = document.createElement('div');
    main.className = 'slide';

    main.innerHTML = `
      <h2>
        Scroll through the layers until you can confidently identify this as a Mexican restaurant.
        You may go back and forth before choosing.
      </h2>

      <img class="layered-img" src="${group.prefix}1.png">

     <div class="logo-buttons">
  <div class="layer-nav-row">
    <button class="layerBtn prevLayerBtn">←</button>
    <button class="layerBtn nextLayerBtn">→</button>
  </div>

  <button class="layerBtn stopBtn">Choose This Layer</button>
</div>


      <div class="logo-count">Layer 1 of ${LAYERS}</div>

      <div class="layer-question hidden">
        <p><strong>What elements made you choose this signage over others?</strong></p>

        <div class="checkbox-list elements-list">
          <label class="checkbox-item"><span>Typography</span></label>
          <label class="checkbox-item"><span>Color</span></label>
          <label class="checkbox-item"><span>Symbol</span></label>
          <label class="checkbox-item"><span>Composition</span></label>
          <label class="checkbox-item"><span>Texture</span></label>
          <label class="checkbox-item"><span>Pattern</span></label>
        </div>

        <input
          type="text"
          class="other-input"
          placeholder="Other (optional)"
        >

        <div class="controls">
          <button class="navBtn confirmLayerBtn" data-action="next">
            Continue
          </button>
        </div>
      </div>
    `;

    const img = main.querySelector('.layered-img');
    const count = main.querySelector('.logo-count');

    const prevBtn = main.querySelector('.prevLayerBtn');
    const nextBtn = main.querySelector('.nextLayerBtn');
    const stopBtn = main.querySelector('.stopBtn');

    const questionBlock = main.querySelector('.layer-question');
    const confirmBtn = main.querySelector('.confirmLayerBtn');
    const elementItems = main.querySelectorAll('.elements-list .checkbox-item');
    const otherInput = main.querySelector('.other-input');

    // toggle checkbox UI
    elementItems.forEach(item => {
      item.addEventListener('click', () => {
        item.classList.toggle('selected');
      });
    });

    prevBtn.addEventListener('click', () => {
      if (currentLayer > 1) {
        currentLayer--;
        img.src = `${group.prefix}${currentLayer}.png`;
        count.textContent = `Layer ${currentLayer} of ${LAYERS}`;
      }
    });

    nextBtn.addEventListener('click', () => {
      if (currentLayer < LAYERS) {
        currentLayer++;
        img.src = `${group.prefix}${currentLayer}.png`;
        count.textContent = `Layer ${currentLayer} of ${LAYERS}`;
      }
    });

    stopBtn.addEventListener('click', () => {
      questionBlock.classList.remove('hidden');
      stopBtn.disabled = true;
      prevBtn.disabled = true;
      nextBtn.disabled = true;
    });

    confirmBtn.addEventListener('click', () => {
      const selectedElements = Array.from(
        elementItems
      )
        .filter(el => el.classList.contains('selected'))
        .map(el => el.innerText.trim());

        surveyData.layers.push({
          group: group.label,
          stoppedAt: currentLayer,
          elements: selectedElements,
          other: otherInput.value || ""
        });
        
        main.dataset.group = group.label;
        main.dataset.stopped = currentLayer;


      goNext();
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
      When walking around NYC, what was the last Mexican restaurant you saw that felt authentic? 
      The last one that felt inauthentic? What specific details or markers shaped your perception in each case?
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



  // ✅ APPEND IT TO THE MAIN CONTAINER (NOT surveyContainer)
  document.querySelector(".container").insertBefore(
    slide,
    document.getElementById("slide-final") // ✅ puts it RIGHT BEFORE Thank You
  );
}


// -------------------------- FINALIZE & INIT --------------------------
function finalizeSlides() {
  slides = Array.from(document.querySelectorAll('.container .slide'));
  if(slides.length > 0) showSlideByIndex(0);
  updateBottomNavVisibility();
}
function init(){
  buildColorAssociationSlides();
  buildFontSlides();
  buildSymbolSlides();
  buildLayeredSlides();
  buildFinalReflectionSlide();
  setTimeout(finalizeSlides, 80);
}
init();

/* -------------------------- SUBMIT -------------------------- */
document.getElementById('finishBtn').addEventListener('click', async (e) => {
  e.preventDefault();
  // collect personal info on submit
  surveyData.age = document.getElementById("r_age")?.value || "";
  surveyData.location = document.getElementById("r_location")?.value || "";
  surveyData.hometown = document.getElementById("r_hometown")?.value || "";
  surveyData.ethnicity = document.getElementById("r_ethnicity")?.value || "";
  surveyData.eatOut = document.getElementById("r_eatout")?.value || "";
  surveyData.mostCuisine = document.getElementById("r_mostcuisine")?.value || "";

  collectColors();
  collectFonts();
  collectSymbols();

  surveyData.finalReflection = document.querySelector(".reflection-box")?.value || "";
  surveyData.finalComments = document.getElementById("finalComments")?.value || "";

  const payload = expandForSheet(surveyData);

  console.log("Final payload ready:", payload);

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("FETCH FAILED:", err);
    alert("Submission failed before reaching Google.");
    return;
  }

  alert("Thank you! Your responses have been submitted.");
  showSlideByIndex(0);
});
