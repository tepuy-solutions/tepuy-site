// Tepuy Planner Calculator (Premium) – FIFO CGT, Share Units, and Property vs Shares logic

const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
const num = id => parseFloat($(id).value.replace(/,/g, "")) || 0;
const pct = id => num(id) / 100;

let chart;

function calculatePlanner() {
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
  const saleTaxRate = parseFloat($("retireTaxBracket").value) / 100 || 0;
  const interestOnlyEnabled = $("interestOnlyToggle").checked;
  const interestOnlyYears = interestOnlyEnabled ? num("interestOnlyYears") : 0;


  const yrsRet = num("yearsToRetirement");
  const salePct = pct("saleCostPct");
  const ageNow = num("currentAge");

  const lmiPct = dpPct >= 0.20 ? 0 : -(0.046 - 0.01) / (0.196 - 0.05) * dpPct + 0.058;
  const lmiAmt = Math.round(loanAmt * lmiPct / (1 + lmiPct));
  const price = Math.round(loanAmt / ((1 - dpPct) * (1 + lmiPct)));
  const cashUp = Math.round(dpPct * price + costs);
  function calculateAnnualLoanPayment(P, rate, n) {
    return P * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
  }

  const actualRepaymentYears = yrs - interestOnlyYears;
  const annualRepayment = calculateAnnualLoanPayment(loanAmt, rLoan, actualRepaymentYears);
  const monthlyPayment = annualRepayment / 12;

  $("lmiOutput").textContent = fmt(lmiAmt);
  $("mortgageOutput").textContent = fmt(Math.round(monthlyPayment));
  $("buyPriceOutput").textContent = fmt(price);
  $("cashUpfrontOutput").textContent = fmt(cashUp);

  let propVal = price, sharesValue = cashUp, owed = loanAmt;
  const shareHistory = [];

  // Initial investment: $1/unit
  shareHistory.push({ units: cashUp, cost: cashUp });

  let unitsHeld = cashUp;
  let avgCost = 1;

  const labels = [], equityArr = [], sharesArr = [], rows = [];

  rows.push([
    "Year", "Prop Value", "Owed", "Equity", "Rental Income", "Ownership Costs", "Interest Paid", "Amortization",
    "CF Before Tax", "Depreciation", "Taxable Income", "Tax", "Net CF",
    "Capital Gain (Prop)", "CGT if Sold (Prop)", "Sale Cost (Prop)", "Net Cash if Property Sold",
    "Equalizing Value of Shares Added/Sold", "CGT from Shares Sold",
    "Cost Base of Units Sold", "Units Bought", "Units Sold", "Units Held",
    "Avg Unit Cost", "Value of Shares Owned",
    "Total Cost Base (Shares)", "Capital Gain if All Shares Sold", "CGT if All Shares Sold",
    "Net Cash if All Shares Sold"
  ]);

for (let y = 0; y <= yrsRet; y++) {
  const rent = y ? Math.round(propVal * rentYld * occ) : 0;
  if (y) propVal = Math.round(propVal * (1 + growProp));
  const ownCost = y ? Math.round(propVal * (ownPct + agentPct)) : 0;
  const depr = y ? Math.round(price * buildPct / 40) : 0;

  let amort = 0;
  let interest = 0;

  if (y && y <= interestOnlyYears) {
    interest = Math.round(owed * rLoan);   // Pay only interest
    // owed remains unchanged
  } else if (y) {
    interest = Math.round(owed * rLoan);
    owed = Math.max(0, Math.round(owed + interest - annualRepayment)); // accrue + repay
    amort = annualRepayment - interest; // portion that reduces debt
  }


    const equity = propVal - owed;
    const cfBeforeTax = rent - ownCost - interest;
    const taxableIncome = cfBeforeTax - depr;
    const tax = Math.round(taxableIncome * taxRate);
    const netCF = Math.round(cfBeforeTax - tax - amort);

    // Property side
    const adjustedCostBase = price - (depr * y);
    const propCapGain = y ? propVal - adjustedCostBase : 0;
    const propCGT = y ? Math.round(Math.max(0, propCapGain * 0.5 * saleTaxRate)) : 0;
    const saleCost = y ? Math.round(propVal * salePct) : 0;
    const netCashProp = propVal - owed - propCGT - saleCost;


    // Shares logic
    let sharesAdj = 0;
    let cgtSharesSold = 0;
    let unitsBought = 0;
    let unitsSold = 0;
    let costBaseSold = 0;

    if (y) {
      sharesAdj = -netCF;

      if (sharesAdj < 0) {
        const sellAmount = -sharesAdj;
        const unitPrice = sharesValue / unitsHeld;
        const unitsToSell = sellAmount / unitPrice;
        let unitsRemainingToSell = unitsToSell;
        let gain = 0;
        const newHistory = [];

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

        cgtSharesSold = gain > 0 ? Math.round(gain * 0.5 * saleTaxRate) : 0;
        shareHistory.length = 0;
        shareHistory.push(...newHistory);
        unitsHeld -= unitsSold;

      } else {
        const unitPrice = sharesValue / unitsHeld;
        unitsBought = sharesAdj / unitPrice;
        unitsHeld += unitsBought;
        const costOfBuy = unitsBought * unitPrice;
        shareHistory.push({ units: unitsBought, cost: costOfBuy });
      }
    }

    sharesValue = y ? Math.round(sharesValue * (1 + rShares) + sharesAdj) : sharesValue;
    avgCost = unitsHeld ? sharesValue / unitsHeld : 0;

    const totalCostBase = shareHistory.reduce((sum, lot) => sum + lot.cost, 0);
    const capitalGainShares = sharesValue - totalCostBase;
    const cgtIfAllSharesSold = capitalGainShares > 0 ? Math.round(capitalGainShares * 0.5 * saleTaxRate) : 0;

    labels.push(`Yr ${y}`);
    equityArr.push(equity);
    sharesArr.push(sharesValue);

    rows.push([
      y, propVal, owed, equity, rent, ownCost, interest, amort,
      cfBeforeTax, depr, taxableIncome, tax, netCF,
      propCapGain, propCGT, saleCost, netCashProp,
      sharesAdj, cgtSharesSold,
      Math.round(costBaseSold), Math.round(unitsBought), Math.round(unitsSold),
      Math.round(unitsHeld), avgCost.toFixed(2), sharesValue,
      Math.round(totalCostBase), Math.round(capitalGainShares), cgtIfAllSharesSold,
      Math.round(sharesValue - cgtIfAllSharesSold)
    ]);
  }

if (chart) chart.destroy();
const ctx = $("plannerChart");
const showNetCash = $("toggleNetCashChart").checked;

const y1 = showNetCash ? rows.slice(1).map(r => r[15]) : equityArr; // Net Cash Prop (col 15)
const y2 = showNetCash ? rows.slice(1).map(r => r[27]) : sharesArr; // Net Cash Shares (col 27)

const label1 = showNetCash ? "Net Cash in Property (if sold)" : "Equity in Property";
const label2 = showNetCash ? "Net Cash in Shares (if sold)" : "Value of Shares";

chart = createTepuyStyledChart(ctx, labels, y1, y2, label1, label2, 'Projection Year');



  const propertyCols = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
  const sharesCols = [16,17,18,19,20,21,22,23,24,25,26,27,28];

  const htmlRows = rows.slice(1).map(r => `<tr>${r.map((c, i) => {
    const cls = [3, 24].includes(i) ? ' highlight' : '';
    const colClass = propertyCols.includes(i) ? 'property' :
                     sharesCols.includes(i) ? 'shares' : '';
    return `<td class="${colClass}${cls}">${fmt(c)}</td>`;
  }).join("")}</tr>`).join("");

  $("results").innerHTML = `<table class="results-table">
    <thead><tr>${rows[0].map((h, i) => {
      const cls = [3, 24].includes(i) ? ' highlight' : '';
      const colClass = propertyCols.includes(i) ? 'property' :
                       sharesCols.includes(i) ? 'shares' : '';
      return `<th class="${colClass}${cls}">${h}</th>`;
    }).join("")}</tr></thead>
    <tbody>${htmlRows}</tbody>
  </table>`;
}

document.addEventListener("DOMContentLoaded", () => {
  $("runPlanner").addEventListener("click", calculatePlanner);
});

// === CSV Export ===
function exportPlannerCSV() {
  const rows = Array.from(document.querySelectorAll(".results-table tr")).map(row =>
    Array.from(row.querySelectorAll("th,td")).map(cell => cell.innerText.replace(/,/g, ""))
  );
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tepuy_planner.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// === Toggle Columns ===
const colStates = { property: true, shares: true };

function toggleCols(section) {
  const className = section === "property" ? "property" : "shares";
  const buttonId = section === "property" ? "toggleProp" : "toggleShares";
  const button = document.getElementById(buttonId);
  const cells = document.querySelectorAll(`.${className}`);

  colStates[section] = !colStates[section];
  const show = colStates[section];

  cells.forEach(td => {
    td.style.display = show ? "" : "none";
  });

  button.classList.toggle("inactive", !show);
}


