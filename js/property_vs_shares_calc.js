/* ---------- helper formatting ---------- */
function fmt(n){return n.toLocaleString('en-AU',{maximumFractionDigits:0});}
["loanAmount","buyingCosts"].forEach(id=>{
  const el=document.getElementById(id);
  el.addEventListener("input",()=>{const v=el.value.replace(/,/g,"");if(!isNaN(v)&&v!==""){el.value=Number(v).toLocaleString();}});
});

/* ---------- MAIN CALCULATION ---------- */
function calculate(){
  /* -- grab inputs & convert -- */
  const getNum = id => parseFloat(document.getElementById(id).value.replace(/,/g,""));
  const loanAmount      = getNum("loanAmount");
  const down            = getNum("downpayment")/100;
  const buyCosts        = getNum("buyingCosts");
  const nYears          = getNum("loanPeriod");
  const rate            = getNum("loanInterestRate")/100;
  const ownCost         = getNum("owningCosts")/100;
  const agentFee        = getNum("agentFees")/100;
  const occ             = getNum("occupancyRate")/100;
  const propApp         = getNum("propertyAppreciation")/100;
  const rentYield       = getNum("rentalIncome")/100;
  const sharesReturn    = getNum("stockMarketAppreciation")/100;
  const buildComp       = getNum("buildingComponent")/100;
  const tax             = getNum("taxBracket")/100;
  const yrsToRet        = getNum("yearsToRetirement");

  /* -- quick calcs (same maths you had) -- */
  const lmiPct = down>=.2?0:-(0.046-0.01)/(0.196-0.05)*down+0.058;
  const lmiAmt = Math.round(loanAmount*lmiPct/(1+lmiPct));
  const buyPrice= Math.round(loanAmount/((1-down)*(1+lmiPct)));
  const totalUp = Math.round(down*buyPrice+buyCosts);
  const mRate = rate/12;
  const nPay  = nYears*12;
  const weeklyPay=((mRate*loanAmount*Math.pow(1+mRate,nPay))/(Math.pow(1+mRate,nPay)-1))*12/52;

  /* -- update quick outputs -- */
  ["lmiPercentage","lmiAmount","buyPrice","totalCashUpfront"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("lmiPercentage").value=(lmiPct*100).toFixed(2);
  document.getElementById("lmiAmount").value  =fmt(lmiAmt);
  document.getElementById("buyPrice").value   =fmt(buyPrice);
  document.getElementById("totalCashUpfront").value =fmt(totalUp);
  document.getElementById("weeklyPayment").value =weeklyPay.toFixed(2);

  /* -------- yearly projection -------- */
  let propVal=buyPrice, sharesVal=totalUp, capOwed=loanAmount;
  const lab=[], eqData=[], shData=[];
  let tbl="";
  for(let yr=0;yr<=nYears;yr++){
    const rent = Math.round(propVal*rentYield*occ);
    const interest = Math.round(capOwed*rate);
    if(yr>0){
      const own   = Math.round(propVal*(ownCost+agentFee));
      const depr  = Math.round((buyPrice*buildComp)/40);
      const amort = Math.round(weeklyPay*52-interest);
      const cashF = rent - (own+interest+depr);
      const netCF = (cashF<0&&yr<yrsToRet)?Math.round(cashF*(1-tax)-amort):Math.round(rent-(own+interest)-amort);
      sharesVal   = Math.round(sharesVal*(1+sharesReturn) - netCF);
      tbl += row(yr,propVal,sharesVal,capOwed,propVal-capOwed,own,rent,interest,depr,amort,netCF);
    }else{
      tbl += row(yr,propVal,sharesVal,capOwed,propVal-capOwed,0,0,0,0,0,0);
    }
    /* push chart points */
    lab.push(`Yr ${yr}`);
    eqData.push(propVal-capOwed);
    shData.push(sharesVal);

    /* update for next loop */
    if(yr>0) propVal = Math.round(propVal*(1+propApp));
    if(yr>0) capOwed = Math.round(capOwed*(1+rate) - weeklyPay*52);
  }

  /* inject table */
  document.getElementById("results").innerHTML=
    `<div class="table-container"><table><thead>
      <tr><th>Year</th><th>Property</th><th>Shares</th><th>Capital Owed</th><th>Equity</th><th>Own Costs</th><th>Rent</th><th>Interest</th><th>Deprec.</th><th>Amort.</th><th>Net CF</th></tr>
     </thead><tbody>${tbl}</tbody></table></div>`;

  /* draw / update chart */
  const ctx=document.getElementById("investmentChart").getContext("2d");
  if(window.equityChart)window.equityChart.destroy();
  window.equityChart=new Chart(ctx,{
    type:"line",
    data:{labels:lab,datasets:[
      {label:"Equity",data:eqData,fill:true,backgroundColor:"rgba(40,167,69,.2)",borderColor:"#28a745",tension:.3},
      {label:"Shares Value",data:shData,fill:true,backgroundColor:"rgba(23,162,184,.2)",borderColor:"#17a2b8",tension:.3}
    ]},
    options:{
      responsive:true,
      maintainAspectRatio:false,
      interaction:{mode:"index",intersect:false},
      plugins:{legend:{position:"top"}},
      scales:{y:{ticks:{callback:v=>fmt(v)}}}
    }
  });
}

/* helper to build table row */
function row(y,p,s,cq,eq,own,rent,int,depr,amort,net){
  return `<tr><td>${y}</td><td>${fmt(p)}</td><td>${fmt(s)}</td><td>${fmt(cq)}</td><td>${fmt(eq)}</td>
          <td>${fmt(own)}</td><td>${fmt(rent)}</td><td>${fmt(int)}</td><td>${fmt(depr)}</td><td>${fmt(amort)}</td><td>${fmt(net)}</td></tr>`;
}

/* expose for button */
window.calculate = calculate;
