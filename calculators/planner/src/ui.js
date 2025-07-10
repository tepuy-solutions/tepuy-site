// ui.js — Tepuy Planner Logic

const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
const num = id => parseFloat($(id)?.value.replace(/,/g, "")) || 0;
let chart;

// Auto-calculate Shares Capital from property cashUpfront
function updateSharesInit() {
  const loan = num("propPrice") * (num("propLVR") / 100);
  const dpPct = 1 - (num("propLVR") / 100);
  const lmiPct = dpPct >= 0.2 ? 0 : -(0.046 - 0.01) / (0.196 - 0.05) * dpPct + 0.058;
  const price = loan / ((1 - dpPct) * (1 + lmiPct));
  const costs = num("propPrice") * 0.06; // estimate (stamp duty etc.)
  const cashUp = dpPct * price + costs;
  $("sharesInit").value = Math.round(cashUp);
  return Math.round(cashUp);
}

// Read all form values
function readInputs() {
  updateSharesInit(); // ensure it's synced
  return {
    age: num("age"),
    retAge: num("retAge"),
    salary: num("salary"),
    partner: $("partner").checked,

    propPrice: num("propPrice"),
    propLVR: num("propLVR"),
    loanRate: num("loanRate") / 100,
    propGrowth: num("propGrowth") / 100,
    rentYield: num("rentYield") / 100,
    propExp: num("propExp") / 100,
    propDep: num("buildPct") / 100,
    propPlant: num("plantPct") / 100,
    saleCost: num("saleCostPct") / 100,

    sharesInit: num("sharesInit"),
    sharesRet: num("sharesRet") / 100,
    divYield: num("divYield") / 100,

    yearsToRet: num("retAge") - num("age")
  };
}

// Run full planner simulation
function runPlanner() {
  const input = readInputs();

  const labels = [];
  const shares = [];
  const equity = [];

  let propVal = input.propPrice;
  let owed = input.propPrice * (input.propLVR / 100);
  let shareVal = input.sharesInit;

  const table = [["Year", "Prop Value", "Shares Value", "Owed", "Equity"]];

  for (let y = 0; y <= input.yearsToRet; y++) {
    const propEquity = propVal - owed;
    labels.push(`Yr ${y}`);
    shares.push(Math.round(shareVal));
    equity.push(Math.round(propEquity));
    table.push([
      y, Math.round(propVal), Math.round(shareVal),
      Math.round(owed), Math.round(propEquity)
    ]);

    // next year projection
    propVal *= 1 + input.propGrowth;
    owed = Math.max(0, owed * (1 + input.loanRate) - 30000); // simple amortization
    shareVal *= 1 + input.sharesRet;
  }

  // Chart
  if (chart) chart.destroy();
  chart = new Chart($("chart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Property Equity",
          data: equity,
          backgroundColor: "rgba(40,167,69,0.6)"
        },
        {
          label: "Shares Value",
          data: shares,
          backgroundColor: "rgba(0,123,255,0.6)"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } }
    }
  });

  // Store rows for table
  $("resultsTable").dataset.rows = JSON.stringify(table);
  $("resultsTable").innerHTML = ""; // clear
}

// Show/hide CSV Table
function toggleTable() {
  const rows = JSON.parse($("resultsTable").dataset.rows || "[]");
  if (!rows.length) return;

  $("resultsTable").innerHTML = `
    <div class="table-container">
      <table>
        <thead><tr>${rows[0].map(h => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.slice(1).map(r => `<tr>${r.map(c => `<td>${fmt(c)}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  ["propPrice", "propLVR"].forEach(id =>
    $(id).addEventListener("input", updateSharesInit)
  );
  $("runPlanner").addEventListener("click", runPlanner);
  $("btnTable").addEventListener("click", toggleTable);
  updateSharesInit();
});
