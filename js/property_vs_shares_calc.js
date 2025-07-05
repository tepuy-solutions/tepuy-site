/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });

/* ---------- main ---------- */
function calculate() {
  /* numeric helpers */
  const num = id => parseFloat($(id).value.replace(/,/g, "")) || 0;
  const pct = id => num(id) / 100;

  /* inputs */
  const loan      = num("loanAmount");
  const dp        = pct("downpayment");
  const costs     = num("buyingCosts");
  const years     = num("loanPeriod");
  const rLoan     = pct("loanInterestRate");
  const ownP      = pct("owningCosts");
  const agentP    = pct("agentFees");
  const occ       = pct("occupancyRate");
  const growP     = pct("propertyAppreciation");
  const rentY     = pct("rentalIncome");
  const rShares   = pct("stockMarketAppreciation");
  const tax       = pct("taxBracket");
  const yrsRet    = num("yearsToRetirement");
  const buildP    = pct("buildingComponent");

  /* derived upfront figures */
  const lmiPct = dp >= 0.2 ? 0 : 0.02;                 // simple LMI curve
  const propPrice = Math.round(loan / (1 - dp));
  const lmiAmt = Math.round(propPrice * lmiPct);
  const upfront = Math.round(dp * propPrice + costs + lmiAmt);

  /* weekly mortgage payment */
  const mRate = rLoan / 12;
  const payWeekly = loan * mRate * Math.pow(1 + mRate, years * 12) /
                    (Math.pow(1 + mRate, years * 12) - 1) * 12 / 52;

  /* quick outputs */
  $("lmiPercentage").value    = (lmiPct * 100).toFixed(1);
  $("lmiAmount").value        = fmt(lmiAmt);
  $("buyPrice").value         = fmt(propPrice);
  $("totalCashUpfront").value = fmt(upfront);
  $("weeklyPayment").value    = payWeekly.toFixed(2);

  /* projection arrays */
  const labels = [], equityArr = [], sharesArr = [];
  let propVal = propPrice, shares = upfront, owed = loan, tableRows = "";

  for (let y = 0; y <= years; y++) {
    const rent = Math.round(propVal * rentY * occ);
    const interest = Math.round(owed * rLoan);
    let own = 0, depr = 0, amort = 0, net = 0;

    if (y > 0) {
      own  = Math.round(propVal * (ownP + agentP));
      depr = Math.round(propPrice * buildP / 40);
      amort = Math.round(payWeekly * 52 - interest);
      const cashFlow = rent - (own + interest + depr);
      net = (cashFlow < 0 && y < yrsRet) ?
            Math.round(cashFlow * (1 - tax) - amort) :
            Math.round(rent - own - interest - amort);
      shares = Math.round(shares * (1 + rShares) - net);
    }

    labels.push("Yr " + y);
    equityArr.push(propVal - owed);
    sharesArr.push(shares);

    tableRows += `
      <tr>
        <td>${y}</td><td>${fmt(propVal)}</td><td>${fmt(shares)}</td>
        <td>${fmt(owed)}</td><td>${fmt(propVal - owed)}</td>
        <td>${fmt(own)}</td><td>${fmt(rent)}</td><td>${fmt(interest)}</td>
        <td>${fmt(depr)}</td><td>${fmt(amort)}</td><td>${fmt(net)}</td>
      </tr>`;

    /* rollover to next year */
    propVal = Math.round(propVal * (1 + growP));
    owed    = Math.max(0, Math.round(owed + owed * rLoan - payWeekly * 52));
  }

  /* insert table */
  $("results").innerHTML = `
    <table>
      <thead><tr>
        <th>Yr</th><th>Property</th><th>Shares</th><th>Owed</th><th>Equity</th>
        <th>Own&nbsp;Cost</th><th>Rent</th><th>Interest</th>
        <th>Depr.</th><th>Amort.</th><th>Net CF</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>`;

  /* chart */
  const ctx = $("investmentChart").getContext("2d");
  if (window.investChart) window.investChart.destroy();
  window.investChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Equity", data: equityArr,   borderColor:"#4CAF50",
          backgroundColor:"rgba(76,175,80,.15)", tension:.35, fill:true },
        { label: "Shares", data: sharesArr,   borderColor:"#2196F3",
          backgroundColor:"rgba(33,150,243,.15)", tension:.35, fill:true }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:"bottom" } },
      scales:{
        y:{ ticks:{ callback:v=>"$"+fmt(v) } },
        x:{ ticks:{ autoSkip:true,maxTicksLimit:12 } }
      }
    }
  });
}

/* expose for button */
window.calculate = calculate;
