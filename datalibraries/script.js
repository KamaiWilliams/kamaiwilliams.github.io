// ============================================
// TUTORIAL 7: YOUR DATA -> THE LIBRARY'S DATA
// Run this page with Live Server. TODO 1 is in index.html; TODOs 2-5 are below.
// ============================================
// Chart.js doesn't take your array of restaurants. Each kind of chart wants
// the data in its own shape. Most of the work is reshaping.

// Saved outside every function, so every button can use them
let restaurants = [];
let priceCounts = {};
let priceLabels = [];
let priceNumbers = [];

// ============================================
// TODO 1 is in index.html: add the <script> tag for Chart.js
// ============================================

// ============================================
// TODO 2: COUNT, THEN SPLIT INTO TWO LISTS
// Count the restaurants in each price range (as in Tutorial 6). Then split the
// counts into two lists that line up: the labels, and the numbers.
// ============================================

document.querySelector('#make-lists').addEventListener('click', () => {
  priceCounts = {};

  // YOUR CODE HERE
  // Hint: count into priceCounts with restaurants.forEach, exactly as in Tutorial 6
  // Hint: priceLabels = Object.keys(priceCounts);    gives ['$$', '$$$', ...]
  // Hint: priceNumbers = Object.values(priceCounts); gives [3, 2, ...]
  restaurants.forEach((restaurant) => {
    priceCounts[restaurant.priceRange] =
      (priceCounts[restaurant.priceRange] || 0) + 1;
  });
  
  priceLabels = Object.keys(priceCounts);
  priceNumbers = Object.values(priceCounts);

  showShape('#lists-output', `labels  = ${toText(priceLabels)}\nnumbers = ${toText(priceNumbers)}`);
  setButton('#draw-bar', true);
  setButton('#order-bars', true);
});

// ============================================
// TODO 3: A BAR CHART, AND A SENTENCE FOR PEOPLE WHO CAN'T SEE IT
// Give drawChart your settings: the type of chart, your two lists,
// a title, and a label on each axis. Then write one sentence that says
// what the chart shows.
// ============================================

document.querySelector('#draw-bar').addEventListener('click', () => {
  
  // YOUR CODE HERE

    drawChart('#bar-chart', {
      type: 'bar',
  
      data: {
        labels: priceLabels,
        datasets: [{
          label: 'Restaurants',
          data: priceNumbers
        }]
      },
  
      options: {
        plugins: { title: { display: true,
            text: 'Number of Restaurants by Price Range'  }  },
  
        scales: {
          x: { title: { display: true, text: 'Price Range'} },
  
          y: { title: { display: true, text: 'Number of Restaurants' },
           beginAtZero: true }
          }
      }
    });
  
    document.querySelector('#bar-summary').textContent =
      'number of restaurants in each price range. 3 for the $$ price range and 1 for thr $$$$ price range.';
    });
  // Hint: uncomment this, and replace each ??? with the right thing
  //
  // drawChart('#bar-chart', {
  //   type: '???',
  //   data: {
  //     labels: ???,
  //     datasets: [{ label: 'Restaurants', data: ??? }]
  //   },
  //   options: {
  //     plugins: { title: { display: true, text: '???' } },
  //     scales: {
  //       x: { title: { display: true, text: '???' } },
  //       y: { title: { display: true, text: '???' }, beginAtZero: true }
  //     }
  //   }
  // });
  //
  // Then write your sentence:
  // document.querySelector('#bar-summary').textContent = '...';
;

// ============================================
// TODO 4: PUT THE BARS IN ORDER
// The bars come out in the order each price first appears in the data.
// A reader expects cheapest to dearest. Instead of counting again, map() over
// the order you want, and look up each price's count in priceCounts.
// Then click "Draw the bar chart" again: you changed the data, so redraw it.
// ============================================

document.querySelector('#order-bars').addEventListener('click', () => {
  const priceOrder = ['$', '$$', '$$$', '$$$$'];

  // YOUR CODE HERE
  // Hint: priceLabels = priceOrder;
  // Hint: priceNumbers = priceOrder.map((price) => {
  //   return ???;   (look the price up in priceCounts)
  // });
priceLabels = priceOrder;
priceNumbers = priceOrder.map((price) => {
  return priceCounts[price] || 0;
});
  showShape('#order-output', `labels  = ${toText(priceLabels)}\nnumbers = ${toText(priceNumbers)}`);
});

