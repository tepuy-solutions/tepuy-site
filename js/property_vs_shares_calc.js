/* ---------- helpers ---------- */
const $   = id => document.getElementById(id);
const fmt = n  => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
const num = id => parseFloat($(id).value.replace(/,/g, "")) || 0;
const pct = id => num(id) / 100;

/* ---------- main ------------- */
function calculate () {

  /* === INPUTS === */
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

  /* === UP-FRONT FIGURES === */
  const lmiPct = dpPct >= .20 ? 0
    : -(0.046-0.01)/(0.196-0.05)*dpPct + 0.058;

  const lmiAmt = Math.round(loanAmt * lmiPct / (1+lmiPct));
  const price  = Math.round(loanAmt / ((1-dpPct)*(1+lmiPct)));
  const cashUp = Math.round(dpPct*price + buyCosts);
  const wkPay  = (((rLoan/12)*loanAmt*Math.pow(1+rLoan/12,yearsLoan*12)) /
                 (Math.pow(1+rLoan/12,yearsLoan*12)-1))*12/52;

  $("lmiPercentage").value    = (lmiPct*100).toFixed(2);
  $("lmiAmount").value        = fmt(lmiAmt);
  $("buyPrice").value         = fmt(price);
  $("totalCashUpfront").value = fmt(cashUp);
  $("weeklyPayment").value    = wkPay.toFixed(2);

  /* === YEAR-BY-YEAR LOOP === */
  let propVal = price;          // opening value year 0
  let shares  = cashUp;         // cash invested in shares
  let owed    = loanAmt;

  const labels=[], equityArr=[], sharesArr=[];
  let rows="";

  for (let y = 0; y <= yearsLoan; y++) {

    /* ----- values that rely on *opening* prop & debt ----- */
    const rent      = (y === 0) ? 0
                     : Math.round(propVal * rentYld * occ);           // prev-year value
    const interest  = (y === 0) ? 0
                     : Math.round(owed * rLoan);

    /* ----- grow property for *this* year ----- */
    if (y > 0) propVal = Math.round(propVal * (1 + growProp));

    /* owning costs, depreciation use NEW value */
    const ownCost   = (y === 0) ? 0
                     : Math.round(propVal * (ownPct + agentPct));
    const depr      = (y === 0) ? 0 : Math.round(price * buildPct / 40);

    /* amortisation after interest */
    const amort     = (y === 0) ? 0
                     : Math.round(wkPay*52 - interest);

    /* update loan balance for next loop */
    if (y > 0) {
      owed = Math.max(0, Math.round(owed*(1+rLoan) - wkPay*52));
    }

    /* equity now that prop value updated */
    const equity = propVal - owed;

    /* taxable cash-flow & net CF (negative gearing) */
    const cashFlow = rent - (ownCost + interest + depr);
    let netCF;
    if (cashFlow < 0 && y < yearsRet && y > 0) {
      netCF = Math.round(cashFlow * (1 - tax) - amort);
    } else {
      netCF = Math.round(rent - (ownCost + interest) - amort);
    }

    /* compound shares after applying net CF */
    if (y > 0) shares = Math.round(shares * (1 + rShares) - netCF);

    /* arrays for chart */
    labels.push(`Yr ${y}`);
    equityArr.push(equity);
    sharesArr.push(shares);

    /* build table row */
    rows += `<tr>
      <td>${y}</td>
      <td>${fmt(propVal)}</td>
      <td>${fmt(shares)}</td>
      <td>${fmt(owed)}</td>
      <td>${fmt(equity)}</td>
      <td>${fmt(ownCost)}</td>
      <td>${fmt(rent)}</td>
      <td>${fmt(interest)}</td>
      <td>${fmt(depr)}</td>
      <td>${fmt(amort)}</td>
      <td>${fmt(netCF)}</td>
    </tr>`;
  }

  /* === inject table === */
  $("results").innerHTML = `
    <div class="table-container">
      <table>
        <thead><tr>
          <th>Yr</th><th>Property Value</th><th>Shares Value</th><th>Capital Owed</th><th>Equity</th>
          <th>Own Costs</th><th>Rent</th><th>Interest</th><th>Depr.</th><th>Amort.</th><th>Net CF</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  /* === chart === */
  if (window.pvChart) pvChart.destroy();
  pvChart = new Chart($("#investmentChart"), {
    type : "line",
    data : {
      labels,
      datasets : [
        { label : "Property Equity", data : equityArr ,
          borderColor : "#28a745", backgroundColor : "rgba(40,167,69,.15)",
          tension : .35, fill : true },
        { label : "Shares Value",   data : sharesArr ,
          borderColor : "#007bff", backgroundColor : "rgba(0,123,255,.15)",
          tension : .35, fill : true }
      ]
    },
    options : {
      responsive : true, maintainAspectRatio : false,
      plugins    : { legend : { position : "bottom" } },
      scales     : {
        y : { ticks : { callback : v => fmt(v) } },
        x : { ticks : { autoSkip : true, maxTicksLimit : 12 } }
      }
    }
  });
}

window.calculate = calculate;
