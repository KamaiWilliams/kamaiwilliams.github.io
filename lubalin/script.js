/* Survey prototype logic
   - dynamic slide generator for Section 1 & 2
   - layered sign groups for Section 3 (manual click-through)
   - progress bar and basic response aggregation (client-side)
*/

// -------------------
// Google Sheets Submission
// -------------------
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby0u_qFcaq52Gx1JlbUu7IOrVra5u03sfnU1qEVYzo_hgUAEUfgnVhKo3avVlNJ8m5auw/exec";


// Section 1: cuisines and placeholder PNG filenames (you asked for .png)
const cuisines = [
  { id: 'american', label: 'American', img: 'images/food-american.png' },
  { id: 'chinese', label: 'Chinese', img: 'images/food-chinese.png' },
  { id: 'mexican', label: 'Mexican', img: 'images/food-mexican.png' },
  { id: 'indian', label: 'Indian', img: 'images/food-indian.png' },
];

// Section 2: icons (actual icons per your choice)
const icons = [
  { id: 'cowboy', label: 'Cowboy', img: 'images/icon-cowboy.png' },
  { id: 'flag', label: 'Flag', img: 'images/icon-flag.png' },
  { id: 'rotulos', label: 'Rotulos', img: 'images/icon-rotulos.png' },
  { id: 'folklore', label: 'Folklore', img: 'images/icon-folklore.png' },
];

// Section 3: layered sign groups (assume 10 layers each: 1..10)
const layeredGroups = [
  { id: 'cowboy', label: 'Cowboy', prefix: 'images/cowboy' },   // cowboy1.png ... cowboy10.png
  { id: 'rotulos', label: 'Rotulos', prefix: 'images/rotulos' },
  { id: 'flag', label: 'Flag', prefix: 'images/flag' },
  { id: 'folklore', label: 'Folklore', prefix: 'images/folklore' },
];
const LAYERS_PER_GROUP = 10;

/* -------------------------
   State
   ------------------------- */
const dynamicSlidesEl = document.getElementById('dynamicSlides');
const startBtn = document.getElementById('startSurveyBtn');
const nextButtons = []; // used for dynamic slides (not needed statically)
const progressBar = document.getElementById('progressBar');
const finishBtn = document.getElementById('finishBtn');

let slides = []; // list of slide DOM nodes in order (intro + respondent + dynamic + final)
let currentIndex = 0;
let responses = []; // will store objects { slideId, answers... }

/* -------------------------
   Helper: create element with attrs
   ------------------------- */
function el(tag, attrs = {}, children = []) {
  const dom = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') dom.className = attrs[k];
    else if (k === 'html') dom.innerHTML = attrs[k];
    else dom.setAttribute(k, attrs[k]);
  }
  children.forEach(c => dom.appendChild(c));
  return dom;
}

/* -------------------------
   Build dynamic slides:
   Section 1: Cuisine slides (one slide per cuisine with 3 Qs)
   ------------------------- */
