/* ui.js – Planner Edition (entity-aware) */
import { runScenario } from './scenario_models.js';

const form   = document.getElementById('plannerForm');
const chartC = document.getElementById('chart');
let chart;

/* ---------- submit ---------- */
form.addEventListener('submit', e => {
  e.preventDefault();

  const inputs   = readInputs();
  const selected = [...form.querySelectorAll('[name="structure"]:checked')]
                    .map(cb => cb.value);

  const calc = runScenario(inputs);

  renderChart(selected.map(s => [label(s), calc[s].net]));
  renderTable(selected, calc);
});

/* ---------- helpers ---------- */
function get(id) { return document.getElementById(id).value || ''; }
function num(id) { return parseFloat(get(id).replace(/,/g, '')) || 0; }

function readInputs() {
  return {
    age:       num('age'),
    retAge:    num('retAge'),
    salary:    num('salary'),
    taxRate:   num('taxRate'),            // still used for shares CGT
    partner:   document.getElementById('partner').checked,

    /* property */
    propPrice:   num('propPrice'),
    propLVR:     num('propLVR'),
    loanRate:    num('loanRate'),
    propGrowth:  num('propGrowth'),
    rentYield:   num('rentYield'),
    propExp:     num('propExp'),
    buildPct:    num('buildPct'),
    plantPct:    num('plantPct'),
    saleCostPct: num('saleCostPct'),

    /* shares */
    sharesInit:  num('sharesInit'),
    sharesRet:   num('sharesRet')
  };
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

function renderTable(selected, calc) {
  const div = document.getElementById('results');
  const head = `<tr><th>Scenario</th><th>Tax payable</th><th>Net after-tax</th></tr>`;
  const body = selected.map(code => `
      <tr>
        <td>${label(code)}</td>
        <td>$${fmt(calc[code].tax)}</td>
        <td>$${fmt(calc[code].net)}</td>
      </tr>`).join('');

  div.innerHTML =
    `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function label(code) {
  return {
    IND:         'Individual',
    TRUST:       'Family trust',
    COMP:        'Company',
    SMSF_ACC:    'SMSF – accum',
    SMSF_PENS:   'SMSF – pension',
    SHARES:      'Shares baseline'
  }[code] || code;
}
const fmt = n => n.toLocaleString('en-AU');
