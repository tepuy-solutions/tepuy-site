/* ───── helper functions ───── */
const num = v => parseFloat(v.toString().replace(/,/g, "")) || 0;
const fmt = n => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });

/* ───── main calculate ───── */
function calculate () {
  /* === read & convert inputs === */
  const loan     = num(loanAmount.value);
  const dpPct    = num(downpayment.value) / 100;
  const costs    = num(buyingCosts.value);
  const years    = num(loanPeriod.value);
  const rate     = num(loanInterestRate.value) / 100;
  const ownCost  = num(owningCosts.value) / 100;
  const agent    = num(agentFees.value)  / 100;
  const occ      = num(occupancyRate.value) / 100;
  const grow     = num(propertyAppreciation.value) / 100;
  const yieldPct = num(rentalIncome.value) / 100;
  const shareR   = num(stockMarketAppreciation.value) / 100;
  const tax      = num(taxBracket.value) / 100;
  const yrsRet   = num(yearsToRetirement.value);
  const bldPct   = num(buildingComponent.value) / 100;

  /* === one-off up-front calcs === */
  const lmiPct = dpPct >= 0.2 ? 0 :
    -(0.046 - 0.01) / (0.196 - 0.05) * dpPct + 0.058;
  const lmi     = Math.round(loan * lmiPct / (1 + lmiPct));
  const price   = Math.round(loan / ((1 - dpPct) * (1 + lmiPct)));
  const upfront = Math.round(price * dpPct + costs);
  const wkPay = (((rate/12)*loan*Math.pow(1+rate/12,years*12)) /
                (Math.pow(1+rate/12,years*12)-1)) * 12 / 52;

  /* === show quick outputs === */
  lmiPercentage.value     = (lmiPct*100).toFixed(2);
  lmiAmount.value         = fmt(lmi);
  buyPrice.value          = fmt(price);
  totalCashUpfront.value  = fmt(upfront);
  weeklyPayment.value     = wkPay.toFixed(2);

  /* === projection loop === */
  let propVal = price;          // property market value
  let shares  = upfront;        // alt-investment
  let owed    = loan;           // outstanding loan balance

  let labels = [], equityArr = [], shareArr = [], rows = "";

  for (let y = 0; y <= years; y++) {
    /* year-specific figures */
    const rent   = y ? Math.round(propVal * yieldPct * occ) : 0;
    const intPay = y && y <= years ? Math.round(owed * rate) : 0;
    const own    = y ? Math.round(propVal * (ownCost + agent)) : 0;
    const depr   = y ? Math.round(price * bldPct / 40) : 0;
    const amort  = y ? Math.round(wkPay*52 - intPay) : 0;

    let netCF = 0;
    if (y) {
      const cash = rent - (own + intPay + depr);
      netCF = cash < 0 && y < yrsRet
                ? Math.round(cash * (1 - tax) - amort)
                : Math.round(rent - own - intPay - amort);
      shares = Math.round(shares * (1 + shareR) - netCF);
    }

    const equity = propVal - owed;

    /* build table row */
    rows += `
      <tr><td>${y}</td><td>${fmt(propVal)}</td><td>${fmt(shares)}</td>
      <td>${fmt(owed)}</td><td>${fmt(equity)}</td>
      <td>${fmt(own)}</td><td>${fmt(rent)}</td><td>${fmt(intPay)}</td>
      <td>${fmt(depr)}</td><td>${fmt(amort)}</td><td>${fmt(netCF)}</td></tr>`;

    /* push chart data */
    labels.push(`Yr ${y}`);
    equityArr.push(equity);
    shareArr.push(shares);

    /* advance to next year */
    if (y) {
      propVal = Math.round(propVal * (1 + grow));
      owed    = y <= years ? Math.round(owed * (1 + rate) - wkPay*52) : 0;
    }
  }

  /* === inject results table === */
  results.innerHTML = `
    <table><thead><tr>
      <th>Yr</th><th>Property</th><th>Shares</th><th>Owed</th><th>Equity</th>
      <th>Own&nbsp;Cost</th><th>Rent</th><th>Interest</th>
      <th>Depr.</th><th>Amort.</th><th>Net&nbsp;CF</th>
    </tr></thead><tbody>${rows}</tbody></table>`;

  /* === chart === */
  if (window.pvChart) window.pvChart.destroy();
  window.pvChart = new Chart(investmentChart.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Equity",  data: equityArr, borderColor: "#007bff",
          backgroundColor: "rgba(0,123,255,.15)", fill: true, tension: .3 },
        { label: "Shares",  data: shareArr,  borderColor: "#28a745",
          backgroundColor: "rgba(40,167,69,.15)", fill: true, tension: .3 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" }},
      scales: {
        y: { ticks: { callback: v => fmt(v) } },
        x: { ticks: { autoSkip: true, maxTicksLimit: 12 }}
      }
    }
  });
}

/* expose globally */
window.calculate = calculate;
