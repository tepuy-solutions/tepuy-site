// ------- helpers (comma formatting) ------
["currentCapital","monthlySavings","desiredMonthlyIncome"].forEach(id=>{
  const el=document.getElementById(id);
  el.addEventListener("input",()=>{const n=el.value.replace(/,/g,"");if(!isNaN(n)&&n!==""){el.value=Number(n).toLocaleString();}});
});

// ------- auto-suggest SWR ---------------
const rEl = document.getElementById("rateOfReturn");
const iEl = document.getElementById("inflationRate");
const wEl = document.getElementById("withdrawalRate");
const hint= document.getElementById("swrHint");

function updateSWR(){
  const r = (+rEl.value||0)/100, i = (+iEl.value||0)/100;
  if(r<=0||i>=0.15){hint.textContent="Suggested: —";return;}
  const swr = (((1+r)/(1+i))-1)*100;
  wEl.value = swr.toFixed(1);
  hint.textContent = `Suggested: ${swr.toFixed(1)} %`;
}
rEl.addEventListener("input",updateSWR);
iEl.addEventListener("input",updateSWR);
window.addEventListener("DOMContentLoaded",updateSWR);

// ------- main calculation ---------------
document.getElementById("calcBtn").addEventListener("click",()=>{
  const age   = +document.getElementById("currentAge").value;
  const cap0  = +document.getElementById("currentCapital").value.replace(/,/g,"");
  const r     = +rEl.value/100;
  const inf   = +iEl.value/100;
  const swr   = +wEl.value/100;
  const mSave = +document.getElementById("monthlySavings").value.replace(/,/g,"");
  const inc   = +document.getElementById("desiredMonthlyIncome").value.replace(/,/g,"");

  const msg = document.getElementById("resultMsg");
  const tableBody = document.getElementById("projectionTable").querySelector("tbody");
  const table     = document.getElementById("projectionTable");

  // basic validation
  if([age,cap0,r,inf,swr,mSave,inc].some(x=>isNaN(x)||x<0)||swr===0){
    msg.className="result-box error";
    msg.textContent="❌ Please enter valid positive numbers.";
    msg.hidden=false; table.hidden=true; return;
  }

  const target0 = inc*12/swr;          // capital needed in today's $
  let cap = cap0, years=0, rows="";
  for(let a=age;a<=100;a++){
    const targetAdj = target0*Math.pow(1+inf,years);
    const contrib   = mSave*12*Math.pow(1+inf,years);
    rows += `<tr><td>${a}</td><td>${Math.round(cap).toLocaleString()}</td><td>${Math.round(targetAdj).toLocaleString()}</td><td>${Math.round(contrib).toLocaleString()}</td></tr>`;
    if(cap>=targetAdj){break;}
    cap = cap*(1+r)+contrib;
    years++;
  }

  msg.className="result-box";
  msg.textContent = cap>=target0 ? 
      `✅ You will reach your retirement income goal by age ${age+years} (in ${years} years), with a projected capital of $${Math.round(cap).toLocaleString()}.` :
      `❌ Goal not reached by age 100 with these assumptions.`;
  msg.hidden=false;

  tableBody.innerHTML=rows;
  table.hidden=false;
});
