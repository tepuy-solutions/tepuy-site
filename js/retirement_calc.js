/* ---------------- retirement_calc.js ---------------- */

/* Helper: format number with commas */
function fmt(n) { return n.toLocaleString('en-AU'); }

/* Auto-suggest SWR whenever return/inflation change */
const returnEl   = document.getElementById('returnRate');
const inflEl     = document.getElementById('inflation');
const withdrawEl = document.getElementById('withdrawal');
const swrHint    = document.getElementById('swrHint');

function updateSuggestedSWR(){
  const r = (+returnEl.value || 0)/100;
  const i = (+inflEl.value   || 0)/100;
  if(r<=0||i<0) return;

  const swr = ((1+r)/(1+i) -1)*100;
  withdrawEl.value = swr.toFixed(1);
  swrHint.textContent = `Suggested: ${swr.toFixed(1)}% (auto-filled)`;
}
returnEl.addEventListener('input', updateSuggestedSWR);
inflEl.addEventListener('input', updateSuggestedSWR);
window.addEventListener('DOMContentLoaded', updateSuggestedSWR);

/* Main calculation */
function calculateRetirement(){
  const age   = +document.getElementById('age').value      || 0;
  let capital = +document.getElementById('capital').value   || 0;
  const r     = (+returnEl.value)   /100;
  const i     = (+inflEl.value)     /100;
  const swr   = (+withdrawEl.value) /100;
  const mCon  = +document.getElementById('contribution').value || 0;
  const mInc  = +document.getElementById('targetIncome').value || 0;

  const realReturn = ((1+r)/(1+i))-1;
  const goalToday  = (mInc*12)/swr;

  const rows=[]; let yrs=0, hit=false, hitCap=0;
  while(yrs<120){
    const goalInflAdj = goalToday*Math.pow(1+i,yrs);
    if(capital>=goalInflAdj && !hit){ hit=true; hitCap=capital; }
    rows.push(`<tr><td>${age+yrs}</td><td>$${fmt(capital)}</td><td>$${fmt(goalInflAdj)}</td><td>$${fmt(mCon*12)}</td></tr>`);
    capital = capital*(1+realReturn)+mCon*12;
    yrs++;
    if(hit) break;
  }

  /* summary */
  const sum = document.getElementById('summary');
  if(hit){
    sum.className='result-box success';
    sum.textContent=`🎉 You will reach your retirement income goal by age ${age+yrs} (in ${yrs} years), with a projected capital of $${fmt(hitCap)}.`;
  }else{
    sum.className='result-box warning';
    sum.textContent=`⚠️ Based on your inputs, the goal is not met within 120 years. Increase contributions or adjust assumptions.`;
  }
  sum.style.display='block';

  /* table */
  document.getElementById('projectionTable').innerHTML = `
    <table>
      <thead><tr><th>Age</th><th>Capital ($)</th><th>Infl-Adj Goal ($)</th><th>Annual Contribution ($)</th></tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table>`;
}