function buildCuisineSlides() {
  cuisineSlides = cuisines.map(c => {
    const container = el('div', { class: 'slide', id: `cuisine-${c.id}` });

    container.appendChild(el('h2', { html: `Look at this dish — ${c.label}` }));
    const img = el('img', { class: 'symbol', src: c.img, alt: c.label });
    container.appendChild(img);

    // Q1: Color association (color input)
    container.appendChild(el('label', { html: 'What color do you associate with this dish?' }));
    const colorInput = el('input', { type: 'color', id: `color-${c.id}` });
    container.appendChild(colorInput);

    // Q2: Which design style?
    container.appendChild(el('label', { html: 'Which design style do you most associate with this dish?' }));
    const styleSelect = el('select', { id: `style-${c.id}` });
    styleSelect.innerHTML = `
      <option value="">Select</option>
      <option value="cowboy">Cowboy</option>
      <option value="flag">Flag</option>
      <option value="rotulos">Rótulos</option>
      <option value="folklore">Folklore</option>
    `;
    container.appendChild(styleSelect);

    // Q3: Which icon/symbol?
    container.appendChild(el('label', { html: 'Which icon / symbol do you most associate with this dish?' }));
    const iconSelect = el('select', { id: `icon-${c.id}` });
    iconSelect.innerHTML = `
      <option value="">Select</option>
      <option value="cowboy-hat">Cowboy hat</option>
      <option value="eagle">Eagle</option>
      <option value="rotulo">Rótulo (hand-painted)</option>
      <option value="floral">Floral / folklore</option>
    `;
    container.appendChild(iconSelect);

    container.appendChild(el('div', {}, [
      (() => {
        const btn = el('button', { class: 'smallBtn' });
        btn.textContent = 'Next';
        btn.addEventListener('click', () => {
          // collect answers
          const data = {
            section: 'cuisine',
            cuisine: c.id,
            color: colorInput.value || null,
            style: styleSelect.value || null,
            icon: iconSelect.value || null
          };
          responses.push(data);
          goNext();
        });
        return btn;
      })()
    ]));

    return container;
  });

  cuisineSlides.forEach(s => dynamicSlidesEl.appendChild(s));
}

/* -------------------------
   Build Section 2: Icon slides (one slide per icon with 3 Qs)
   ------------------------- */
function buildIconSlides() {
  iconSlides = icons.map(ic => {
    const container = el('div', { class: 'slide', id: `icon-${ic.id}` });
    container.appendChild(el('h2', { html: `Look at this symbol — ${ic.label}` }));
    container.appendChild(el('img', { class: 'symbol', src: ic.img, alt: ic.label }));

    // Q1: cuisine association
    container.appendChild(el('label', { html: 'What type of cuisine do you most associate with this symbol?' }));
    const cuisineSel = el('select', { id: `iconCuisine-${ic.id}` });
    cuisineSel.innerHTML = `
      <option value="">Select</option>
      <option value="Mexican">Mexican</option>
      <option value="American">American</option>
      <option value="Italian">Italian</option>
      <option value="Chinese">Chinese</option>
      <option value="Indian">Indian</option>
      <option value="Other">Other</option>
    `;
    container.appendChild(cuisineSel);

    // Q2: geographic association
    container.appendChild(el('label', { html: 'What geographic location do you most associate with this symbol?' }));
    const geoSel = el('select', { id: `iconGeo-${ic.id}` });
    geoSel.innerHTML = `
      <option value="">Select</option>
      <option value="Mexico">Mexico</option>
      <option value="Southwest US">Southwest US</option>
      <option value="Central America">Central America</option>
      <option value="Europe">Europe</option>
      <option value="Asia">Asia</option>
      <option value="Not sure">Not sure</option>
    `;
    container.appendChild(geoSel);

    // Q3: mood/feeling (your choice A)
    container.appendChild(el('label', { html: 'What mood or feeling do you associate with this symbol?' }));
    const moodSel = el('select', { id: `iconMood-${ic.id}` });
    moodSel.innerHTML = `
      <option value="">Select</option>
      <option value="festive">Festive</option>
      <option value="rustic">Rustic</option>
      <option value="traditional">Traditional</option>
      <option value="formal">Formal</option>
      <option value="casual">Casual</option>
      <option value="energetic">Energetic</option>
    `;
    container.appendChild(moodSel);

    container.appendChild(el('div', {}, [
      (() => {
        const btn = el('button', { class: 'smallBtn' });
        btn.textContent = 'Next';
        btn.addEventListener('click', () => {
          responses.push({
            section: 'icon',
            icon: ic.id,
            cuisine: cuisineSel.value || null,
            geographic: geoSel.value || null,
            mood: moodSel.value || null
          });
          goNext();
        });
        return btn;
      })()
    ]));

    return container;
  });

  iconSlides.forEach(s => dynamicSlidesEl.appendChild(s));
}

/* -------------------------
   Build Section 3: Layered sign groups
   For each group we create a single "interactive" slide that progresses through layers
   and then pushes a follow-up slide for recognition + authenticity + free text.
   ------------------------- */
