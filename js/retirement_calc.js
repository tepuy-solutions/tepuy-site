/* retirement_calc.js  ──────────────────────────────────────────── */

/* Helper: nice commas */
function fmt(num, dec = 0) {
  return num.toLocaleString('en-AU', { maximumFractionDigits: dec });
}

/* Main calculator */
function calculateRetirement() {
  /* Grab & coerce inputs */
  const curAge   = +document.getElementById('age').value        || 0;
  let   capital  = +document.getElementById('capital').value     || 0;
  const r        = (+document.getElementById('return').value     || 0) / 100;
  const infl     = (+document.getElementById('inflation').value  || 0) / 100;
  const swr      = (+document.getElementById('swr').value        || 0) / 100;
  const mContrib = +document.getElementById('contribution').value|| 0;
  const mIncome  = +document.getElementById('goal').value        || 0;

  /* Calculate goal in today’s dollars */
  const goalToday = (mIncome * 12) / swr;

  const rows = [];
  let years  = 0;
  let hit    = false;
  let hitCap = 0;

  while (years < 120) {                       // safety cap at 120 iterations
    const goalInflAdj = goalToday * Math.pow(1 + infl, years);
    const annualContrib = mContrib * 12 * Math.pow(1 + infl, years);

    rows.push(
      `<tr>
         <td>${curAge + years}</td>
         <td>$${fmt(capital)}</td>
         <td>$${fmt(goalInflAdj)}</td>
         <td>$${fmt(annualContrib)}</td>
       </tr>`
    );

    if (!hit && capital >= goalInflAdj) {
      hit    = true;
      hitCap = capital;
      break;
    }

    capital = capital * (1 + r) + annualContrib;
    years++;
  }

  /* ---- Update table ---- */
  document.getElementById('results').innerHTML = `
    <table>
      <thead>
        <tr><th>Age</th><th>Capital</th><th>Infl-Adj Goal</th><th>Contrib / yr</th></tr>
      </thead>
      <tbody>${rows.join('')}</tbody>
    </table>
  `;

  /* ---- Summary banner ---- */
  const summary = document.getElementById('summary');
  summary.style.display = 'block';

  if (hit) {
    summary.style.background = '#e6ffe6';
    summary.style.color = '#1d6331';
    summary.textContent =
      `✅ Goal reached at age ${curAge + years} (in ${years} years) with ≈ $${fmt(hitCap)}.`;
  } else {
    summary.style.background = '#ffebee';
    summary.style.color = '#c62828';
    summary.textContent =
      '⚠️ Goal not reached within 120 years. Increase contributions or adjust assumptions.';
  }
}

/* ----- Comma-format selected inputs on blur ----- */
['capital', 'contribution', 'goal'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('blur', () => {
    const raw = el.value.replace(/,/g, '');
    if (!isNaN(raw) && raw !== '') el.value = fmt(+raw);
  });
});