// ============================================
// TODO 5: ONE POINT PER RESTAURANT
// A scatter chart wants one { x, y } object for each point. Use map() to turn
// each restaurant into a point: x is how many $ signs it has, y is its rating.
// Hint: '$$'.length is 2.
// ============================================

document.querySelector('#draw-scatter').addEventListener('click', () => {
  // YOUR CODE HERE
  // Hint: const points = restaurants.map((restaurant) => {
  //   return { x: ???, y: ??? };
  // });
  // Hint: showShape('#points-output', `points = ${toText(points)}`); lets you see what you made
  // Hint: then draw it like TODO 3, with type: 'scatter' and
  //       data: { datasets: [{ label: 'Restaurants', data: points }] }
  //       (a scatter chart has no labels list: each point carries its own x and y)
  // Hint: and write a sentence into #scatter-summary

  document.querySelector('#draw-scatter').addEventListener('click', () => {
    const points = restaurants.map((restaurant) => {
      return { x: restaurant.priceRange.length, y: restaurant.rating };
    });
  
    showShape('#points-output', `points = ${toText(points)}`);
  
    drawChart('#scatter-chart', {
      type: 'scatter',
       data: { datasets: [{ label: 'Restaurants', data: points }]
      },
  
      options: {
        plugins: {
        title: {
        display: true,
        text: 'Restaurant Ratings by Price Range' }
        },
  
      scales: {
        x: {
        title: {
        display: true,
        text: 'Price Range (Number of $ Signs)', },
        min: 0,
        max: 4,
        ticks: { stepSize: 1  }
        },
  
          y: {
          title: {
          display: true,
          text: 'Restaurant Rating' },
            min: 0,
            max: 5
          }
        }
      }
    });
  
    document.querySelector('#scatter-summary').textContent =
      'Each point represents one restaurant. The ones on the right have higher price ranges, and the points higher up on the chart have better ratings.';
  });
});

// ============================================
// HELPERS - PROVIDED, no need to change these
// ============================================

// Load the restaurants when the page opens (the async/await code from Tutorial 6)
async function loadRestaurants() {
  try {
    const response = await fetch('./restaurants.json');
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    restaurants = await response.json();
    setButton('#make-lists', true);
    setButton('#draw-scatter', true);
    showShape('#data-status', `Loaded ${restaurants.length} restaurants`);
  } catch (error) {
    console.error('Loading failed:', error);
    showShape('#data-status', 'Could not load the restaurants. Is Live Server running?');
  }
}

// Say whether Chart.js has loaded (TODO 1)
function showLibraryStatus() {
  const status = document.querySelector('#library-status');
  if (typeof Chart === 'undefined') {
    status.textContent = "Chart.js isn't loaded yet. Add its <script> tag to index.html (TODO 1).";
    status.className = 'library-status missing';
  } else {
    status.textContent = `Chart.js ${Chart.version} is loaded.`;
    status.className = 'library-status loaded';
  }
}

// Draw a chart into a <canvas>, replacing any chart already there
function drawChart(canvasSelector, settings) {
  if (typeof Chart === 'undefined') {
    showLibraryStatus();
    return;
  }
  const canvas = document.querySelector(canvasSelector);
  const existing = Chart.getChart(canvas);
  if (existing) {
    existing.destroy();
  }
  new Chart(canvas, settings);
}

// Write a list or value the way it looks in code
function toText(value) {
  if (Array.isArray(value)) {
    return `[${value.map(toText).join(', ')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    return `{ ${Object.keys(value).map((key) => `${key}: ${toText(value[key])}`).join(', ')} }`;
  }
  return typeof value === 'string' ? `'${value}'` : String(value);
}

function showShape(selector, text) {
  document.querySelector(selector).textContent = text;
}

function setButton(selector, enabled) {
  document.querySelector(selector).disabled = !enabled;
}

showLibraryStatus();
loadRestaurants();