function buildLayeredSignSlides() {
  layeredSlides = layeredGroups.map(group => {
    // main interactive layering slide
    const container = el('div', { class: 'slide', id: `layer-${group.id}` });
    container.appendChild(el('h2', { html: `Is this a Mexican restaurant? — ${group.label}` }));

    const img = el('img', { class: 'symbol', id: `layerImg-${group.id}`, src: `${group.prefix}1.png`, alt: `${group.label} layer` });
    container.appendChild(img);

    // Yes/No buttons
    const btnWrap = el('div', { class: 'logo-buttons' });
    const yesBtn = el('button', { class: 'smallBtn', id: `yes-${group.id}` });
    yesBtn.textContent = 'Yes';
    const noBtn = el('button', { class: 'smallBtn', id: `no-${group.id}` });
    noBtn.textContent = 'No';
    btnWrap.appendChild(yesBtn);
    btnWrap.appendChild(noBtn);
    container.appendChild(btnWrap);

    const counter = el('div', { class: 'logo-count', id: `counter-${group.id}` , html: `Layer 1 of ${LAYERS_PER_GROUP}`});
    container.appendChild(counter);

    // store internal state on element
    container._layerIndex = 1;
    container._group = group;

    // behavior on click: advance layer (record yes/no)
    yesBtn.addEventListener('click', () => {
      // record the response for this layer
      responses.push({
        section: 'layering',
        group: group.id,
        layer: container._layerIndex,
        answer: 'Yes'
      });
      advanceLayer(container);
    });
    noBtn.addEventListener('click', () => {
      responses.push({
        section: 'layering',
        group: group.id,
        layer: container._layerIndex,
        answer: 'No'
      });
      advanceLayer(container);
    });

    return container;
  });

  // follow-up slides (one per group) after layers done
  layeredFollowUps = layeredGroups.map(group => {
    const cont = el('div', { class: 'slide', id: `layer-follow-${group.id}` });
    cont.appendChild(el('h2', { html: `About the ${group.label} sign` }));

    // Q: recognition (at what point does it look Mexican?) slider 1-10
    cont.appendChild(el('label', { html: 'At what point does this start to look like a Mexican restaurant? (1-10)' }));
    const recognition = el('input', { type: 'range', id: `recog-${group.id}`, min: 1, max: 10, value: 5 });
    cont.appendChild(recognition);

    // Q: authenticity slider
    cont.appendChild(el('label', { html: 'How authentic does this sign feel? (1-10)' }));
    const auth = el('input', { type: 'range', id: `auth-${group.id}`, min: 1, max: 10, value: 5 });
    cont.appendChild(auth);

    // Q: free association
    cont.appendChild(el('label', { html: 'What does this sign make you think of?' }));
    const free = el('input', { type: 'text', id: `free-${group.id}`, placeholder: 'Short answer...' });
    cont.appendChild(free);

    cont.appendChild(el('div', {}, [
      (() => {
        const btn = el('button', { class: 'smallBtn' });
        btn.textContent = 'Next';
        btn.addEventListener('click', () => {
          responses.push({
            section: 'layer-follow',
            group: group.id,
            recognition: recognition.value,
            authenticity: auth.value,
            freeAssociation: free.value || null
          });
          goNext();
        });
        return btn;
      })()
    ]));

    return cont;
  });

  // append to DOM in sequence: for each group: layering slide -> follow-up slide
  layeredSlides.forEach((slide, idx) => {
    dynamicSlidesEl.appendChild(slide);
    dynamicSlidesEl.appendChild(layeredFollowUps[idx]);
  });
}

/* -------------------------
   Advance layer helper
   ------------------------- */
