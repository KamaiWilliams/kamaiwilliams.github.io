
/**
 * TABLE VIEW - STUDENTS IMPLEMENT
 * Display data in sortable rows - good for scanning specific information
 */
function orNotListed(value) {
    return value === "------" || value === "N/A" || !value
      ? "Not listed"
      : value;
  }
  
  // Format the inspection date
  function formatDate(isoDate) {
    if (isoDate === "------" || isoDate === "N/A" || !isoDate) {
      return "Not listed";
    }
  
    return new Date(isoDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }
  
  function showTable(data) {
  
    const tableRows = data.map((inspection) => `
    <tr>
      <td>${orNotListed(inspection.name)}</td>
      <td>${orNotListed(inspection.category)}</td>
      <td>${orNotListed(inspection.city)}</td>
      <td>${formatDate(inspection.inspection_date)}</td>
      <td>${orNotListed(inspection.inspection_results)}</td>
    </tr>
  `).join("");

  return `
    <h2 class="view-title">📊 Table View</h2>

    <p class="view-description">
      Compare food safety inspection records across businesses.
    </p>

    <div class="table-container">
      <table class="restaurant-table">

        <caption>
          Prince George's County Food Safety Inspections
        </caption>

        <thead>
          <tr>
            <th scope="col">Business Name</th>
            <th scope="col">Business Type</th>
            <th scope="col">City</th>
            <th scope="col">Inspection Date</th>
            <th scope="col">Inspection Result</th>
          </tr>
        </thead>

        <tbody>
          ${tableRows}
        </tbody>

      </table>
    </div>
  `;
}

export default showTable;