/* ---------- helpers & live-formatting ---------- */
const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });

["curCap", "monthlyContrib", "targetMonthly"].forEach(id => {
  $(id).addEventListener("input", e => {
    const raw = e.target.value.replace(/,/g, "");
    if (!isNaN(raw) && raw !== "") e.target.value = parseInt(raw, 10).toLocaleString();
  });
});

/* ---------- recompute suggested withdrawal rate on the fly ---------- */
function updateSuggest() {
  const r = +$("annRet").value    || 0;
  const i = +$("infl").value      || 0;
  const safeRate = Math.max(2.5, ((r - i) * 0.67)).toFixed(1); // simple heuristic
  $("recRateLabel").textContent = `(suggested ${safeRate} %)`;
}
$("annRet").addEventListener("input", updateSuggest);
$("infl").addEventListener("input", updateSuggest);

/* ---------- main projection ---------- */
let chart;                 // Chart.js instance holder
function runRetirementCalc() {
  const age  = +$("curAge").value;
  const cap0 = +$("curCap").value.replace(/,/g,"")      || 0;
  const r    = +$("annRet").value / 100                 || 0;
  const infl = +$("infl").value / 100                   || 0;
  const wdr  = +$("wdRate").value / 100                 || 0.04;
  const cpm  = +$("monthlyContrib").value.replace(/,/g,"") || 0;
  const tgtM = +$("targetMonthly").value.replace(/,/g,"") || 0;

  if (age<=0 || cap0<0 || r<0 || wdr<=0) {
    $("quickMsg").hidden=false;
    $("quickMsg").className="result-box error";
    $("quickMsg").textContent="❌ Please ensure all numbers are valid.";
    return;
  }

  updateSuggest(); // keep hint fresh

  let bal=cap0, table="", labels=[], capSeries=[], goalSeries=[];
  let hitAge=null;

  for(let y=0; y<=55; y++){                // project up to 55 years (age ~100)
    const curAge=age+y;
    if(y>0) bal = (bal + cpm*12)*(1+r);    // grow after contribution

    const goal = tgtM*12 / wdr * Math.pow(1+infl, y);

    labels.push(curAge.toString());
    capSeries.push(Math.round(bal));
    goalSeries.push(Math.round(goal));

    table += `<tr><td>${curAge}</td><td>${fmt(bal)}</td><td>${fmt(goal)}</td></tr>`;

    if(!hitAge && bal>=goal) hitAge=curAge;
  }

  // quick message
  $("quickMsg").hidden=false;
  $("quickMsg").className = hitAge ? "result-box" : "result-box error";
  $("quickMsg").textContent = hitAge
      ? `✔️ You will reach your retirement income goal by age ${hitAge} (in ${hitAge-age} years) with ≈ ${fmt(capSeries[hitAge-age])}.`
      : `⚠️ Based on these inputs the goal is not met by age ${age+55} (projection limit).`;

  // chart
  if(chart) chart.destroy();
  chart = new Chart($("retChart"),{
    type:"line",
    data:{labels,
      datasets:[
        {label:"Capital", data:capSeries, borderColor:"#28a745", borderWidth:2, fill:false},
        {label:"Infl-Adj Goal", data:goalSeries, borderColor:"#dc3545", borderWidth:2, fill:false}
      ]},
    options:{responsive:true,plugins:{legend:{labels:{boxWidth:14}}},scales:{y:{ticks:{callback:v=>fmt(v)}}}}
  });

  // table
  $("retResults").innerHTML = `
    <table><thead><tr><th>Age</th><th>Capital ($)</th><th>Infl-Adj Goal</th></tr></thead>
    <tbody>${table}</tbody></table>`;
}

window.runRetirementCalc = runRetirementCalc;