function advanceLayer(layerSlideEl) {
  layerSlideEl._layerIndex++;
  if (layerSlideEl._layerIndex <= LAYERS_PER_GROUP) {
    // update image src and counter
    const imgEl = document.getElementById(`layerImg-${layerSlideEl._group.id}`);
    imgEl.src = `${layerSlideEl._group.prefix}${layerSlideEl._layerIndex}.png`;
    const counter = document.getElementById(`counter-${layerSlideEl._group.id}`);
    counter.textContent = `Layer ${layerSlideEl._layerIndex} of ${LAYERS_PER_GROUP}`;
  } else {
    // finished this group's layers -> move to next slide (which should be its follow-up)
    goNext();
  }
}

/* -------------------------
   Render all dynamic content
   ------------------------- */
function renderAllDynamic() {
  buildCuisineSlides();
  buildIconSlides();
  buildLayeredSignSlides();

  // after building, collect all slide nodes in order:
  const intro = document.getElementById('intro');
  const info = document.getElementById('respondentInfo');
  const final = document.getElementById('final');

  // slides order: intro, info, dynamicSlides children (as constructed), final
  slides = [intro, info, ...Array.from(dynamicSlidesEl.children), final];

  // set up initial display and progress
  slides.forEach(s => s.classList.remove('active'));
  currentIndex = 0;
  slides[currentIndex].classList.add('active');
  updateProgress();
}

/* -------------------------
   Navigation helpers
   ------------------------- */
function goNext() {
  // hide current
  slides[currentIndex].classList.remove('active');

  // increment
  currentIndex++;
  if (currentIndex >= slides.length) currentIndex = slides.length - 1;

  // show next
  slides[currentIndex].classList.add('active');
  updateProgress();
}

function updateProgress() {
  const pct = (currentIndex / (slides.length - 1)) * 100;
  progressBar.style.width = `${pct}%`;
}

/* -------------------------
   Wire up start & respondent "Next" button
   ------------------------- */
document.addEventListener('click', (e) => {
  // "Start" button
  if (e.target && e.target.id === 'startSurveyBtn') {
    // go to respondent info (index 1)
    goNext();
  }

  // respondent info "Next" button (class nextBtn)
  if (e.target && e.target.classList.contains('nextBtn')) {
    // collect respondent info
    const respondent = {
      age: document.getElementById('age').value || null,
      currentLocation: document.getElementById('currentLocation').value || null,
      grewUp: document.getElementById('grewUp').value || null,
      ethnicBackground: document.getElementById('ethnicBackground').value || null,
      eatOutFreq: document.getElementById('eatOutFreq').value || null,
      mostEatCuisine: document.getElementById('mostEatCuisine').value || null
    };
    // push respondent info once (only when at respondentInfo slide)
    if (slides[currentIndex] && slides[currentIndex].id === 'respondentInfo') {
      responses.push({ section: 'respondent', ...respondent });
    }
    goNext();
  }
});

/* -------------------------
   Send data to Google Sheets
   ------------------------- */
   async function submitToGoogleSheets(payload) {
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
  
      console.log("Data sent to Google Sheets!", payload);
      return true;
    } catch (err) {
      console.error("Error sending to Google Sheets:", err);
      return false;
    }
  }
  

/* -------------------------
   Finish button - now submits to Google Sheets AND downloads JSON backup
   ------------------------- */
   document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'finishBtn') {
  
      // include final comments
      const finalComments = document.getElementById('finalComments').value || null;
      responses.push({ section: 'finalComments', text: finalComments });
  
      // Send to Google Sheets
      const payload = {
        timestamp: new Date().toISOString(),
        responses: responses
      };
  
      await submitToGoogleSheets(payload);
  
      // Also download the JSON as backup for your records
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(responses, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', 'survey_responses.json');
      document.body.appendChild(a);
      a.click();
      a.remove();
  
      alert('Thank you! Your responses were submitted.');
  
      // Reset survey
      slides.forEach(s => s.classList.remove('active'));
      currentIndex = 0;
      slides[currentIndex].classList.add('active');
      updateProgress();
      responses = [];
    }
  });
  

/* -------------------------
   Initialize render
   ------------------------- */
renderAllDynamic();

