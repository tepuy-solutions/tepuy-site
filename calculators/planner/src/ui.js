import { runScenario } from './scenario_models.js';
import { saveScenario, loadScenario } from './storage.js';

const form    = document.getElementById('plannerForm');
const chartC  = document.getElementById('chart');
const btnSave = document.getElementById('btnSave');
const btnCSV  = document.getElementById('btnCSV');

let chart, csvRows = [];

// Check Pro access
const isPro = localStorage.getItem('pvProPaid') === 'yes';

/* ---------- Handle Form Submit ---------- */
form.addEventListener('submit', e => {
  e.preventDefault();

  const inputs   = readInputs();
  const selected = [...form.querySelectorAll('[name="structure"]:checked')].map(cb => cb.value);
  const calc     = runScenario(inputs);

  csvRows = generateCSV(selected, calc);

  renderChart(
    selected
      .filter(s => calc[s])
      .map(s => [label(s), calc[s].net])
  );

  renderTable(csvRows);
});

/* ---------- Enable Pro Features ---------- */
if (isPro) {
  btnSave.style.display = 'inline-block';
  btnCSV.style.display  = 'inline-block';

  // Save to localStorage
  btnSave.addEventListener('click', () => {
    const inputs = [...form.querySelectorAll('input')]
      .reduce((acc, el) => {
        acc[el.id] = el.type === 'checkbox' ? el.checked : el.value;
        return acc;
      }, {});
    saveScenario(inputs);
    alert("Scenario saved!");
  });

  // Export CSV
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

  // Load previously saved values
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

// Read all input values from form
function readInputs() {
  return {
    age:         num('age'),
    retAge:      num('retAge'),
    salary:      num('salary'),
    partner:     document.getElementById('partner').checked,
    propPrice:   num('propPrice'),
    propLVR:     num('propLVR'),
    loanRate:    num('loanRate'),
    propGrowth:  num('propGrowth'),
    rentYield:   num('rentYield'),
    propExp:     num('propExp'),
    buildPct:    num('buildPct'),
    plantPct:    num('plantPct'),
    saleCostPct: num('saleCostPct'),
    sharesInit:  num('sharesInit'),
    sharesRet:   num('sharesRet'),
    divYield:    num('divYield')
  };
}

// Get numeric value from input field
function num(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`Missing input: #${id}`);
    return 0;
  }
  return parseFloat(el.value.replace(/,/g, '')) || 0;
}

// Scenario label mapping
function label(code) {
  return {
    IND:              'Individual',
    TRUST:            'Family trust',
    COMP:             'Company',
    SMSF_ACC:         'SMSF – accum',
    SMSF_PENS:        'SMSF – pension',
    SHARES:           'Shares baseline',
    'IND-NG':         'Individual – neg geared',
    'IND-SELL-TO-SUPER': 'Sell to super',
    'IND-HOLD-TILL-DEATH': 'Hold till death',
    'F-TRUST':        'Family trust (2 bene.)',
    'SHARES-SMSF':    'Shares – SMSF'
  }[code] || code;
}

// Render bar chart with results
function renderChart(rows) {
  const labels = rows.map(r => r[0]);
  const data   = rows.map(r => r[1]);

  if (chart) chart.destroy();

  chart = new Chart(chartC, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Net wealth @67',
        data,
        backgroundColor: '#1f4c3b'
      }]
    },
    options: {
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Render summary table
function renderTable(rows) {
  const div  = document.getElementById('results');
  const head = `<tr><th>Scenario</th><th>Tax payable</th><th>Net after-tax</th></tr>`;
  const body = rows.slice(1)
    .map(r => `<tr><td>${r[0]}</td><td>$${fmt(r[2])}</td><td>$${fmt(r[1])}</td></tr>`)
    .join('');
  div.innerHTML = `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

// Generate CSV content from results
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

// Format numbers with thousands separator
const fmt = n => n.toLocaleString('en-AU');
