/* ui.js – Planner Edition */
import { runScenario } from './scenario_models.js';

const form = document.getElementById('plannerForm');
const chartC = document.getElementById('chart');
let chart;

/* ---------- submit ---------- */
form.addEventListener('submit', e => {
  e.preventDefault();

  const inputs   = readInputs(); // ✅ no FormData now
  const selected = [...form.querySelectorAll('[name="structure"]:checked')]
                    .map(cb => cb.value);

  const calc = runScenario(inputs);

  const rows = selected.map(code => {
    const r = calc[code];
    if (!r) {
      console.error("Missing data for:", code);
      return [label(code), 0, 0];
    }
    return [label(code), r.tax, r.net];
  });

  renderTable(rows);
  renderChart(rows);
});

/* ---------- helpers ---------- */
function readInputs() {
  const get = id => document.getElementById(id).value || '';
  const num = id => parseFloat(get(id).replace(/,/g, '')) || 0;

  return {
    age:         num('age'),
    retAge:      num('retAge'),
    taxRate:     num('taxRate'),
    partner:     document.getElementById('partner').checked,

    /* property */
    propPrice:   num('propPrice'),
    propLVR:     num('propLVR'),
    loanRate:    num('loanRate'),
    propGrowth:  num('propGrowth'),
    propDep:     num('propDep'),
    saleCostPct: num('saleCostPct'),

    /* shares */
    sharesInit:  num('sharesInit'),
    sharesRet:   num('sharesRet')
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
    data: { labels, datasets: [{ label: 'Net wealth at retirement', data }] },
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
