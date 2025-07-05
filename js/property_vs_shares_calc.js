const $$ = id => document.getElementById(id);
const fmt = n => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });

function calculate() {
  const num = id => parseFloat($$(id).value.replace(/,/g, "")) || 0;
  const pct = id => num(id) / 100;

  const loan  = num("loanAmount");
  const dp    = pct("downpayment");
  const costs = num("buyingCosts");
  const yrs   = num("loanPeriod");
  const rate  = pct("loanInterestRate");
  const ownP  = pct("owningCosts");
  const agent = pct("agentFees");
  const occ   = pct("occupancyRate");
  const grow  = pct("propertyAppreciation");
  const yield = pct("rentalIncome");
  const share = pct("stockMarketAppreciation");
  const build = pct("buildingComponent");
  const tax   = pct("taxBracket");
  const yrsRet= num("yearsToRetirement");

  const lmiPct = dp >= 0.2 ? 0 : -(0.046 - 0.01)/(0.196 - 0.05)*dp + 0.058;
  const lmi    = Math.round(loan * lmiPct / (1 + lmiPct));
  const price  = Math.round(loan / ((1 - dp) * (1 + lmiPct)));
  const upfront= Math.round(dp * price + costs);
  const wkPay  = (((rate/12)*loan*Math.pow(1+rate/12,yrs*12))/(Math.pow(1+rate/12,yrs*12)-1))*12/52;

  $$("lmiPercentage").value   = (lmiPct*100).toFixed(2);
  $$("lmiAmount").value       = fmt(lmi);
  $$("buyPrice").value        = fmt(price);
  $$("totalCashUpfront").value= fmt(upfront);
  $$("weeklyPayment").value   = wkPay.toFixed(2);

  let rows="", labels=[], equityArr=[], sharesArr=[];
  let pVal=price, shares=upfront, owed=loan;

  for(let y=0;y<=yrs;y++){
    const rent = Math.round(pVal*yield*occ);
    const interest = Math.round(owed*rate);
    let own=0,depr=0,amort=0,net=0;

    if(y>0){
      own  = Math.round(pVal*(ownP+agent));
      depr = Math.round(price*build/40);
      amort= Math.round(wkPay*52 - interest);
      const cash = rent - (own+interest+depr);
      net = (cash<0 && y<yrsRet) ? Math.round(cash*(1-tax)-amort)
                                 : Math.round(rent-(own+interest)-amort);
      shares = Math.round(shares*(1+share) - net);
    }

    rows += `<tr><td>${y}</td><td>${fmt(pVal)}</td><td>${fmt(shares)}</td>
             <td>${fmt(owed)}</td><td>${fmt(pVal-owed)}</td>
             <td>${fmt(own)}</td><td>${fmt(rent)}</td><td>${fmt(interest)}</td>
             <td>${fmt(depr)}</td><td>${fmt(amort)}</td><td>${fmt(net)}</td></tr>`;

    labels.push(`Yr ${y}`);
    equityArr.push(pVal-owed);
    sharesArr.push(shares);

    pVal = Math.round(pVal*(1+grow));
    owed = Math.round(owed*(1+rate) - wkPay*52);
  }

  $$("results").innerHTML = `
    <div class="table-container">
      <table><thead><tr>
        <th>Yr</th><th>Property</th><th>Shares</th><th>Owed</th><th>Equity</th>
        <th>Own Costs</th><th>Rent</th><th>Interest</th><th>Depr.</th>
        <th>Amort.</th><th>Net CF</th></tr></thead>
        <tbody>${rows}</tbody></table>
    </div>`;

  const ctx=$$("pvChart").getContext("2d");
  if(window.pvChart) window.pvChart.destroy();
  window.pvChart=new Chart(ctx,{
    type:"line",
    data:{
      labels,
      datasets:[
        {label:"Equity",data:equityArr,borderColor:"#28a745",backgroundColor:"rgba(40,167,69,.2)",fill:true,tension:.35},
        {label:"Shares",data:sharesArr,borderColor:"#007bff",backgroundColor:"rgba(0,123,255,.2)",fill:true,tension:.35}
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{boxWidth:14}}},
      scales:{
        y:{ticks:{callback:v=>fmt(v)}},
        x:{ticks:{autoSkip:true,maxTicksLimit:12}}
      }
    }
  });
}

window.calculate = calculate;
