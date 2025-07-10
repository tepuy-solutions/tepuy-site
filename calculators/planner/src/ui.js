// ui.js — Full detail logic for Planner

const $   = id => document.getElementById(id);
const fmt = n => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
const num = id => parseFloat($(id).value.replace(/,/g, "")) || 0;
const pct = id => num(id) / 100;

function readInputs() {
  const age = num("age");
  const retAge = num("retAge");
  return {
    age,
    retAge,
    salary: num("salary"),
    partner: $("partner").checked,
    retYears: retAge - age,

    // Property
    propPrice: num("propPrice"),
    propLVR: pct("propLVR"),
    loanRate: pct("loanRate"),
    capitalGrowth: pct("propGrowth"),
    rentYield: pct("rentYield"),
    propExpenses: pct("propExp"),
    buildPct: pct("buildPct"),
    plantPct: pct("plantPct"),
    saleCost: pct("saleCostPct"),

    // Shares
    sharesInit: num("sharesInit"),
    sharesReturn: pct("sharesRet"),
    divYield: pct("divYield")
  };
}

function runPlanner() {
  const i = readInputs();
  const yrs = i.retYears;
  const rows = [];

  let propVal = i.propPrice;
  let owed = i.propPrice * i.propLVR;
  let shares = i.sharesInit;
  let sharesAdj = 0;
  const depr = i.propPrice * i.buildPct / 40;

  for (let y = 0; y <= yrs; y++) {
    const rent = y ? propVal * i.rentYield : 0;
    const ownCost = y ? propVal * i.propExpenses : 0;
    const interest = y ? owed * i.loanRate : 0;
    const amort = y ? Math.min(owed, rent - interest - ownCost - depr) : 0;
    const netCF = rent - ownCost - interest - depr - amort;

    if (y > 0) propVal *= (1 + i.capitalGrowth);
    if (y > 0) owed = Math.max(0, owed + owed * i.loanRate - amort);

    if (y > 0) {
      sharesAdj = -netCF;
      shares = shares * (1 + i.sharesReturn) + sharesAdj;
    }

    rows.push({
      y,
      propVal,
      owed,
      equity: propVal - owed,
      ownCost,
      rent,
      interest,
      depr,
      amort,
      netCF,
      shares,
      sharesAdj
    });
  }

  drawChart(rows);
  addFullTableButton(rows);
}

function drawChart(rows) {
  const labels = rows.map(r => "Yr " + r.y);
  const prop = rows.map(r => r.equity);
  const shares = rows.map(r => r.shares);

  if (window.chart) window.chart.destroy();
  window.chart = new Chart($("chart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Property", data: prop, backgroundColor: "#1f4c3b" },
        { label: "Shares", data: shares, backgroundColor: "#397d71" }
      ]
    },
    options: {
      plugins: { legend: { position: "bottom" } },
      responsive: true,
      scales: {
        y: { ticks: { callback: v => fmt(v) } }
      }
    }
  });
}

function addFullTableButton(rows) {
  let btn = $("fullTableBtn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "fullTableBtn";
    btn.className = "btn";
    btn.textContent = "Show Full Table";
    btn.onclick = () => showFullTable(rows);
    $("results").appendChild(btn);
  }
}

function showFullTable(rows) {
  const table = document.createElement("table");
  table.innerHTML = `
    <thead><tr>
      <th>Yr</th><th>Property</th><th>Owed</th><th>Equity</th>
      <th>Own Cost</th><th>Rent</th><th>Interest</th><th>Depr.</th>
      <th>Amort.</th><th>Net CF</th><th>Shares</th><th>Adj. Capital</th>
    </tr></thead>
    <tbody>
      ${rows.map(r => `
        <tr>
          <td>${r.y}</td><td>${fmt(r.propVal)}</td><td>${fmt(r.owed)}</td><td>${fmt(r.equity)}</td>
          <td>${fmt(r.ownCost)}</td><td>${fmt(r.rent)}</td><td>${fmt(r.interest)}</td><td>${fmt(r.depr)}</td>
          <td>${fmt(r.amort)}</td><td>${fmt(r.netCF)}</td><td>${fmt(r.shares)}</td><td>${fmt(r.sharesAdj)}</td>
        </tr>
      `).join("")}
    </tbody>`;
  $("results").appendChild(table);
}

document.addEventListener("DOMContentLoaded", () => {
  $("runCompare").addEventListener("click", runPlanner);
});
