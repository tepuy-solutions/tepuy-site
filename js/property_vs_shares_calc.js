/* ---------------- helpers ---------------- */
const $  = id => document.getElementById(id);
const fmt= n  => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
const num= id => parseFloat($(id).value.replace(/,/g,"")) || 0;
const pct= id => num(id) / 100;

/* ---------------- main ------------------- */
function calculate(){

  /* ---- inputs ---- */
  const loan        = num("loanAmount");
  const dpPct       = pct("downpayment");
  const costs       = num("buyingCosts");
  const yearsLoan   = num("loanPeriod");
  const rLoan       = pct("loanInterestRate");
  const ownPct      = pct("owningCosts");
  const agentPct    = pct("agentFees");
  const occ         = pct("occupancyRate");
  const growProp    = pct("propertyAppreciation");
  const yieldRent   = pct("rentalIncome");
  const rShares     = pct("stockMarketAppreciation");
  const buildPct    = pct("buildingComponent");
  const tax         = pct("taxBracket");
  const yearsRet    = num("yearsToRetirement");

  /* ---- derived upfront ---- */
  const lmiPct  = dpPct >= .20 ? 0
                : -(0.046-0.01)/(0.196-0.05)*dpPct + 0.058;       // same sliding formula
  const lmiAmt  = Math.round(loan * lmiPct / (1+lmiPct));
  const price   = Math.round(loan / ((1-dpPct)*(1+lmiPct)));
  const cashUp  = Math.round(dpPct*price + costs);
  const wkPay   = (((rLoan/12)*loan*Math.pow(1+rLoan/12,yearsLoan*12)) /
                   (Math.pow(1+rLoan/12,yearsLoan*12)-1))*12/52;

  /* ---- quick outputs ---- */
  $("lmiPercentage").value   = (lmiPct*100).toFixed(2);
  $("lmiAmount").value       = fmt(lmiAmt);
  $("buyPrice").value        = fmt(price);
  $("totalCashUpfront").value= fmt(cashUp);
  $("weeklyPayment").value   = wkPay.toFixed(2);

  /* ---- projection loop ---- */
  let propVal = price,
      owed    = loan,
      shares  = cashUp;

  let rows="", labels=[], equityArr=[], sharesArr=[];

  for(let y=0; y<=yearsLoan; y++){
      /*  record before mutations */
      labels.push(`Yr ${y}`);
      equityArr.push(propVal - owed);
      sharesArr.push(shares);

      rows += `<tr>
        <td>${y}</td>
        <td>${fmt(propVal)}</td>
        <td>${fmt(shares)}</td>
        <td>${fmt(owed)}</td>
        <td>${fmt(propVal - owed)}</td>`;

      /* financials start in Y1 */
      let ownCost=0, rent=0, interest=0, depr=0, amort=0, netCF=0;

      if(y>0){
        rent      = Math.round(propVal*yieldRent*occ);
        interest  = Math.round(owed*rLoan);
        ownCost   = Math.round(propVal*(ownPct+agentPct));
        depr      = Math.round(price*buildPct/40);
        amort     = Math.round(wkPay*52 - interest);

        const cash = rent - (ownCost + interest + depr);
        netCF = (cash<0 && y<yearsRet) ? Math.round(cash*(1-tax) - amort)
                                       : Math.round(rent - (ownCost+interest) - amort);
        shares = Math.round(shares*(1+rShares) - netCF);

        propVal  = Math.round(propVal*(1+growProp));
        owed     = Math.max(0, Math.round(owed*(1+rLoan) - wkPay*52));
      }

      rows += `<td>${fmt(ownCost)}</td><td>${fmt(rent)}</td><td>${fmt(interest)}</td>
               <td>${fmt(depr)}</td><td>${fmt(amort)}</td><td>${fmt(netCF)}</td></tr>`;
  }

  /* ---- inject table ---- */
  $("results").innerHTML = `<div class="table-container">
    <table>
      <thead><tr>
        <th>Yr</th><th>Property</th><th>Shares</th><th>Owed</th><th>Equity</th>
        <th>Own Costs</th><th>Rent</th><th>Interest</th><th>Depr.</th>
        <th>Amort.</th><th>Net CF</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;

  /* ---- chart ---- */
  if(window.pvChart) window.pvChart.destroy();
  pvChart = new Chart($("#investmentChart"),{
    type:"line",
    data:{
      labels,
      datasets:[
        {label:"Equity", data:equityArr, borderColor:"#28a745",
         backgroundColor:"rgba(40,167,69,.15)", tension:.35, fill:true},
        {label:"Shares", data:sharesArr, borderColor:"#007bff",
         backgroundColor:"rgba(0,123,255,.15)", tension:.35, fill:true}
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:"bottom", labels:{boxWidth:14}}},
      scales:{
        y:{ticks:{callback:v=>fmt(v)}},
        x:{ticks:{autoSkip:true,maxTicksLimit:12}}
      }
    }
  });
}

window.calculate = calculate;
