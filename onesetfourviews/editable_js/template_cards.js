
/**
 * CARD VIEW - PROVIDED AS EXAMPLE
 * Display each inspection as a card - good for browsing individual places
 */

// Turns "2026-05-17T00:00:00.000" into "May 17, 2026"
function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// This dataset writes missing values as "------" or "N/A". Show "Not listed" instead.
function orNotListed(value) {
  return value === '------' || value === 'N/A' || value === undefined ? 'Not listed' : value;
}

function showCards(data) {
  const cardHTML = data
    .map(
       /*html*/ 
      (inspection) => `
                <div class="restaurant-card">
                    <h3>${inspection.name}</h3>
                    <p><strong>Type:</strong> ${orNotListed(inspection.category)}</p>
                    <p><strong>Address:</strong> ${inspection.address_line_1}, ${inspection.city}</p>
                    <p><strong>Inspected:</strong> ${formatDate(inspection.inspection_date)}</p>
                    <p><strong>Result:</strong> ${orNotListed(inspection.inspection_results)}</p>
                </div>
            `
    )
    .join("");
     /*html*/ 
  return `
                <h2 class="view-title">🃏 Card View</h2>
                <p class="view-description">Browse inspections one place at a time</p>
                <div class="card-grid">
                    ${cardHTML}
                </div>
            `;
}

export default showCards;
