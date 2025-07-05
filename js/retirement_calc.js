/* ========= helpers ========= */
const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });

/* pretty-print commas while typing (for $ fields) */
["curCap", "monthlyContrib", "targetMonthly"].forEach(id => {
  $(id).addEventListener("input", e => {
    const raw = e.target.value.replace(/,/g, "");
    if (!isNaN(raw) && raw !== "") {
      e.target.value = parseInt(raw, 10).toLocaleString();
    }
  });
});

/* ========= main ========== */
let chart;   // Chart.js instance

function runRetirementCalc() {
  // ---- read inputs ----
  const age       = +$("curAge").value;
  const retAge    = +$("retAge").value;
  const years     = retAge - age;

  const capital   = +$("curCap").value.replace(/,/g, "");
  const retRate   = +$("annRet").value / 100;
  const infl      = +$("infl").value / 100;
  const wRate     = +$("wdRate").value / 100;
  const contrib   = +$("monthlyContrib").value.replace(/,/g, "");
  const tgtMonth  = +$("targetMonthly").value.replace(/,/g, "");

  if (years <= 0 || capital < 0) {
    $("quickMsg").hidden = false;
    $("quickMsg").className = "result-box error";
    $("quickMsg").textContent = "❌ Please enter sensible ages and numbers.";
    return;
  }

  // update suggested withdrawal label
  const safeRate = Math.max(2.5, ((retRate - infl) * 0.67 * 100)).toFixed(1);
  $("recRateLabel").textContent = `(suggested ${safeRate} %)`;

  // ---- projection ----
  const labels = [], capSeries = [], goalSeries = [];
  let bal = capital, goalHitAge = null;

  for (let y = 0; y <= years; y++) {
    const thisAge = age + y;
    if (y > 0) bal = (bal + contrib * 12) * (1 + retRate);

    const goal = tgtMonth * 12 / wRate * Math.pow(1 + infl, y);

    labels.push(thisAge.toString());
    capSeries.push(Math.round(bal));
    goalSeries.push(Math.round(goal));

    if (!goalHitAge && bal >= goal) goalHitAge = thisAge;
  }

  // ---- quick message ----
  $("quickMsg").hidden = false;
  $("quickMsg").className = goalHitAge ? "result-box" : "result-box error";
  $("quickMsg").textContent = goalHitAge
      ? `✔️ You will reach your retirement income goal by age ${goalHitAge} (in ${goalHitAge-age} years), with a projected capital of ${fmt(capSeries[goalHitAge-age])}.`
      : `⚠️ Based on your inputs you will NOT reach the target income by age ${retAge}.`;

  // ---- chart ----
  if (chart) chart.destroy();
  const ctx = $("retChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {label:"Capital", data:capSeries, borderWidth:2, borderColor:"#28a745", fill:false},
        {label:"Infl-Adj Goal", data:goalSeries, borderWidth:2, borderColor:"#dc3545", fill:false}
      ]
    },
    options:{
      responsive:true,
      plugins:{legend:{labels:{boxWidth:14}}},
      scales:{y:{ticks:{callback:v=>fmt(v)}}}
    }
  });

  // ---- table ----
  let rows = "";
  for (let i = 0; i < labels.length; i++) {
    rows += `<tr><td>${labels[i]}</td><td>${fmt(capSeries[i])}</td><td>${fmt(goalSeries[i])}</td></tr>`;
  }
  $("retResults").innerHTML = `
    <table><thead><tr><th>Age</th><th>Capital ($)</th><th>Infl-Adj Goal</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

window.runRetirementCalc = runRetirementCalc;
