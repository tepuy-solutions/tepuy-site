/* Tepuy Solutions – Property vs Shares logic  ------------------ */

/* helper: format with commas */
const fmt = n => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });

/* helper: build one table row */
function row(y, p, s, owed, eq, own, rent, int, depr, amort, net) {
  return `<tr>
    <td>${y}</td><td>${fmt(p)}</td><td>${fmt(s)}</td><td>${fmt(owed)}</td>
    <td>${fmt(eq)}</td><td>${fmt(own)}</td><td>${fmt(rent)}</td>
    <td>${fmt(int)}</td><td>${fmt(depr)}</td><td>${fmt(amort)}</td>
    <td>${fmt(net)}</td></tr>`;
}

/* comma-format big money inputs */
["loanAmount", "buyingCosts"].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener("input", () => {
    const raw = el.value.replace(/,/g, "");
    if (!isNaN(raw) && raw !== "") el.value = Number(raw).toLocaleString();
  });
});

function calculate() {
  const n = id => parseFloat(document.getElementById(id).value.replace(/,/g, ""));

  /* inputs */
  const loan = n("loanAmount"),
        dp   = n("downpayment") / 100,
        costs= n("buyingCosts"),
        yrs  = n("loanPeriod"),
        r    = n("loanInterestRate") / 100,
        ownP = n("owningCosts") / 100,
        agent= n("agentFees") / 100,
        occ  = n("occupancyRate") / 100,
        app  = n("propertyAppreciation") / 100,
        yield= n("rentalIncome") / 100,
        share= n("stockMarketAppreciation") / 100,
        build= n("buildingComponent") / 100,
        tax  = n("taxBracket") / 100,
        yrsRet = n("yearsToRetirement");

  /* quick calcs */
  const lmiPct = dp >= .2 ? 0 : -(0.046 - 0.01)/(0.196 - 0.05)*dp + 0.058;
  const lmi    = Math.round(loan * lmiPct / (1 + lmiPct));
  const price  = Math.round(loan / ((1 - dp) * (1 + lmiPct)));
  const upfront= Math.round(dp * price + costs);
  const wkPay  = (((r/12) * loan * Math.pow(1+r/12, yrs*12)) /
                 (Math.pow(1+r/12, yrs*12)-1)) * 12 / 52;

  /* update quick-outputs */
  document.getElementById("lmiPercentage").value = (lmiPct*100).toFixed(2);
  document.getElementById("lmiAmount").value     = fmt(lmi);
  document.getElementById("buyPrice").value      = fmt(price);
  document.getElementById("totalCashUpfront").value = fmt(upfront);
  document.getElementById("weeklyPayment").value = wkPay.toFixed(2);

  /* projection loop */
  let pVal = price, shares = upfront, owed = loan,
      labels=[], eqArr=[], shArr=[], rows="";

  for (let y=0; y<=yrs; y++) {
    const rent     = Math.round(pVal * yield * occ);
    const interest = Math.round(owed * r);

    let own=0,depr=0,amort=0,net=0;
    if (y>0) {
      own  = Math.round(pVal*(ownP+agent));
      depr = Math.round(price*build/40);
      amort= Math.round(wkPay*52 - interest);
      const cash = rent - (own+interest+depr);
      net = (cash<0 && y<yrsRet) ? Math.round(cash*(1-tax)-amort)
                                 : Math.round(rent - (own+interest) - amort);
      shares = Math.round(shares*(1+share) - net);
    }

    labels.push(`Yr ${y}`);
    eqArr.push(pVal-owed);
    shArr.push(shares);
    rows += row(y,pVal,shares,owed,pVal-owed,own,rent,interest,depr,amort,net);

    pVal = Math.round(pVal*(1+app));
    owed = Math.round(owed*(1+r) - wkPay*52);
  }

  /* inject table */
  document.getElementById("results").innerHTML = `
    <div class="table-container">
      <table>
        <thead><tr>
          <th>Year</th><th>Property</th><th>Shares</th><th>Capital Owed</th>
          <th>Equity</th><th>Own Costs</th><th>Rent</th><th>Interest</th>
          <th>Deprec.</th><th>Amort.</th><th>Net CF</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  /* chart */
  const ctx = document.getElementById("investmentChart").getContext("2d");
  if (window.eqChart) window.eqChart.destroy();
  window.eqChart = new Chart(ctx,{
    type:"line",
    data:{labels,
      datasets:[
        {label:"Equity",data:eqArr,fill:true,
         backgroundColor:"rgba(40,167,69,.25)",borderColor:"#28a745",tension:.35},
        {label:"Shares Value",data:shArr,fill:true,
         backgroundColor:"rgba(23,162,184,.25)",borderColor:"#17a2b8",tension:.35}
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      interaction:{mode:"index",intersect:false},
      scales:{y:{ticks:{callback:v=>fmt(v)}}}
    }
  });
}

/* expose for button */
window.calculate = calculate;
