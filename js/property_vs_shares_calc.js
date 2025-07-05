function calculate() {
  const toNumber = val => parseFloat(val.replace(/[^0-9.-]+/g, '')) || 0;

  const loan = toNumber(document.getElementById("loanAmount").value);
  const dpPct = parseFloat(document.getElementById("downpayment").value) / 100;
  const buyingCosts = toNumber(document.getElementById("buyingCosts").value);
  const interest = parseFloat(document.getElementById("loanInterestRate").value) / 100;
  const loanYears = parseFloat(document.getElementById("loanPeriod").value);
  const owningCosts = parseFloat(document.getElementById("owningCosts").value) / 100;
  const agentFees = parseFloat(document.getElementById("agentFees").value) / 100;
  const occRate = parseFloat(document.getElementById("occupancyRate").value) / 100;
  const appreciation = parseFloat(document.getElementById("propertyAppreciation").value) / 100;
  const rentalYield = parseFloat(document.getElementById("rentalIncome").value) / 100;
  const stockReturn = parseFloat(document.getElementById("stockMarketAppreciation").value) / 100;
  const tax = parseFloat(document.getElementById("taxBracket").value) / 100;
  const years = parseInt(document.getElementById("yearsToRetirement").value);
  const buildingPct = parseFloat(document.getElementById("buildingComponent").value) / 100;

  const propVal = loan / (1 - dpPct);
  const lmiPct = dpPct < 0.2 ? 0.02 : 0;
  const lmiCost = propVal * lmiPct;
  const upfront = dpPct * propVal + buyingCosts + lmiCost;

  const yearlyPayment = (loan * interest * Math.pow(1 + interest, loanYears)) / (Math.pow(1 + interest, loanYears) - 1);
  const yearlyRental = propVal * rentalYield * occRate;
  const yearlyCost = propVal * owningCosts;
  const yearlyNet = yearlyRental - yearlyCost;

  const propertyValues = [], sharesValues = [], labels = [];
  let propBalance = propVal, sharesBalance = upfront;

  for (let i = 0; i <= years; i++) {
    labels.push("Year " + i);
    propertyValues.push(propBalance);
    sharesValues.push(sharesBalance);

    if (i < loanYears) {
      propBalance += yearlyNet;
    }

    propBalance *= (1 + appreciation);
    sharesBalance *= (1 + stockReturn);
  }

  document.getElementById("lmiPercentage").value = (lmiPct * 100).toFixed(1);
  document.getElementById("lmiAmount").value = lmiCost.toLocaleString();
  document.getElementById("buyPrice").value = propVal.toLocaleString();
  document.getElementById("totalCashUpfront").value = upfront.toLocaleString();
  document.getElementById("weeklyPayment").value = (yearlyPayment / 52).toFixed(2);

  // Chart
  const ctx = document.getElementById("investmentChart").getContext("2d");
  if (window.investChart) window.investChart.destroy();
  window.investChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Property Value',
          data: propertyValues,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Shares Value',
          data: sharesValues,
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          ticks: {
            callback: value => `$${value.toLocaleString()}`
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: $${ctx.formattedValue}`
          }
        }
      }
    }
  });
}
