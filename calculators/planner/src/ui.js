import { runScenario } from './scenario_models.js';
import { saveScenario, loadScenario } from './storage.js';

const form   = document.getElementById('plannerForm');
const chartC = document.getElementById('chart');
const btnSave = document.getElementById('btnSave');
const btnCSV  = document.getElementById('btnCSV');

let chart, csvRows = [];

const isPro = localStorage.getItem('pvProPaid') === 'yes';

/* ---------- submit ---------- */
form.addEventListener('submit', e => {
  e.preventDefault();
  const inputs   = readInputs();
  const selected = [...form.querySelectorAll('[name="structure"]:checked')].map(cb => cb.value);
  const calc     = runScenario(inputs);
  csvRows        = generateCSV(selected, calc);

  renderChart(selected.map(s => [label(s), calc[s].net]));
  renderTable(csvRows);
});

/* ---------- Save Scenario ---------- */
if (isPro) {
  btnSave.style.display = 'inline-block';
  btnCSV.style.display  = 'inline-block';

  btnSave.addEventListener('click', () => {
    const inputs = [...form.querySelectorAll('input')]
      .reduce((acc, el) => {
        acc[el.id] = el.type === 'checkbox' ? el.checked : el.value;
        return acc;
      }, {});
    saveScenario(inputs);
    alert("Scenario saved!");
  });

  btnCSV.addEventListener('click', () => {
    if (!csvRows.length) return alert("Run a comparison first.");
    const csv = csvRows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "planner_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  // Auto-load on page load
  const saved = loadScenario();
  if (saved) {
    Object.entries(saved).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) {
        if (el.type === 'checkbox') el.checked = val;
        else el.value = val;
      }
    });
  }
}

/* ---------- Helpers ---------- */
function readInputs() {
  return {
    age:       num('age'),
    retAge:    num('retAge'),
    salary:    num('salary'),
    taxRate:   num('taxRate'),
    partner:   document.getElementById('partner').checked,
    propPrice: num('propPrice'),
    propLVR:   num('propLVR'),
    loanRate:  num('loanRate'),
    propGrowth:num('propGrowth'),
    rentYield: num('rentYield'),
    propExp:   num('propExp'),
    buildPct:  num('buildPct'),
    plantPct:  num('plantPct'),
    saleCostPct: num('saleCostPct'),
    sharesInit: num('sharesInit'),
    sharesRet:  num('sharesRet'),
    divYield:   num('divYield')
  };
}

function num(id) {
  return parseFloat(document.getElementById(id).value.replace(/,/g, '')) || 0;
}

function label(code) {
  return {
    IND:         'Individual',
    TRUST:       'Family trust',
    COMP:        'Company',
    SMSF_ACC:    'SMSF – accum',
    SMSF_PENS:   'SMSF – pension',
    SHARES:      'Shares baseline',
    'IND-NG':    'Individual – neg geared',
    'IND-SELL-TO-SUPER': 'Sell to super',
    'IND-HOLD-TILL-DEATH': 'Hold till death',
    'F-TRUST':   'Family trust (2 bene.)',
    'SHARES-SMSF': 'Shares – SMSF'
  }[code] || code;
}

function renderChart(rows) {
  const labels = rows.map(r => r[0]);
  const data   = rows.map(r => r[1]);

  if (chart) chart.destroy();
  chart = new Chart(chartC, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Net wealth @67', data }] },
    options: { plugins: { legend: { display: false } } }
  });
}

function renderTable(rows) {
  const div = document.getElementById('results');
  const head = `<tr><th>Scenario</th><th>Tax payable</th><th>Net after-tax</th></tr>`;
  const body = rows.map(r => `<tr><td>${r[0]}</td><td>$${fmt(r[2])}</td><td>$${fmt(r[1])}</td></tr>`).join('');
  div.innerHTML = `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function generateCSV(selected, calc) {
  const rows = [["Scenario", "Net Wealth", "Tax"]];
  for (const code of selected) {
    const labelName = label(code);
    const net = calc[code]?.net || 0;
    const tax = calc[code]?.tax || 0;
    rows.push([labelName, net, tax]);
  }
  return rows;
}

const fmt = n => n.toLocaleString('en-AU');
