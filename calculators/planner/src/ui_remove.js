const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
const num = id => parseFloat($(id)?.value.replace(/,/g, "")) || 0;
let chart;
let tableRows = [];

function updateSharesInit() {
  const price = num("propPrice");
  const dpPct = num("depositPct") / 100;
  const costs = price * (num("buyCostsPct") / 100);
  const loanAmt = price * (1 - dpPct);
  const lmiPct = dpPct >= 0.2 ? 0 : -(0.046 - 0.01) / (0.196 - 0.05) * dpPct + 0.058;
  const lmi = loanAmt * lmiPct / (1 + lmiPct);
  const upfront = dpPct * price + costs + lmi;
  $("sharesInit").value = Math.round(upfront);
  return Math.round(upfront);
}

function readInputs() {
  const years = num("retAge") - num("age");
  updateSharesInit();
  return {
    years,
    propPrice: num("propPrice"),
    depositPct: num("depositPct") / 100,
    loanRate: num("loanRate") / 100,
    loanPeriod: num("loanPeriod"),
    propGrowth: num("propGrowth") / 100,
    rentYield: num("rentYield") / 100,
    occRate: num("occRate") / 100,
    propExp: num("propExp") / 100,
    buildPct: num("buildPct") / 100,
    buyCostsPct: num("buyCostsPct") / 100,
    saleCostPct: num("saleCostPct") / 100,
    sharesRet: num("sharesRet") / 100,
    sharesInit: num("sharesInit"),
    structures: [...document.querySelectorAll("input[name='structure']:checked")].map(e => e.value)
  };
}

function runPlanner() {
  const input = readInputs();
  const labels = [];
  const datasetMap = {};
  tableRows = [];

  for (let y = 0; y <= input.years; y++) {
    labels.push(`Yr ${y}`);
    const row = [y];

    for (let struct of input.structures) {
      let val = 0;
      if (struct === "SHARES") {
        val = input.sharesInit * Math.pow(1 + input.sharesRet, y);
      } else {
        const price = input.propPrice * Math.pow(1 + input.propGrowth, y);
        let owed = input.propPrice * (1 - input.depositPct);
        for (let i = 0; i < y && i < input.loanPeriod; i++) {
          owed = Math.max(0, owed * (1 + input.loanRate) - 30000); // dummy amort
        }
        val = price - owed;
      }

      datasetMap[struct] = datasetMap[struct] || [];
      datasetMap[struct].push(Math.round(val));
      row.push(Math.round(val));
    }

    tableRows.push(row);
  }

  if (chart) chart.destroy();
  chart = new Chart($("chart"), {
    type: "bar",
    data: {
      labels,
      datasets: Object.entries(datasetMap).map(([label, data], i) => ({
        label,
        data,
        backgroundColor: `rgba(${[40, 167, 69, 0.6, 255, 193, 7, 0.6, 220, 53, 69, 0.6, 0, 123, 255, 0.6].slice(i * 4, i * 4 + 3).join(",")},0.6)`
      }))
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: { x: { stacked: true }, y: { stacked: false } }
    }
  });

  $("results").innerHTML = "<em>Done.</em>";
}

function toggleTable() {
  if (!tableRows.length) return;

  const header = ["Year", ...document.querySelectorAll("input[name='structure']:checked")].map(e => e.value);
  $("resultsTable").innerHTML = `
    <table><thead><tr>${header.map(h => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${tableRows.map(r => `<tr>${r.map(c => `<td>${fmt(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  ["propPrice", "depositPct", "buyCostsPct"].forEach(id =>
    $(id).addEventListener("input", updateSharesInit)
  );
  $("runPlanner").addEventListener("click", runPlanner);
  $("btnShowTable").addEventListener("click", toggleTable);
  updateSharesInit();
});
