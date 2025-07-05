function parseNumber(val) {
  return parseFloat(val.toString().replace(/,/g, '')) || 0;
}

function formatCurrency(value) {
  return '$' + value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function calculate() {
  const loanAmount = parseNumber(document.getElementById("loanAmount").value);
  const downpayment = parseNumber(document.getElementById("downpayment").value);
  const buyingCosts = parseNumber(document.getElementById("buyingCosts").value);
  const loanPeriod = parseNumber(document.getElementById("loanPeriod").value);
  const loanInterestRate = parseNumber(document.getElementById("loanInterestRate").value) / 100;
  const owningCosts = parseNumber(document.getElementById("owningCosts").value) / 100;
  const agentFees = parseNumber(document.getElementById("agentFees").value) / 100;
  const occupancyRate = parseNumber(document.getElementById("occupancyRate").value) / 100;
  const propertyAppreciation = parseNumber(document.getElementById("propertyAppreciation").value) / 100;
  const rentalIncome = parseNumber(document.getElementById("rentalIncome").value) / 100;
  const stockMarketAppreciation = parseNumber(document.getElementById("stockMarketAppreciation").value) / 100;
  const taxBracket = parseNumber(document.getElementById("taxBracket").value) / 100;
  const yearsToRetirement = parseNumber(document.getElementById("yearsToRetirement").value);
  const buildingComponent = parseNumber(document.getElementById("buildingComponent").value) / 100;

  const propertyValues = [];
  const shareValues = [];
  const years = [];

  let propertyValue = loanAmount / (1 - downpayment / 100);
  let sharesValue = loanAmount * downpayment / 100 + buyingCosts;

  const lmi = downpayment < 0.2 ? 0.01 : 0;
  const buyPrice = propertyValue;
  const totalCashUpfront = propertyValue * downpayment / 100 + buyingCosts + (buyPrice * lmi);
  const annualLoanPayment = loanAmount * loanInterestRate;
  const annualRent = propertyValue * rentalIncome * occupancyRate;
  const annualOwningCost = propertyValue * owningCosts;

  let loanRemaining = loanAmount;

  for (let year = 0; year <= yearsToRetirement; year++) {
    years.push(year);

    // Shares compound fully
    if (year > 0) {
      sharesValue = sharesValue * (1 + stockMarketAppreciation);
    }
    shareValues.push(sharesValue);

    // Property value grows
    if (year > 0) {
      propertyValue = propertyValue * (1 + propertyAppreciation);
    }

    // Net cash flow for property
    let rent = year > 0 ? propertyValue * rentalIncome * occupancyRate : 0;
    let interest = year > 0 && year <= loanPeriod ? loanRemaining * loanInterestRate : 0;
    let cost = year > 0 ? propertyValue * owningCosts : 0;
    let equityGain = 0;

    if (year <= loanPeriod && year > 0) {
      loanRemaining -= (annualLoanPayment - interest);
      if (loanRemaining < 0) loanRemaining = 0;
    }

    equityGain = propertyValue - loanRemaining;
    propertyValues.push(equityGain);
  }

  // Quick outputs
  document.getElementById("lmiPercentage").value = (lmi * 100).toFixed(2) + "%";
  document.getElementById("lmiAmount").value = formatCurrency(buyPrice * lmi);
  document.getElementById("buyPrice").value = formatCurrency(buyPrice);
  document.getElementById("totalCashUpfront").value = formatCurrency(totalCashUpfront);
  document.getElementById("weeklyPayment").value = formatCurrency(annualLoanPayment / 52);

  // Table
  const resultTable = document.getElementById("results");
  let html = "<table><thead><tr><th>Year</th><th>Equity in Property</th><th>Shares Value</th></tr></thead><tbody>";
  for (let i = 0; i <= yearsToRetirement; i++) {
    html += `<tr>
      <td>${years[i]}</td>
      <td>${formatCurrency(propertyValues[i])}</td>
      <td>${formatCurrency(shareValues[i])}</td>
    </tr>`;
  }
  html += "</tbody></table>";
  resultTable.innerHTML = html;

  // Chart
  const ctx = document.getElementById("investmentChart").getContext("2d");
  if (window.investmentChart) {
    window.investmentChart.destroy();
  }
  window.investmentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: "Property Equity",
          data: propertyValues,
          borderColor: "#4CAF50",
          backgroundColor: "rgba(76, 175, 80, 0.2)",
          fill: true,
        },
        {
          label: "Shares Value",
          data: shareValues,
          borderColor: "#1976D2",
          backgroundColor: "rgba(25, 118, 210, 0.2)",
          fill: true,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        tooltip: { mode: "index", intersect: false }
      },
      interaction: { mode: "nearest", axis: "x", intersect: false },
      scales: {
        x: {
          title: { display: true, text: "Years" }
        },
        y: {
          title: { display: true, text: "Value ($)" },
          beginAtZero: true
        }
      }
    }
  });
}
