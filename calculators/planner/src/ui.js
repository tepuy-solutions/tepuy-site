// ui.js — Planner Edition: With Show Full Table

const $   = id => document.getElementById(id);
const fmt = n => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
const num = id => parseFloat($(id).value.replace(/,/g, "")) || 0;
const pct = id => num(id) / 100;

function readInputs() {
  return {
    age: num("age"),
    retAge: num("retirementAge"),
    salary: num("annualSalary"),
    partner: $("partnerSplit").checked,

    // Property
    propPrice: num("propPrice"),
    propLVR: pct("propLVR"),
    loanRate: pct("loanRate"),
    capitalGrowth: pct("propGrowth"),
    rentYield: pct("rentYield"),
    propExpenses: pct("propExp"),
    buildPct: pct("buildComp"),
    plantPct: pct("plantComp"),
    saleCost: pct("saleCost"),

    // Shares
    sharesInit: num("sharesInit"),
    sharesReturn: pct("sharesReturn"),
    divYield: pct("divYield"),

    // Structure
    taxRate: pct("taxRate"),
    retYears: num("retYears")
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
    const rent = y === 0 ? 0 : propVal * i.rentYield;
    const ownCost = y === 0 ? 0 : propVal * i.propExpenses;
    const interest = y === 0 ? 0 : owed * i.loanRate;
    const amort = y === 0 ? 0 : Math.min(owed, rent - interest - ownCost - depr);
    const netCF = rent - ownCost - interest - depr - amort;

    // Update property values
    if (y > 0) propVal *= (1 + i.capitalGrowth);
    if (y > 0) owed = Math.max(0, owed + owed * i.loanRate - amort);

    // Track capital sync
    if (y > 0) {
      sharesAdj = -netCF;
      shares += shares * i.sharesReturn + sharesAdj;
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
    btn.textContent = "Show Full Table";
    btn.className = "btn";
    btn.onclick = () => showFullTable(rows);
    $("results").appendChild(btn);
  }
}

function showFullTable(rows) {
  const table = document.createElement("table");
  table.innerHTML = `
    <thead><tr>
      <th>Yr</th><th>Property</th><th>Owed</th><th>Equity</th>
      <th>Own Cost</th><th>Rent</th><th>Interest</th><th>Depr.</th><th>Amort.</th><th>Net CF</th>
      <th>Shares Value</th><th>Shares Adjust</th>
    </tr></thead>
    <tbody>
      ${rows.map(r => `
        <tr>
          <td>${r.y}</td><td>${fmt(r.propVal)}</td><td>${fmt(r.owed)}</td><td>${fmt(r.equity)}</td>
          <td>${fmt(r.ownCost)}</td><td>${fmt(r.rent)}</td><td>${fmt(r.interest)}</td><td>${fmt(r.depr)}</td><td>${fmt(r.amort)}</td><td>${fmt(r.netCF)}</td>
          <td>${fmt(r.shares)}</td><td>${fmt(r.sharesAdj)}</td>
        </tr>
      `).join("")}
    </tbody>`;
  $("results").appendChild(table);
}

document.addEventListener("DOMContentLoaded", () => {
  $("runCompare").onclick = runPlanner;
});
