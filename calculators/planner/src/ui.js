// ui.js  – wires form → runScenario → render
import { runScenario } from './scenario_models.js';

const form   = document.getElementById('plannerForm');   // exact id in HTML
const chartC = document.getElementById('chart');
let   chart;

/* ---------- form submit ---------- */
form.addEventListener('submit', e => {
  e.preventDefault();

  const inputs = readInputs(new FormData(form));

  // which structures are ticked
  const selected = [...form.querySelectorAll('[name="structure"]:checked')]
                    .map(cb => cb.value);

  // compute once, then pull each scenario
  const fullResult = runScenario(inputs);

  const rows = selected.map(code => {
    const r = fullResult[code];
    return [label(code), r.tax, r.net];
  });

  renderTable(rows);
  renderChart(rows);
});


/* ---------- helpers ---------- */
function readInputs(fd) {
  const raw = id => (fd.get(id) || '').toString();
  const num = id => parseFloat(raw(id).replace(/[^0-9.]/g, '')) || 0;

  return {
    age:        num('age'),
    retAge:     num('retAge'),
    taxRate:    num('taxRate'),
    partner:    fd.get('partner') === 'on',

    /* property */
    propPrice:  num('propPrice'),
    propLVR:    num('propLVR'),
    loanRate:   num('loanRate'),
    propGrowth: num('propGrowth'),
    propDep:    num('propDep'),

    /* shares */
    sharesInit: num('sharesInit'),
    sharesRet:  num('sharesRet')
  };
}

function renderTable(rows) {
  const div = document.getElementById('results');
  div.innerHTML =
    '<table><thead><tr><th>Scenario</th><th>Tax payable</th><th>Net after-tax</th></tr></thead><tbody>' +
    rows.map(r => `<tr><td>${r[0]}</td><td>$${fmt(r[1])}</td><td>$${fmt(r[2])}</td></tr>`).join('') +
    '</tbody></table>';
}

function renderChart(rows) {
  const labels = rows.map(r => r[0]);
  const data   = rows.map(r => r[2]);

  if (chart) chart.destroy();
  chart = new Chart(chartC, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Net wealth at retirement', data }]
    },
    options: { plugins: { legend: { display: false } } }
  });
}

function label(code) {
  return {
    "IND-NG":              "Individual – neg geared",
    "IND-SELL-TO-SUPER":   "Sell → super",
    "IND-HOLD-TILL-DEATH": "Hold till death",
    "F-TRUST":             "Family trust",
    "COMP":                "Company",
    "SMSF-ACC":            "SMSF accum",
    "SMSF-PENS":           "SMSF pension",
    "SHARES-IND":          "Shares taxable",
    "SHARES-SMSF":         "Shares SMSF"
  }[code] || code;
}

const fmt = n => n.toLocaleString('en-AU');
