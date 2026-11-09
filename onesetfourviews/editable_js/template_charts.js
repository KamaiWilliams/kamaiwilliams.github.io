/**
 * CHARTS VIEW - STUDENTS IMPLEMENT
 * Show patterns in your data as charts, using Chart.js
 *
 * This view has two parts:
 *   showCharts(data) returns the HTML: one <canvas> per chart, with a text alternative under each
 *   drawCharts(data) runs after that HTML is on the page, and draws a chart into each <canvas>
 *
 * Chart.js docs: https://www.chartjs.org/docs/latest/getting-started/
 */
function showCharts(data) {
  return `
    <h2 class="view-title">📈 Charts View</h2>

    <p class="view-description">
      Patterns in the data at a glance
    </p>

    <div class="charts-grid">

      <figure class="chart-figure">
       <h3>Inspections and Violations by Restaurant Type</h3>
       <canvas id="chart-one" role="img"
       aria-label="Grouped bar chart comparing total inspections, critical violations, and non-compliant violations by restaurant type">
      </canvas>

<figcaption id="chart-one-summary" class="chart-summary">
  Compare total inspections and observed violations across restaurant types.
</figcaption>
      </figure>

      <figure class="chart-figure">
        <h3>Inspection Results</h3>
        <canvas id="chart-two" role="img"
          aria-label="Pie chart showing the distribution of food safety inspection results">
        </canvas>
        <figcaption id="chart-two-summary" class="chart-summary">
          Distribution of food safety inspection results.
        </figcaption>
      </figure>

    </div>
  `;
}


function drawCharts(data) {

  if (typeof Chart === "undefined") {
    document.querySelector(".charts-grid").innerHTML =
      '<p class="error">Chart.js did not load. Check the script tag in index.html.</p>';
    return;
  }
  // TODO 1: Reshape your data for the first chart.
  // Chart.js doesn't take your array of records.
  // It wants a list of labels and a matching list of numbers.
  // Example: count inspections by type of business.
  //
  //   const counts = {};
  //   data.forEach((item) => {
  //     counts[item.category] = (counts[item.category] || 0) + 1;
  //   });
  //   const labels = Object.keys(counts);
  //   const numbers = Object.values(counts);


  // Create an object to store counts for each restaurant type
  const categoryCounts = {};

  // Go through every inspection
  data.forEach((inspection) => {

    const category =
      inspection.category &&
      inspection.category !== "------" &&
      inspection.category !== "N/A"
        ? inspection.category
        : "Not listed";

    // Create a new category if it does not exist yet
    if (!categoryCounts[category]) {
      categoryCounts[category] = {
        inspections: 0,
        critical: 0,
        nonCompliant: 0
      };
    }

    // Count all inspections
    categoryCounts[category].inspections++;

    // Count critical violations
    if (inspection.inspection_results === "Critical Violations Observed") {
      categoryCounts[category].critical++;
    }

    // Count non-compliant violations
    if (inspection.inspection_results === "Non-Compliant - Violations Observed") {
      categoryCounts[category].nonCompliant++;
    }

  });

  // Get the restaurant type names
  const categoryLabels = Object.keys(categoryCounts);

  // Get the inspection counts for each restaurant type
  const inspectionValues = categoryLabels.map(
    category => categoryCounts[category].inspections
  );

  // Get critical violation counts for each restaurant type
  const criticalValues = categoryLabels.map(
    category => categoryCounts[category].critical
  );

  // Get non-compliant violation counts for each restaurant type
  const nonCompliantValues = categoryLabels.map(
    category => categoryCounts[category].nonCompliant
  );

  // Find the canvas for the bar chart
  const categoryCanvas = document.getElementById("chart-one");

  // Remove an earlier chart if one exists
  const oldCategoryChart = Chart.getChart(categoryCanvas);

  if (oldCategoryChart) {
    oldCategoryChart.destroy();
  }

  // Draw the grouped bar chart
  new Chart(categoryCanvas, {
    type: "bar",

    data: {
      labels: categoryLabels,

      datasets: [
        {
          label: "Total Inspections",
          data: inspectionValues,
          backgroundColor: "#3979B8"
        },
        {
          label: "Critical Violations Observed",
          data: criticalValues,
          backgroundColor: "#D94A45"
        },
        {
          label: "Non-Compliant - Violations Observed",
          data: nonCompliantValues,
          backgroundColor: "#E87524"
        }
      ]
    },

    options: {
      responsive: true,

      plugins: {
        title: {
          display: true,
          text: "Inspections and Violations by Restaurant Type"
        },
        legend: {
          display: true,
          position: "top"
        }
      },

      scales: {
        x: {
          title: {
            display: true,
            text: "Restaurant Type"
          }
        },

        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Number of Records"
          },
          ticks: {
            precision: 0
          }
        }
      }
    }
  });

  // Update the text underneath the chart
  document.getElementById("chart-one-summary").textContent =
    "Compare total inspections, critical violations, and non-compliant violations across restaurant types.";

  // TODO 2: Draw the first chart into <canvas id="chart-one">.
  // Every chart needs a title, and every axis needs a label.
  //
  //   new Chart(document.querySelector('#chart-one'), {
  //     type: 'bar',
  //     data: {
  //       labels: labels,
  //       datasets: [{ label: 'Number of inspections', data: numbers }]
  //     },
  //     options: {
  //       plugins: { title: { display: true, text: 'Inspections by type of business' } },
  //       scales: {
  //         x: { title: { display: true, text: 'Type of business' } },
  //         y: { title: { display: true, text: 'Inspections' }, beginAtZero: true }
  //       }
  //     }
  //   });

  // TODO 3: Reshape your data again, and draw a second chart of a DIFFERENT type
  // (pie, line, scatter...) into <canvas id="chart-two">, answering a different question.
  // Ideas: inspection results as a pie, inspections per month as a line,
  // or how many "Out of Compliance" checks each type of business averages.

  const resultCounts = {};


  data.forEach((inspection) => {
    const result =
      inspection.inspection_results &&
      inspection.inspection_results !== "------" &&
      inspection.inspection_results !== "N/A"
        ? inspection.inspection_results
        : "Not listed";

    if (!resultCounts[result]) {
      resultCounts[result] = 0;
    }

    resultCounts[result]++;
  });


  const resultLabels = Object.keys(resultCounts);
  const resultValues = Object.values(resultCounts);

  const topResult = Object.entries(resultCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const resultsCanvas = document.getElementById("chart-two");
  const oldResultsChart = Chart.getChart(resultsCanvas);
  if (oldResultsChart) {
    oldResultsChart.destroy();
  }


  new Chart(resultsCanvas, {
    type: "pie",

    data: {
    labels: resultLabels,

      datasets: [{
      label: "Inspection Results",
      data: resultValues
      }]
    },

    options: {
      responsive: true,

      plugins: {
        title: {
        display: true,
        text: "Distribution of Inspection Results"
        }
      }
    }
  });


  document.getElementById("city-chart-summary").textContent =
    `${topCity[0]} has the most inspection records, with ${topCity[1]} inspections.`;

  document.getElementById("results-chart-summary").textContent =
    `${topResult[0]} is the most common inspection result, with ${topResult[1]} records.`;
}
export { showCharts, drawCharts };