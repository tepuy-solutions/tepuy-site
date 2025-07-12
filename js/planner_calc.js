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

  const lmiPct = dpPct >= 0.20 ? 0 : -(0.046 - 0.01) / (0.196 - 0.05) * dpPct + 0.058;
  const lmiAmt = Math.round(loanAmt * lmiPct / (1 + lmiPct));
  const price = Math.round(loanAmt / ((1 - dpPct) * (1 + lmiPct)));
  const cashUp = Math.round(dpPct * price + costs);
  const wkPay = (((rLoan / 12) * loanAmt * Math.pow(1 + rLoan / 12, yrs * 12)) /
    (Math.pow(1 + rLoan / 12, yrs * 12) - 1)) * 12 / 52;

  let propVal = price,
    shares = cashUp,
    owed = loanAmt;

  const labels = [], equityArr = [], sharesArr = [], rows = [];
  rows.push(["Year", "Prop Value", "Owed", "Equity", "Rent", "Own Costs", "Interest", "Depr.", "CashFlow Before Tax", "Taxable Income", "Tax", "Net CF", "Shares", "Cap Gain", "CGT if Sold"]);

  for (let y = 0; y <= yrsRet; y++) {
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

    if (y) shares = Math.round(shares * (1 + rShares) - netCF);

    const capGain = y ? propVal - price : 0;
    const cgt = y ? Math.round(Math.max(0, capGain * 0.5 * taxRate)) : 0;

    labels.push(`Yr ${y}`);
    equityArr.push(equity);
    sharesArr.push(shares);

    rows.push([
      y, propVal, owed, equity, rent, ownCost, interest, depr,
      cashFlowBeforeTax, taxableIncome, tax, netCF, shares, capGain, cgt
    ]);
  }

  if (chart) chart.destroy();
  chart = new Chart($("plannerChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Property Equity", data: equityArr,
          borderColor: "#28a745", backgroundColor: "rgba(40,167,69,.15)", fill: true, tension: .35 },
        { label: "Shares Value", data: sharesArr,
          borderColor: "#007bff", backgroundColor: "rgba(0,123,255,.15)", fill: true, tension: .35 }
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
    const cls = [3, 12].includes(i) ? ' class="highlight"' : "";
    return `<td${cls}>${fmt(c)}</td>`;
  }).join("")}</tr>`).join("");

  $("results").innerHTML = `<table class="results-table">
    <thead><tr>${rows[0].map((h, i) => {
      const cls = [3, 12].includes(i) ? ' class="highlight"' : "";
      return `<th${cls}>${h}</th>`;
    }).join("")}</tr></thead>
    <tbody>${htmlRows}</tbody>
  </table>`;
}

document.addEventListener("DOMContentLoaded", () => {
  $("runPlanner").addEventListener("click", runPlanner);
});
