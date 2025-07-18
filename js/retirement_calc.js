/* ---------- helpers --------- */
const watermarkLogo = new Image();
watermarkLogo.src = "/img/tepuy_logo_dark.png";

const $  = id => document.getElementById(id);
const fmt= n  => n.toLocaleString("en-AU",{maximumFractionDigits:0});

/* money-field comma formatting */
["curCap","monthlyContrib","targetMonthly"].forEach(id=>{
  $(id).addEventListener("input",e=>{
    const raw=e.target.value.replace(/,/g,"");
    if(!isNaN(raw) && raw!=="") e.target.value=parseInt(raw,10).toLocaleString();
  });
});

/* live safe-rate suggestion = (r-i)/(1+i) */
function updateSuggest(){
  const r = +$("annRet").value / 100 || 0;
  const i = +$("infl").value   / 100 || 0;
  const safeWR = ((1 + r) / (1 + i) - 1) * 100;   // exact perpetuity formula
  const safeTxt = safeWR.toFixed(1);
  $("recRateLabel").textContent = `(suggested ${safeTxt} %)`;
  $("wdRate").value = safeTxt;                     // keep input in sync
}
$("annRet").addEventListener("input",updateSuggest);
$("infl").addEventListener("input",updateSuggest);

/* ------------- main projection ------------- */
let chart;
function runRetirementCalc(){
  const age   =+$("curAge").value;
  const bal0  =+$("curCap").value.replace(/,/g,"")||0;
  const r     =+$("annRet").value/100||0;
  const infl  =+$("infl").value/100||0;
  const wdr   =+$("wdRate").value/100||0.04;
  const cpm   =+$("monthlyContrib").value.replace(/,/g,"")||0;
  const tgtM  =+$("targetMonthly").value.replace(/,/g,"")||0;

  if(age<=0||bal0<0||r<0||wdr<=0){
    $("quickMsg").hidden=false;
    $("quickMsg").className="result-box error";
    $("quickMsg").textContent="❌ Please enter valid numbers.";
    return;
  }

  updateSuggest();

  let bal=bal0, labels=[],caps=[],goals=[],rows="",hitAge=null;
  for(let y=0;y<=55;y++){                    // project up to ~age 100
    const curAge=age+y;
    if(y>0) bal=(bal+cpm*12)*(1+r);

    const goal=tgtM*12/wdr*Math.pow(1+infl,y);
    labels.push(curAge.toString());
    caps  .push(Math.round(bal));
    goals .push(Math.round(goal));
    rows+=`<tr><td>${curAge}</td><td>${fmt(bal)}</td><td>${fmt(goal)}</td></tr>`;

    if(!hitAge && bal>=goal) hitAge=curAge;
    if(hitAge && y>1) break;                 // stop chart/table right after goal hit
  }

  $("quickMsg").hidden=false;
  $("quickMsg").className=hitAge?"result-box":"result-box error";
  $("quickMsg").textContent=hitAge
    ? `✔️ Goal reached by age ${hitAge} (${hitAge-age} yrs) with ≈ ${fmt(caps[labels.indexOf(hitAge.toString())])}.`
    : `⚠️ Goal not met by age ${age+55}.`;

if (chart) chart.destroy();
chart = new Chart($("retChart"), {
  type: "line",
  data: {
    labels,
    datasets: [
      {
        label: "Capital",
        data: caps,
        borderColor: "#28a745",
        backgroundColor: "rgba(40,167,69,.1)",
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: "Infl-Adj Goal",
        data: goals,
        borderColor: "#dc3545",
        backgroundColor: "rgba(220,53,69,.1)",
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" }
    },
    scales: {
      y: {
        ticks: { callback: v => fmt(v) },
        grid: { color: "#e0e0e0", lineWidth: 0.5 }
      },
      x: {
        ticks: { maxTicksLimit: 15 },
        grid: { display: false }
      }
    }
  },
  plugins: [
    {
      id: 'watermark',
      beforeDraw: chart => {
        const { width, height, ctx } = chart;
        if (watermarkLogo.complete) {
          const scale = 180 / watermarkLogo.width;
          const w = 180;
          const h = watermarkLogo.height * scale;
          ctx.save();
          ctx.globalAlpha = 0.07;
          ctx.drawImage(watermarkLogo, width - w - 10, height - h - 10, w, h);
          ctx.restore();
        }
      }
    }
  ]
});



$("retResults").innerHTML =
  `<table class="results-table centered"><thead><tr><th>Age</th><th>Capital ($)</th><th>Infl-Adj Goal</th></tr></thead><tbody>${rows}</tbody></table>`;
}

window.runRetirementCalc=runRetirementCalc;
