// Format number with commas
function formatNumber(num) {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// Main calculate function
function calculate() {
  let loanAmount = parseInt(document.getElementById('loanAmount').value.replace(/,/g, ''));
  let downpayment = parseFloat(document.getElementById('downpayment').value) / 100;
  let buyingCosts = parseInt(document.getElementById('buyingCosts').value.replace(/,/g, ''));
  let loanPeriod = parseInt(document.getElementById('loanPeriod').value);
  let loanInterestRate = parseFloat(document.getElementById('loanInterestRate').value) / 100;
  let owningCosts = parseFloat(document.getElementById('owningCosts').value) / 100;
  let agentFees = parseFloat(document.getElementById('agentFees').value) / 100;
  let occupancyRate = parseFloat(document.getElementById('occupancyRate').value) / 100;
  let propertyAppreciation = parseFloat(document.getElementById('propertyAppreciation').value) / 100;
  let rentalIncome = parseFloat(document.getElementById('rentalIncome').value) / 100;
  let stockMarketAppreciation = parseFloat(document.getElementById('stockMarketAppreciation').value) / 100;
  let buildingComponent = parseFloat(document.getElementById('buildingComponent').value) / 100;
  let taxBracket = parseFloat(document.getElementById('taxBracket').value) / 100;
  let yearsToRetirement = parseInt(document.getElementById('yearsToRetirement').value);

  // LMI calculation
  let lmiPercentage = downpayment >= 0.2 ? 0 : -(0.046 - 0.01) / (0.196 - 0.05) * downpayment + 0.058;
  let lmiAmount = Math.round(loanAmount * lmiPercentage / (1 + lmiPercentage));

  let buyPrice = Math.round(loanAmount / ((1 - downpayment) * (1 + lmiPercentage)));
  let totalCashUpfront = Math.round((downpayment * buyPrice) + buyingCosts);

  // Mortgage payment
  let monthlyRate = loanInterestRate / 12;
  let numPayments = loanPeriod * 12;
  let weeklyPayment = (monthlyRate * loanAmount * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1) * 12 / 52;

  document.getElementById('lmiPercentage').value = (lmiPercentage * 100).toFixed(2);
  document.getElementById('lmiAmount').value = lmiAmount.toLocaleString();
  document.getElementById('buyPrice').value = buyPrice.toLocaleString();
  document.getElementById('totalCashUpfront').value = totalCashUpfront.toLocaleString();
  document.getElementById('weeklyPayment').value = weeklyPayment.toFixed(2);

  // Prepare Table + Chart
  let tableHTML = `
    <table><thead><tr>
      <th>Year</th><th>Property</th><th>Shares</th><th>Loan Owed</th><th>Equity</th>
      <th>Costs</th><th>Rent</th><th>Loan Interest</th><th>Depreciation</th><th>Amortization</th><th>Net Cash</th>
    </tr></thead><tbody>
  `;

  let labels = [], equityData = [], sharesData = [];

  let propertyValue = buyPrice;
  let sharesValue = totalCashUpfront;
  let capitalOwed = loanAmount;

  for (let year = 0; year <= loanPeriod; year++) {
    if (year > 0) {
      propertyValue = Math.round(propertyValue * (1 + propertyAppreciation));
    }

    let incomeRent = Math.round(propertyValue * rentalIncome * occupancyRate);
    let owningCostAmount = year > 0 ? Math.round(propertyValue * (owningCosts + agentFees)) : 0;
    let interestOnLoan = Math.round(capitalOwed * loanInterestRate);
    let depreciationPerYear = year > 0 ? Math.round((buyPrice * buildingComponent) / 40) : 0;

    let capitalAmortization = year > 0 ? Math.round(weeklyPayment * 52 - interestOnLoan) : 0;
    let equity = propertyValue - capitalOwed;

    let cashFlow = incomeRent - (owningCostAmount + interestOnLoan + depreciationPerYear);
    let netCashFlow = year > 0
      ? (cashFlow < 0 && year < yearsToRetirement)
        ? Math.round(cashFlow * (1 - taxBracket) - capitalAmortization)
        : Math.round(incomeRent - (owningCostAmount + interestOnLoan) - capitalAmortization)
      : 0;

    if (year > 0) {
      capitalOwed = Math.round(capitalOwed * (1 + loanInterestRate) - (weeklyPayment * 52));
      sharesValue = Math.round(sharesValue * (1 + stockMarketAppreciation) - netCashFlow);
    }

    // Add table row
    tableHTML += `<tr>
      <td>${year}</td>
      <td>${formatNumber(propertyValue)}</td>
      <td>${formatNumber(sharesValue)}</td>
      <td>${formatNumber(capitalOwed)}</td>
      <td>${formatNumber(equity)}</td>
      <td>${formatNumber(owningCostAmount)}</td>
      <td>${formatNumber(incomeRent)}</td>
      <td>${formatNumber(interestOnLoan)}</td>
      <td>${formatNumber(depreciationPerYear)}</td>
      <td>${formatNumber(capitalAmortization)}</td>
      <td>${formatNumber(netCashFlow)}</td>
    </tr>`;

    labels.push(`Year ${year}`);
    equityData.push(equity);
    sharesData.push(sharesValue);
  }

  tableHTML += `</tbody></table>`;
  document.querySelector('.table-container').innerHTML = tableHTML;

  // Chart rendering
  if (window.equitySharesChart) window.equitySharesChart.destroy();

  const ctx = document.getElementById('investmentChart').getContext('2d');
  window.equitySharesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Equity', data: equityData, borderColor: '#007bff', fill: false },
        { label: 'Shares', data: sharesData, borderColor: '#28a745', fill: false }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: '#333' }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Year' },
          ticks: { color: '#333' }
        },
        y: {
          title: { display: true, text: 'Value ($)' },
          ticks: {
            color: '#333',
            callback: formatNumber
          }
        }
      }
    }
  });
}
