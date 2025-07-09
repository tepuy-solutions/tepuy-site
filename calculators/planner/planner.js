import { taxModels } from './tax_models.js';

/* Main: wire form ➜ run comparison ➜ render table */
document.getElementById('planner-form').addEventListener('submit', e=>{
  e.preventDefault();

  const age     = +document.getElementById('age').value;
  const tr      = +document.getElementById('taxRate').value; // %
  const partner = document.getElementById('partner').checked;

  /* Sim assumptions – tweak as needed */
  const grossGain   = 1_200_000;   // property gain
  const sharesValue = 1_200_000;   // same size share pot for fairness

  const selected = [...document.querySelectorAll('input[name="structure"]:checked')]
                    .map(cb=>cb.value);

  const rows = selected.map(code=>{
      const fn   = taxModels[code];
      const tax  = fn(code.startsWith('SHARES')?sharesValue:grossGain, tr, partner);
      const net  = (code.startsWith('SHARES')?sharesValue:grossGain) - tax;
      return { code, tax, net };
  });

  render(rows);
});

/* Simple table renderer */
function render(rows){
  const res = document.getElementById('results');
  if(!rows.length){ res.innerHTML=''; return; }

  const html = [
    '<table><thead><tr><th>Scenario</th><th>Tax payable</th><th>Net after-tax</th></tr></thead><tbody>',
    ...rows.map(r=>`<tr><td>${label(r.code)}</td>
        <td>$${fmt(r.tax)}</td><td>$${fmt(r.net)}</td></tr>`),
    '</tbody></table>'
  ].join('');
  res.innerHTML = html;
}

/* Helpers */
const fmt = n=>n.toLocaleString('en-AU');
function label(code){
  const map={
    "IND-NG":"Individual – negatively geared",
    "IND-SELL-TO-SUPER":"Individual → super contribution",
    "IND-HOLD-TILL-DEATH":"Individual – hold till death",
    "F-TRUST":"Family trust (2 adult bene.)",
    "COMP":"Company",
    "SMSF-ACC":"SMSF accumulation",
    "SMSF-PENS":"SMSF pension",
    "SHARES-IND":"Shares – taxable",
    "SHARES-SMSF":"Shares – SMSF"
  };
  return map[code]||code;
}
