/* Survey prototype logic
   - dynamic slide generator for Section 1 & 2
   - layered sign groups for Section 3 (manual click-through)
   - progress bar and basic response aggregation (client-side)
*/

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzIWhIcvXTDG2H8Od_m02qJi4CBgl12mZTbnBX685heRCvA7LLQvkglu4Hv7-kejf8ZHw/exec";


/* -------------------------- CONFIG -------------------------- */

const surveyData = {
  userId: crypto.randomUUID(),

  // personal
  age: "",
  location: "",
  hometown: "",
  ethnicity: "",
  eatOut: "",
  mostCuisine: "",

  // structured responses
  colors: [],
  fonts: [],
  symbols: [],
  layers: [],

  // final
  finalReflection: "",
  finalComments: ""
};


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

let currentIndex = 0;

/* -------------------------- NAVIGATION -------------------------- */

function showSlideByIndex(i){
  slides.forEach(s => s.classList.remove('active'));
  if(i < 0) i = 0;
  if(i >= slides.length) i = slides.length - 1;

  slides[i].classList.add('active');
  currentIndex = i;
  updateProgress();
  updateBottomNavVisibility(); // ✅ ADD THIS
}


function goNext(){ showSlideByIndex(currentIndex + 1); }
function goBack(){ showSlideByIndex(currentIndex - 1); }

function updateProgress(){
  const pct = (currentIndex / (slides.length - 1)) * 100;
  progressBar.style.width = `${pct}%`;
}

/* ✅ FIXED: SINGLE VALIDATION FUNCTION */
function isSlideAnswered(slide) {
  // If there are checkbox tiles, require at least one selected
  const checkboxes = slide.querySelectorAll(".checkbox-item");
  if (checkboxes.length) {
    return slide.querySelectorAll(".checkbox-item.selected").length > 0;
  }

  // Otherwise require some input
  const inputs = slide.querySelectorAll("input, select, textarea");
  if (!inputs.length) return true;

  return Array.from(inputs).some(el => el.value.trim() !== "");
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
    
      // ✅ SAVE PERSONAL INFO WHEN LEAVING THAT SLIDE
      if (active.id === "slide-personal") {
        surveyData.age =
          document.getElementById("r_age")?.value || "";
    
        surveyData.location =
          document.getElementById("r_location")?.value || "";
    
        surveyData.hometown =
          document.getElementById("r_hometown")?.value || "";
    
        surveyData.ethnicity =
          document.getElementById("r_ethnicity")?.value || "";
    
      }
    
      if (active.id === "slide-respondent") {
        surveyData.eatOut =
          document.getElementById("r_eatout")?.value || "";
      
        surveyData.mostCuisine =
          document.getElementById("r_mostcuisine")?.value || "";
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
    swatchBox.dataset.name = swatch.name;

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
    slide.id = `font-${idx + 1}`;


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

  nextBtn.addEventListener("click", () => {
    
    surveyData.finalReflection = textBox.value.trim();

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

function collectColors() {
  surveyData.colors = Array.from(document.querySelectorAll(".single-swatch-display")).map(swatch => {
    const parent = swatch.parentElement;
    const selected = Array.from(parent.querySelectorAll(".checkbox-item.selected")).map(el => el.innerText.trim());
    const explanation = parent.querySelector(".explain-box")?.value || "";
    return {
      name: swatch.dataset.name,
      value: swatch.style.background,
      selections: selected,
      explanation
    };
  });
}

function collectFonts() {
  surveyData.fonts = Array.from(document.querySelectorAll(".font-preview")).map(preview => {
    const slide = preview.closest(".slide");
    const selected = Array.from(slide.querySelectorAll(".checkbox-item.selected")).map(el => el.innerText.trim());
    const explanation = slide.querySelector(".explain-box")?.value || "";
    const img = slide.querySelector(".font-img");
    return {
      file: img?.src?.split("/").pop() || "",
      selections: selected,
      explanation
    };
  });
}

function collectSymbols() {
  surveyData.symbols = Array.from(document.querySelectorAll(".symbol-img")).map(img => {
    const slide = img.closest(".slide");
    const selected = Array.from(slide.querySelectorAll(".checkbox-item.selected")).map(el => el.innerText.trim());
    const explanation = slide.querySelector(".explain-box")?.value || "";
    return {
      file: img.src.split("/").pop(),
      selections: selected,
      explanation
    };
  });
}




/* -------------------------- FINISH BUTTON -------------------------- */

function expandForSheet(data) {
  const row = {
    userID: data.userId,
    age: data.age,
    location: data.location,
    hometown: data.hometown,
    ethnicity: data.ethnicity,
    eatOut: data.eatOut,
    mostCuisine: data.mostCuisine,
    finalReflection: data.finalReflection,
    finalComments: data.finalComments
  };

  // Flatten colors (up to 7)
  for (let i = 0; i < 7; i++) {
    const c = data.colors[i] || {};
    row[`Color_${i+1}_Name`] = c.name || "";
    row[`Color_${i+1}_Value`] = c.value || "";
    row[`Color_${i+1}_Selections`] = (c.selections || []).join(", ");
    row[`Color_${i+1}_Explanation`] = c.explanation || "";
  }

  // Flatten fonts (up to 15)
  for (let i = 0; i < 15; i++) {
    const f = data.fonts[i] || {};
    row[`Font_${i+1}_File`] = f.file || "";
    row[`Font_${i+1}_Selections`] = (f.selections || []).join(", ");
    row[`Font_${i+1}_Explanation`] = f.explanation || "";
  }

  // Flatten symbols (up to 18)
  for (let i = 0; i < 18; i++) {
    const s = data.symbols[i] || {};
    row[`Symbol_${i+1}_File`] = s.file || "";
    row[`Symbol_${i+1}_Selections`] = (s.selections || []).join(", ");
    row[`Symbol_${i+1}_Explanation`] = s.explanation || "";
  }

  // Flatten layers (up to 4)
  for (let i = 0; i < 4; i++) {
    const l = data.layers[i] || {};
    row[`Layer_${i+1}_Group`] = l.group || "";
    row[`Layer_${i+1}_StoppedAt`] = l.stoppedAt || "";
    row[`Layer_${i+1}_Elements`] = (l.elements || []).join(", ");
    row[`Layer_${i+1}_Other`] = l.other || "";
  }

  return row;
}


document.getElementById('finishBtn').addEventListener('click', async () => {
  // 1️⃣ collect all responses
  collectColors();
  collectFonts();
  collectSymbols();
 
  surveyData.finalReflection = document.querySelector(".reflection-box")?.value || "";
  surveyData.finalComments =
  document.getElementById("finalComments")?.value || "";


  // 2️⃣ expand for sheet
  const payload = expandForSheet(surveyData);

  console.log("Final payload ready:", payload);

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    alert("Thank you! Your responses have been submitted.");
    showSlideByIndex(0);

  } catch(err) {
    console.error(err);
    alert("Error submitting responses. Please try again.");
  }
});
