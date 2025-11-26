/* Survey prototype logic
   - dynamic slide generator for Section 1 & 2
   - layered sign groups for Section 3 (manual click-through)
   - progress bar and basic response aggregation (client-side)
*/

// -------------------
// Google Sheets Submission
// -------------------
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby0u_qFcaq52Gx1JlbUu7IOrVra5u03sfnU1qEVYzo_hgUAEUfgnVhKo3avVlNJ8m5auw/exec";


// Survey rebuilt to the updated content you provided
// Put the images in /images/ with exact filenames as specified in the conversation

/* --------------------------
   Config / filenames
   -------------------------- */
   const fontFiles = ['font8.png','font9.png','font10.png','font11.png','font12.png','font13.png','font14.png']; // slides 8-14
   const symbolFiles = [];
   for(let i=15;i<=26;i++) symbolFiles.push(`symbol${i}.png`); // slides 15-26
   
   const layeredGroups = [
     { id:'cowboy', label:'Cowboy', prefix:'images/cowboy' },    // cowboy1..10.png
     { id:'folklore', label:'Folklore', prefix:'images/folklore' },
     { id:'rotulos', label:'Rotulos', prefix:'images/rotulos' },
     { id:'flag', label:'Flag', prefix:'images/flag' }
   ];
   const LAYERS = 10;
   
   /* --------------------------
      DOM helpers & state
      -------------------------- */
   const slides = Array.from(document.querySelectorAll('.slide'));
   const startBtn = document.getElementById('startBtn');
   const progressBar = document.getElementById('progressBar');
   const fontsContainer = document.getElementById('fonts-container');
   const symbolsContainer = document.getElementById('symbols-container');
   const layeredContainer = document.getElementById('layered-container');
   const responses = []; // push objects per slide
   
   let currentIndex = 0;
   
   /* --------------------------
      Navigation helpers
      -------------------------- */
   function showSlideByIndex(i){
     slides.forEach(s => s.classList.remove('active'));
     if(i<0) i=0;
     if(i>=slides.length) i=slides.length-1;
     slides[i].classList.add('active');
     currentIndex = i;
     updateProgress();
   }
   function goNext(){ showSlideByIndex(currentIndex+1); }
   function goBack(){ showSlideByIndex(currentIndex-1); }
   function updateProgress(){
     const pct = (currentIndex / (slides.length - 1)) * 100;
     progressBar.style.width = `${pct}%`;
   }
   
   /* --------------------------
      Wire basic nav buttons
      -------------------------- */
   document.addEventListener('click', (e) => {
     const t = e.target;
     if(t.id === 'startBtn'){ goNext(); return; }
     if(t.classList.contains('navBtn')){
       const action = t.getAttribute('data-action');
       if(action === 'next') goNext();
       if(action === 'back') goBack();
     }
   });
   
   /* --------------------------
      Build color swatches (a generic palette)
      -------------------------- */
   const palette = [
     '#b91c1c','#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#16a34a','#0ea5a4',
     '#06b6d4','#3b82f6','#6366f1','#8b5cf6','#ec4899','#db2777','#7c3aed','#6b7280'
   ];
   
   function initSwatches(){
     document.querySelectorAll('.swatches').forEach(container => {
       const name = container.dataset.name;
       palette.forEach(color => {
         const sw = document.createElement('div');
         sw.className = 'swatch';
         sw.style.background = color;
         sw.dataset.color = color;
         // selection toggle up to 3
         sw.addEventListener('click', () => {
           const selected = container.querySelectorAll('.swatch.selected').length;
           if(sw.classList.contains('selected')) {
             sw.classList.remove('selected');
           } else {
             if(selected >= 3) {
               // flash to indicate limit
               sw.style.transform = 'scale(0.98)';
               setTimeout(()=> sw.style.transform = '');
               return;
             }
             sw.classList.add('selected');
           }
         });
         container.appendChild(sw);
       });
     });
   }
   
   /* --------------------------
      Build font slides (8-14)
      -------------------------- */
   function buildFontSlides(){
     fontFiles.forEach((fn, idx) => {
       const slide = document.createElement('div');
       slide.className = 'slide';
       slide.id = `font-${idx+8}`; // font8..font14
       const label = document.createElement('h2');
       label.textContent = `Formal Association Section: Font`;
       slide.appendChild(label);
   
       const preview = document.createElement('div');
       preview.className = 'font-preview';
       preview.innerHTML = `<img src="images/${fn}" alt="font preview" style="max-width:100%;height:auto;display:block;margin:0 auto;">`;
       slide.appendChild(preview);
   
       const q = document.createElement('p');
       q.textContent = 'Which cuisine is best representative of this font? (pick up to 3)';
       slide.appendChild(q);
   
       const list = document.createElement('div');
       list.className = 'checkbox-list';
       const cuisines = ["Italian","Chinese","Indian","Mexican","Korean","Pakistani","French","Thai","Greek","Puerto Rican","Dominican","Brazilian"];
       cuisines.forEach(c => {
         const item = document.createElement('label');
         item.className = 'checkbox-item';
         item.innerHTML = `<input type="checkbox" name="font-${idx}" value="${c}"> <span>${c}</span>`;
         list.appendChild(item);
       });
       slide.appendChild(list);
   
       const controls = document.createElement('div');
       controls.className = 'controls';
       const btnNext = document.createElement('button'); btnNext.textContent = 'Next';
       const btnBack = document.createElement('button'); btnBack.textContent = 'Back';
       btnBack.className = 'navBtn'; btnBack.setAttribute('data-action','back');
       btnNext.addEventListener('click', () => {
         // collect up to 3 selections
         const checked = Array.from(list.querySelectorAll('input:checked')).map(i=>i.value).slice(0,3);
         responses.push({ section:'font', file:fn, selections:checked });
         goNext();
       });
       controls.appendChild(btnBack); controls.appendChild(btnNext);
       slide.appendChild(controls);
   
       fontsContainer.appendChild(slide);
     });
   }
   
   /* --------------------------
      Build symbol slides (15-26)
      -------------------------- */
   function buildSymbolSlides(){
     symbolFiles.forEach((fn, idx) => {
       const slide = document.createElement('div');
       slide.className = 'slide';
       slide.id = `symbol-${15+idx}`;
       slide.innerHTML = `<h2>Formal Association Section: Symbol</h2>`;
       const img = document.createElement('img');
       img.src = `images/${fn}`;
       img.alt = fn;
       img.className = 'symbol-img';
       slide.appendChild(img);
   
       const q = document.createElement('p');
       q.textContent = 'Which cuisine is best representative of this symbol? (pick up to 3)';
       slide.appendChild(q);
   
       const list = document.createElement('div');
       list.className = 'checkbox-list';
       const cuisines = ["Italian","Chinese","Indian","Mexican","Korean","Pakistani","French","Thai","Greek","Puerto Rican","Dominican","Brazilian"];
       cuisines.forEach(c => {
         const item = document.createElement('label');
         item.className = 'checkbox-item';
         item.innerHTML = `<input type="checkbox" name="symbol-${idx}" value="${c}"> <span>${c}</span>`;
         list.appendChild(item);
       });
       slide.appendChild(list);
   
       const controls = document.createElement('div');
       controls.className = 'controls';
       const btnNext = document.createElement('button'); btnNext.textContent = 'Next';
       const btnBack = document.createElement('button'); btnBack.textContent = 'Back';
       btnBack.className = 'navBtn'; btnBack.setAttribute('data-action','back');
       btnNext.addEventListener('click', () => {
         const checked = Array.from(list.querySelectorAll('input:checked')).map(i=>i.value).slice(0,3);
         responses.push({ section:'symbol', file:fn, selections:checked });
         goNext();
       });
       controls.appendChild(btnBack); controls.appendChild(btnNext);
       slide.appendChild(controls);
   
       symbolsContainer.appendChild(slide);
     });
   }
   
   /* --------------------------
      Build layered sign slides (for each group)
      - each group has a slide that shows layer images; Next advances image; Stop records current image index and moves on
      - after the 10 layers for that group we show a follow-up slide asking recognition/authenticity/free text (we'll reuse the follow-up used earlier)
      -------------------------- */
   function buildLayeredSlides(){
     layeredGroups.forEach(group => {
       // main layering slide
       const main = document.createElement('div');
       main.className = 'slide';
       main.id = `layering-${group.id}`;
       main.innerHTML = `<h2>Does this sign look like it belongs to a Mexican restaurant? — ${group.label}</h2>`;
       const img = document.createElement('img');
       img.className = 'symbol-img';
       img.id = `img-${group.id}`;
       img.src = `${group.prefix}1.png`;
       main.appendChild(img);
   
       const btnWrap = document.createElement('div');
       btnWrap.className = 'logo-buttons';
       const btnNext = document.createElement('button'); btnNext.textContent = 'Next (show next layer)';
       const btnStop = document.createElement('button'); btnStop.textContent = 'Stop (submit this layer)';
       btnWrap.appendChild(btnStop); btnWrap.appendChild(btnNext);
       main.appendChild(btnWrap);
   
       const counter = document.createElement('div');
       counter.className = 'logo-count';
       counter.id = `counter-${group.id}`;
       counter.textContent = `Layer 1 of ${LAYERS}`;
       main.appendChild(counter);
   
       // internal state
       main._layer = 1;
       main._group = group.id;
   
       // behavior
       btnNext.addEventListener('click', () => {
         if(main._layer < LAYERS){
           main._layer++;
           img.src = `${group.prefix}${main._layer}.png`;
           counter.textContent = `Layer ${main._layer} of ${LAYERS}`;
         } else {
           // if last layer, advance to follow-up slide automatically
           responses.push({ section:'layering-summary', group:group.id, stoppedAt:LAYERS, note:'completed all layers' });
           goNext();
         }
       });
   
       btnStop.addEventListener('click', () => {
         // record the layer index where user stopped
         responses.push({ section:'layering-summary', group:group.id, stoppedAt: main._layer });
         // go to follow-up slide immediately (we create it next in same flow)
         goNext();
       });
   
       layeredContainer.appendChild(main);
   
     });
   }
   
   /* small helper for labels */
   function createLabelEl(text){
     const l = document.createElement('label');
     l.textContent = text;
     return l;
   }
   
   /* --------------------------
      Finalize: render dynamic slides into main slides list
      -------------------------- */
   function finalizeSlides(){
     // rebuild slides array (slides are nodes with class .slide)
     const all = Array.from(document.querySelectorAll('.slide'));
     // ensure we put the dynamic fonts, symbols and layering in the right place:
     // fontsContainer and symbolsContainer have appended slides; layeredContainer has appended slides already.
     // just re-calc slides order as DOM order:
     const ordered = Array.from(document.querySelectorAll('.container .slide'));
     // update global slides array
     while(slides.length) slides.pop();
     ordered.forEach(s => slides.push(s));
     // show first
     showSlideByIndex(0);
   }
   
   /* --------------------------
      Collect respondent data from slide 2 before moving on
      -------------------------- */
   document.addEventListener('click', (e)=>{
     const t = e.target;
     if(t.classList.contains('navBtn') && t.getAttribute('data-action') === 'next') {
       // if current is respondent slide, collect
       const active = slides[currentIndex];

       if(active && active.id === 'slide-personal'){
        responses.push({
          section: 'personal',
          age: document.getElementById('r_age').value || null,
          location: document.getElementById('r_location').value || null,
          hometown: document.getElementById('r_hometown').value || null,
          ethnicity: document.getElementById('r_ethnicity').value || null
        });
      }
      
       if(active && active.id === 'slide-respondent'){
         const eat = document.getElementById('r_eatout').value || null;
         const most = document.getElementById('r_mostcuisine').value || null;
         responses.push({ section:'respondent', eatOutFreq: eat, mostEatCuisine: most });
       }
     }
   });
   
   /* --------------------------
      Build everything and initialize
      -------------------------- */
   function init(){
     initSwatches();
     buildFontSlides();
     buildSymbolSlides();
     buildLayeredSlides();
     // small pause then finalize so DOM is updated
     setTimeout(finalizeSlides, 60);
   }
   init();
   
   /* --------------------------
      Finish button: save JSON locally (and console.log)
      (If you want Google Sheets POSTing, we can add the fetch to your webapp here)
      -------------------------- */
   document.getElementById('finishBtn').addEventListener('click', ()=>{
     // append final comments
     const finalText = document.getElementById('finalComments').value || '';
     responses.push({ section:'finalComments', text: finalText });
   
     // download JSON
     const blob = new Blob([JSON.stringify(responses, null, 2)], {type:'application/json'});
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url; a.download = 'survey_responses.json';
     a.click();
     URL.revokeObjectURL(url);
   
     console.log('Responses:', responses);
     alert('Thanks! Your responses were saved locally. (You can also wire this to Google Sheets if you want.)');
   
     // reset (go to intro)
     showSlideByIndex(0);
     // clear responses
     responses.length = 0;
   });   