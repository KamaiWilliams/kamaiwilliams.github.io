/**
 * CATEGORY VIEW - STUDENTS IMPLEMENT
 * Group data by categories
 */

function countViolations(inspection) {
  const checks = Object.values(inspection).filter(
    value => value === "In Compliance" || value === "Out of Compliance"
  );

  const violations = checks.filter(
    value => value === "Out of Compliance"
  );

  return violations.length;
}

function showCategories(data) {
  const cities = {};

  data.forEach((inspection) => {


    const city =
      inspection.city && inspection.city !== "------"
        ? inspection.city
        : "Not listed";
    if (!cities[city]) {
      cities[city] = {
        count: 0,
        totalViolations: 0
      };
    }
    cities[city].count++;
    cities[city].totalViolations += countViolations(inspection);
  });

 
  const cityGroups = Object.entries(cities).map(
    ([city, stats]) => {
      return {
        city,
        count: stats.count,
        totalViolations: stats.totalViolations
      };
    }
  );

  
  cityGroups.sort((a, b) => b.count - a.count);

  const cityHTML = cityGroups.map((group) => `
    <section class="category-section">
      <div class="category-header">
        <h3>${group.city}</h3>
        <p>${group.count} inspections</p>
      </div>

      <div class="category-items">
        <div class="category-item">
          <strong>Total violations:</strong>
          ${group.totalViolations}
        </div>
      </div>
    </section>
  `).join("");


  return `
    <h2 class="view-title">City View</h2>

    <p class="view-description">
      Number of inspections and violations in each city.
    </p>

    <div class="categories-container">
      ${cityHTML}
    </div>
  `;
}

export default showCategories;