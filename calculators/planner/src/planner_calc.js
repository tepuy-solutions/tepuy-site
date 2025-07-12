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
  const wkPay = (((rLoan / 12) * loanAmt * Math.pow(1 + rLoan / 12, yrs * 12)) / (Math.pow(1 + rLoan / 12, yrs * 12) - 1)) * 12 / 52;

  let propVal = price,
      owed = loanAmt,
      sharesOwned = 0,
      sharesValue = 0,
      parcels = [];

  const labels = [], equityArr = [], sharesArr = [], rows = [];

  rows.push([
    "Year", "Prop Value", "Owed", "Equity", "Rent", "Own Costs", "Interest", "Depr.",
    "CF Before Tax", "Taxable Income", "Tax", "Net CF",
    "Value of Shares Added/Reduced", "Total Value of Shares Owned", "Shares Owned",
    "CGT of shares sold", "Capital Gain", "CGT if Sold", "Sale Cost"
  ]);

  for (let y = 0; y <= yrsRet; y++) {
    const age = ageNow + y;
    const rent = y ? Math.round(propVal * rentYld * occ) : 0;
    const interest = y ? Math.round(owed * rLoan) : 0;
    if (y) propVal = Math.round(propVal * (1 + growProp));
    const ownCost = y ? Math.round(propVal * (ownPct + agentPct)) : 0;
    const depr = y ? Math.round(price * buildPct / 40) : 0;
    const amort = y ? Math.round(wkPay * 52 - interest) : 0;
    if (y) owed = Math.max(0, Math.round(owed * (1 + rLoan) - wkPay * 52));

    const equity = propVal - owed;
    const cashFlowBeforeTax = rent - ownCost - interest;
    const taxableIncome = cashFlowBeforeTax - depr;
    const tax = Math.round(taxableIncome * taxRate);
    const netCF = Math.round(cashFlowBeforeTax - tax - amort);

    let sharePrice = y === 0 ? 1 : sharePrice * (1 + rShares);
    let sharesTraded = 0;
    let valueTraded = 0;
    let cgtRealised = 0;
    let capitalGain = 0;

    // Growth
    sharesValue = Math.round(sharesValue * (1 + rShares));

    if (y === 0) {
      sharesOwned = Math.round(cashUp / sharePrice);
      valueTraded = sharesOwned * sharePrice;
      sharesValue = valueTraded;
      parcels.push({ qty: sharesOwned, price: sharePrice });
    } else if (netCF > 0) {
      const qty = Math.round(netCF / sharePrice);
      sharesOwned += qty;
      sharesValue += qty * sharePrice;
      parcels.push({ qty, price: sharePrice });
      sharesTraded = qty;
      valueTraded = qty * sharePrice;
    } else if (netCF < 0) {
      let toSell = Math.round(Math.abs(netCF) / sharePrice);
      sharesTraded = -toSell;
      valueTraded = -toSell * sharePrice;
      for (let i = 0; i < parcels.length && toSell > 0; i++) {
        const p = parcels[i];
        if (p.qty === 0) continue;
        const sellQty = Math.min(p.qty, toSell);
        p.qty -= sellQty;
        sharesOwned -= sellQty;
        toSell -= sellQty;
        const gain = (sharePrice - p.price) * sellQty;
        if (age < 60) {
          cgtRealised += Math.round(0.5 * gain * taxRate); // 50% discount for individuals
        }
      }
      sharesValue -= Math.abs(valueTraded);
    }

    // Unrealised CGT
    capitalGain = parcels.reduce((sum, p) =>
      sum + p.qty * (sharePrice - p.price), 0);
    const cgtIfSold = Math.round(0.5 * capitalGain * taxRate);
    const saleCost = y === yrsRet ? Math.round(propVal * salePct) : 0;

    labels.push(`Yr ${y}`);
    equityArr.push(equity);
    sharesArr.push(sharesValue);

    rows.push([
      y, propVal, owed, equity, rent, ownCost, interest, depr,
      cashFlowBeforeTax, taxableIncome, tax, netCF,
      valueTraded, sharesValue, sharesOwned,
      cgtRealised, capitalGain, cgtIfSold, saleCost
    ]);
  }

  if (chart) chart.destroy();
  chart = new Chart($("plannerChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Property Equity", data: equityArr, borderColor: "#28a745", backgroundColor: "rgba(40,167,69,.15)", fill: true, tension: .35 },
        { label: "Shares Value", data: sharesArr, borderColor: "#007bff", backgroundColor: "rgba(0,123,255,.15)", fill: true, tension: .35 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: { ticks: { callback: v => fmt(v) } },
        x: { ticks: { autoSkip: true, maxTicksLimit: 12 } }
      }
    }
  });

  const htmlRows = rows.slice(1).map(r => `<tr>${r.map((c, i) => {
    const cls = [3, 13].includes(i) ? ' class="highlight"' : "";
    return `<td${cls}>${fmt(c)}</td>`;
  }).join("")}</tr>`).join("");

  $("results").innerHTML = `<table class="results-table">
    <thead><tr>${rows[0].map((h, i) => {
      const cls = [3, 13].includes(i) ? ' class="highlight"' : "";
      return `<th${cls}>${h}</th>`;
    }).join("")}</tr></thead>
    <tbody>${htmlRows}</tbody>
  </table>`;
}

document.addEventListener("DOMContentLoaded", () => {
  $("runPlanner").addEventListener("click", runPlanner);
});
