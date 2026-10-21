// ============================================
// TUTORIAL 6: FROM CALLBACKS TO FETCH TO ASYNC/AWAIT
// Run this page with Live Server. Fill in the four TODOs.
// ============================================

// The restaurants live OUT HERE, outside every function.
// Loading happens later, inside a callback or an async function. Saving the data
// out here is how the count button can use it once it arrives.
let restaurants = [];

// ============================================
// TODO 1: A CALLBACK THAT RUNS LATER
// When the button is clicked, use setTimeout to write "Ready!" into #ready-output
// after 2 seconds. Predict first: which reaches the log first, "Waiting..." or "Ready!"?
// My prediction: waiting will show up first since theres no 2 sec delay 
// but the ready has a delay on is function
// ============================================

document.querySelector('#run-todo-1').addEventListener('click', () => {
  startLog('#log-todo-1');

  // YOUR CODE HERE
  // Hint: setTimeout(() => { ...write 'Ready!' to the page, and log('#log-todo-1', 'Ready!') }, 2000);

            setTimeout(() => {
              document.querySelector('#ready-output').textContent = 'Ready!';
              log('#log-todo-1', 'Ready!');
            }, 2000);
          
   
  log('#log-todo-1', 'Waiting...');
});

// ============================================
// TODO 2: FETCH WITH .then()
// Load ./restaurants.json with fetch() and two .then() callbacks:
// the first turns the response into JSON, the second saves the data
// into restaurants and logs how many arrived.
// ============================================

document.querySelector('#load-then').addEventListener('click', () => {
  startLog('#log-then');

  // YOUR CODE HERE
  // Hint:
  
  fetch('./restaurants.json')
  .then((response) => response.json())
  .then((data) => {
    restaurants = data;
    log('#log-then', `The callback got ${restaurants.length} restaurants`);
    setCountButton(true);
  });

  //     ...save data into restaurants, log how many arrived, and call setCountButton(true)
  //   });
  log('#log-then', 'This line comes after fetch() in the code');
});

// ============================================
// TODO 3: THE SAME LOAD WITH ASYNC/AWAIT
// Show a loading message, load ./restaurants.json with await, check it worked,
// save it, and show how many loaded. If anything fails, show a friendly error.
// ============================================

document.querySelector('#load-await').addEventListener('click', async () => {
  // YOUR CODE HERE
  // Hint: 
  showStatus('loading', 'Loading restaurants...');
  try {
    const response = await fetch('./restaurants.json');

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    restaurants = data;

    showStatus('success', `Loaded ${restaurants.length} restaurants`);
    setCountButton(true);

  } catch (error) {
    console.error('Could not load restaurants:', error);
    showStatus(
      'error',
      'Could not load restaurants. Check that restaurants.json exists and try again.'
    );
  }
});

// ============================================
// TODO 4: COUNT BY PRICE RANGE
// Count the restaurants in each price range (the priceRange field) into the
// counts object, so it looks like { '$$': 3, '$$$': 2, ... }.
// Tutorial 7 turns this count into a chart.
// ============================================

document.querySelector('#count-by-price').addEventListener('click', () => {
  const counts = {};

  // YOUR CODE HERE
  // Hint: 
  
  restaurants.forEach((restaurant) => {
    counts[restaurant.priceRange] = (counts[restaurant.priceRange] || 0) + 1;
  });
  showCountTable('#count-output', counts);
});

// ============================================
// HELPERS - PROVIDED, no need to change these
// ============================================

// Each log keeps its own clock, so two demos running at once don't mix up their times
const logStarts = {};

// Empty a log and start its clock at 0
function startLog(selector) {
  logStarts[selector] = performance.now();
  document.querySelector(selector).innerHTML = '';
}

// Add a line to a log, with the time since its button was clicked
function log(selector, text) {
  const line = document.createElement('li');
  line.innerHTML = `<span class="log-time">+${Math.round(performance.now() - logStarts[selector])} ms</span> `;
  line.append(text);
  document.querySelector(selector).append(line);
}

// Show the loading / success / error message for TODO 3
function showStatus(state, message) {
  const status = document.querySelector('#loading-status');
  status.classList.remove('loading', 'success', 'error');
  status.classList.add(state);
  status.querySelector('.status-message').textContent = message;
}

// Switch the TODO 4 button on or off
function setCountButton(enabled) {
  document.querySelector('#count-by-price').disabled = !enabled;
}

// Show a counts object as a table, biggest first
function showCountTable(selector, counts) {
  const rows = Object.keys(counts)
    .sort((a, b) => counts[b] - counts[a])
    .map((key) => `<tr><th scope="row">${key}</th><td>${counts[key]}</td></tr>`)
    .join('');
  document.querySelector(selector).innerHTML = `
    <table class="count-table">
      <caption>Restaurants by price range</caption>
      <thead><tr><th scope="col">Price range</th><th scope="col">Restaurants</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}
