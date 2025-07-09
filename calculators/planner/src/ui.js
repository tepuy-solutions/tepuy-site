
import { runScenario } from './scenario_models.js';

const form   = document.getElementById('plannerForm');
const chartC = document.getElementById('chart');
let  chart;

form.addEventListener('submit',e=>{
  e.preventDefault();
  const inputs = readInputs(new FormData(form));
  const sel    = [...form.querySelectorAll('[name="structure"]:checked')].map(cb=>cb.value);
  const rows   = [];
  sel.forEach(code=>{
    const res = runScenario(code,inputs)[code];
    rows.push([label(code),res.tax,res.net]);
  });
  renderTable(rows);
  renderChart(rows);
});

/* ---------- helpers ---------- */
function readInputs(fd){
  const raw = id => fd.get(id) || '';
  const num = id => +raw(id).replace(/[^0-9.]/g,'');   // strip $ , spaces
  return {
    age:num('age'),retAge:num('retAge'),taxRate:num('taxRate'),
    partner:fd.get('partner')==='on',
    propPrice:num('propPrice'),propLVR:num('propLVR'),
    loanRate:num('loanRate'),rentYield:num('rentYield'),
    propGrowth:num('propGrowth'),propExp:num('propExp'),
    propDep:num('propDep'),sharesInit:num('sharesInit'),
    sharesRet:num('sharesRet'),divYield:num('divYield')
  };
}


function renderTable(rows){
  const div=document.getElementById('results');
  div.innerHTML=
    `<table><thead><tr><th>Scenario</th><th>Tax payable</th><th>Net after-tax</th></tr></thead><tbody>`+
    rows.map(r=>`<tr><td>${r[0]}</td><td>$${fmt(r[1])}</td><td>$${fmt(r[2])}</td></tr>`).join('')+
    '</tbody></table>';
}
function renderChart(rows){
  const labels = rows.map(r=>r[0]);
  const data   = rows.map(r=>r[2]);
  if(chart)chart.destroy();
  chart = new Chart(chartC,{
    type:'bar',
    data:{labels,datasets:[{label:'Net wealth at retirement',data}]},
    options:{plugins:{legend:{display:false}}}
  });
}
function label(c){
  return {
    "IND-NG":"Individual – neg geared",
    "IND-SELL-TO-SUPER":"Sell → super",
    "IND-HOLD-TILL-DEATH":"Hold till death",
    "F-TRUST":"Family trust",
    "COMP":"Company",
    "SMSF-ACC":"SMSF accum",
    "SMSF-PENS":"SMSF pension",
    "SHARES-IND":"Shares taxable",
    "SHARES-SMSF":"Shares SMSF"
  }[c]||c;
}
const fmt=n=>n.toLocaleString('en-AU');
