// Tepuy Planner Calculator (Premium) – FIFO CGT, Share Units, and Property vs Shares logic

const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
const num = id => parseFloat($(id).value.replace(/,/g, "")) || 0;
const pct = id => num(id) / 100;

let chart;

function runPlanner() {
  const loanAmt = num("loanAmount");
  const dpPct = pct("downpayment");
  const costs = num("buyingCosts");
  const yrs = num("loanPeriod");
  const rLoan = pct("loanInterestRate");
  const ownPct = pct("owningCosts");
  const agentPct = pct("agentFees");
  const occ = pct("occupancyRate");
  const growProp = pct("propertyAppreciation");
  const rentYld = pct("rentalIncome");
  const rShares = pct("stockMarketAppreciation");
  const buildPct = pct("buildingComponent");
  const taxRate = pct("taxBracket");
  const yrsRet = num("yearsToRetirement");
  const salePct = pct("saleCostPct");
  const ageNow = num("currentAge");

  const lmiPct = dpPct >= 0.20 ? 0 : -(0.046 - 0.01) / (0.196 - 0.05) * dpPct + 0.058;
  const lmiAmt = Math.round(loanAmt * lmiPct / (1 + lmiPct));
  const price = Math.round(loanAmt / ((1 - dpPct) * (1 + lmiPct)));
  const cashUp = Math.round(dpPct * price + costs);
  const wkPay = (((rLoan / 12) * loanAmt * Math.pow(1 + rLoan / 12, yrs * 12)) /
    (Math.pow(1 + rLoan / 12, yrs * 12) - 1)) * 12 / 52;

  let propVal = price, sharesValue = cashUp, owed = loanAmt;
  const shareHistory = [];

  let totalUnits = cashUp; // $1/share in Year 0
  let unitsHeld = cashUp;
  let avgCost = 1;

  const labels = [], equityArr = [], sharesArr = [], rows = [];

  rows.push([
    "Year", "Prop Value", "Owed", "Equity", "Rental Income", "Ownership Costs", "Interest Paid",
    "CF Before Tax", "Depreciation", "Taxable Income", "Tax", "Net CF",
    "Capital Gain (Prop)", "CGT if Sold (Prop)", "Sale Cost (Prop)", "Net Profit (Property)",
    "Equalizing Value of Shares Added/Sold", "CGT from Shares Sold",
    "Cost Base of Units Sold", "Units Bought", "Units Sold", "Units Held", "Avg Unit Cost", "Value of Shares Owned"
  ]);

 	 	

  for (let y = 0; y <= yrsRet; y++) {
    const rent = y ? Math.round(propVal * rentYld * occ) : 0;
    const interest = y ? Math.round(owed * rLoan) : 0;
    if (y) propVal = Math.round(propVal * (1 + growProp));
    const ownCost = y ? Math.round(propVal * (ownPct + agentPct)) : 0;
    const depr = y ? Math.round(price * buildPct / 40) : 0;
    const amort = y ? Math.round(wkPay * 52 - interest) : 0;
    if (y) owed = Math.max(0, Math.round(owed * (1 + rLoan) - wkPay * 52));

    const equity = propVal - owed;
    const cfBeforeTax = rent - ownCost - interest;
    const taxableIncome = cfBeforeTax - depr;
    const tax = Math.round(taxableIncome * taxRate);
    const netCF = Math.round(cfBeforeTax - tax - amort);

    // Property side
    const propCapGain = y ? propVal - price : 0;
    const propCGT = y ? Math.round(Math.max(0, propCapGain * 0.5 * taxRate)) : 0;
    const saleCost = y ? Math.round(propVal * salePct) : 0;
    const netProfitProp = (y === yrsRet) ? equity - propCGT - saleCost : 0;

    // Shares logic
    let sharesAdj = 0;
    let cgtSharesSold = 0;
    let unitsBought = 0;
    let unitsSold = 0;
    let costBaseSold = 0;

    if (y) {
      sharesAdj = -netCF;

      if (sharesAdj < 0) {
        // Selling shares to cover property CF
        const sellAmount = -sharesAdj;
        let gain = 0;
        let amountToSell = sellAmount;
        const newHistory = [];

        for (const lot of shareHistory) {
          if (amountToSell <= 0) {
            newHistory.push(lot);
            continue;
          }
          const sellThis = Math.min(amountToSell, lot.value);
const unitPrice = sharesValue / unitsHeld;
const unitsToSell = sellAmount / unitPrice;

let unitsRemainingToSell = unitsToSell;

for (const lot of shareHistory) {
  if (unitsRemainingToSell <= 0) {
    newHistory.push(lot);
    continue;
  }

  const sellUnits = Math.min(unitsRemainingToSell, lot.units);
  const costPortion = lot.cost * (sellUnits / lot.units);
  costBaseSold += costPortion;
  unitsSold += sellUnits;

  gain += (sellUnits * unitPrice) - costPortion;
  unitsRemainingToSell -= sellUnits;

  const remainingUnits = lot.units - sellUnits;
  if (remainingUnits > 0) {
    newHistory.push({
      units: remainingUnits,
      cost: lot.cost * (remainingUnits / lot.units)
    });
  }
}


          gain += (sellThis - (lot.cost * (sellThis / lot.value)));
          amountToSell -= sellThis;

          if (sellThis < lot.value) {
            newHistory.push({
              value: lot.value - sellThis,
              cost: lot.cost
            });
          }
        }

        cgtSharesSold = gain > 0 ? Math.round(gain * 0.5 * taxRate) : 0;
        shareHistory.length = 0;
        shareHistory.push(...newHistory);
        unitsHeld -= unitsSold;
      } else {
        // Buying shares
        const unitPrice = sharesValue / unitsHeld;
        unitsBought = sharesAdj / unitPrice;
        unitsHeld += unitsBought;
        const costOfBuy = unitsBought * unitPrice;
        shareHistory.push({ units: unitsBought, cost: costOfBuy });

      }
    }

    // Shares value grows with return and trading
    sharesValue = y ? Math.round(sharesValue * (1 + rShares) + sharesAdj) : sharesValue;
    avgCost = unitsHeld ? sharesValue / unitsHeld : 0;


    labels.push(`Yr ${y}`);
    equityArr.push(equity);
    sharesArr.push(sharesValue);

    rows.push([
      y, propVal, owed, equity, rent, ownCost, interest,
      cfBeforeTax, depr, taxableIncome, tax, netCF,
      propCapGain, propCGT, saleCost, netProfitProp,
      sharesAdj, cgtSharesSold,
      Math.round(costBaseSold), Math.round(unitsBought), Math.round(unitsSold),
      Math.round(unitsHeld), avgCost.toFixed(1), sharesValue
    ]);


  }

  // Chart
  if (chart) chart.destroy();
  chart = new Chart($("plannerChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Property Equity",
          data: equityArr,
          borderColor: "#28a745",
          backgroundColor: "rgba(40,167,69,.15)",
          fill: true,
          tension: .35
        },
        {
          label: "Shares Value",
          data: sharesArr,
          borderColor: "#007bff",
          backgroundColor: "rgba(0,123,255,.15)",
          fill: true,
          tension: .35
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: { ticks: { callback: v => fmt(v) } },
        x: { ticks: { autoSkip: true, maxTicksLimit: 12 } }
      }
    }
  });

  // Table
  const htmlRows = rows.slice(1).map(r => `<tr>${r.map((c, i) => {
    const cls = [3, 24, 20].includes(i) ? ' class="highlight"' : "";
    return `<td${cls}>${fmt(c)}</td>`;
  }).join("")}</tr>`).join("");

  $("results").innerHTML = `<table class="results-table">
    <thead><tr>${rows[0].map((h, i) => {
      const cls = [3, 22].includes(i) ? ' class="highlight"' : "";
      return `<th${cls}>${h}</th>`;
    }).join("")}</tr></thead>
    <tbody>${htmlRows}</tbody>
  </table>`;
}

document.addEventListener("DOMContentLoaded", () => {
  $("runPlanner").addEventListener("click", runPlanner);
});
