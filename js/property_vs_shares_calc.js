/* ---------- helpers ---------- */
const $   = id => document.getElementById(id);
const fmt = n  => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
const num = id => parseFloat($(id).value.replace(/,/g, "")) || 0;
const pct = id => num(id) / 100;

/* ---------- main ------------- */
function calculate() {
  /* ── grab inputs ── */
  const loanAmt   = num("loanAmount");
  const dpPct     = pct("downpayment");
  const buyCosts  = num("buyingCosts");
  const yearsLoan = num("loanPeriod");
  const rLoan     = pct("loanInterestRate");
  const ownPct    = pct("owningCosts");
  const agentPct  = pct("agentFees");
  const occ       = pct("occupancyRate");
  const growProp  = pct("propertyAppreciation");
  const rentYld   = pct("rentalIncome");
  const rShares   = pct("stockMarketAppreciation");
  const buildPct  = pct("buildingComponent");
  const tax       = pct("taxBracket");
  const yearsRet  = num("yearsToRetirement");

  /* ── upfront maths ── */
  const lmiPct = dpPct >= .20 ? 0
    : -(0.046-0.01)/(0.196-0.05)*dpPct + 0.058;      // same sliding scale
  const lmiAmt = Math.round(loanAmt * lmiPct / (1+lmiPct));
  const price  = Math.round(loanAmt / ((1-dpPct)*(1+lmiPct)));
  const cashUp = Math.round(dpPct*price + buyCosts);
  const wkPay  = (((rLoan/12)*loanAmt*Math.pow(1+rLoan/12,yearsLoan*12)) /
                 (Math.pow(1+rLoan/12,yearsLoan*12)-1))*12/52;

  /* ── quick-output boxes ── */
  $("lmiPercentage").value    = (lmiPct*100).toFixed(2);
  $("lmiAmount").value        = fmt(lmiAmt);
  $("buyPrice").value         = fmt(price);
  $("totalCashUpfront").value = fmt(cashUp);
  $("weeklyPayment").value    = wkPay.toFixed(2);

  /* ── initialise year-0 state ── */
  let propertyValue      = price;
  let sharesValue        = cashUp;
  let capitalOwed        = loanAmt;

  /* arrays for chart / table */
  const labels=[], equityArr=[], sharesArr=[];
  let rows="";

  for (let year = 0; year <= yearsLoan; year++) {

      /* year-specific variables */
      let ownCost=0, incomeRent=0, interest=0,
          depr=0, amort=0, netCF=0;

      /* record BEFORE updates */
      labels.push(`Yr ${year}`);
      equityArr.push(propertyValue - capitalOwed);
      sharesArr.push(sharesValue);

      /* create table row (values will be filled after calc for Y>0) */
      if(year===0){
        rows+=`<tr><td>0</td>
          <td>${fmt(propertyValue)}</td><td>${fmt(sharesValue)}</td>
          <td>${fmt(capitalOwed)}</td><td>${fmt(propertyValue-capitalOwed)}</td>
          <td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td></tr>`;
      }else{

        /* ===== your original calculation block ===== */
        incomeRent = Math.round(propertyValue * rentYld * occ);

        /* value already grown last loop, interest uses opening owed */
        interest   = Math.round(capitalOwed * rLoan);

        const monthlyPayment  = wkPay * 52 / 12;
        amort      = Math.round(wkPay*52 - interest);
        ownCost    = Math.round(propertyValue * (ownPct + agentPct));
        depr       = Math.round(price * buildPct / 40);

        const cashFlow = incomeRent - (ownCost + interest + depr);

        if (cashFlow < 0 && year < yearsRet) {
          netCF = Math.round(cashFlow * (1 - tax) - amort);
        } else {
          netCF = Math.round(incomeRent - (ownCost + interest) - amort);
        }

        sharesValue = Math.round(sharesValue * (1 + rShares) - netCF);

        rows += `<tr>
          <td>${year}</td>
          <td>${fmt(propertyValue)}</td>
          <td>${fmt(sharesValue)}</td>
          <td>${fmt(capitalOwed)}</td>
          <td>${fmt(propertyValue - capitalOwed)}</td>
          <td>${fmt(ownCost)}</td>
          <td>${fmt(incomeRent)}</td>
          <td>${fmt(interest)}</td>
          <td>${fmt(depr)}</td>
          <td>${fmt(amort)}</td>
          <td>${fmt(netCF)}</td></tr>`;
      }

      /* grow for NEXT iteration (skip after final loop) */
      if(year < yearsLoan){
        propertyValue = Math.round(propertyValue * (1 + growProp));
        capitalOwed   = Math.max(0, Math.round(capitalOwed*(1+rLoan) - wkPay*52));
      }
  }

  /* ── inject table ── */
  $("results").innerHTML = `<div class="table-container">
    <table>
      <thead><tr>
        <th>Yr</th><th>Property</th><th>Shares</th><th>Owed</th><th>Equity</th>
        <th>Own&nbsp;Cost</th><th>Rent</th><th>Interest</th><th>Depr.</th>
        <th>Amort.</th><th>Net&nbsp;CF</th></tr></thead>
      <tbody>${rows}</tbody></table>
  </div>`;

  /* ── chart ── */
  if(window.pvChart) pvChart.destroy();
  pvChart = new Chart($("#investmentChart"),{
    type:"line",
    data:{
      labels,
      datasets:[
        {label:"Property Equity", data:equityArr ,
         borderColor:"#28a745", backgroundColor:"rgba(40,167,69,.15)",
         tension:.35, fill:true},
        {label:"Shares Value",   data:sharesArr ,
         borderColor:"#007bff", backgroundColor:"rgba(0,123,255,.15)",
         tension:.35, fill:true}
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:"bottom"}},
      scales:{
        y:{ticks:{callback:v=>fmt(v)}},
        x:{ticks:{autoSkip:true,maxTicksLimit:12}}
      }
    }
  });
}

window.calculate = calculate;
