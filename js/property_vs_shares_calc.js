function fmt(n) {
  return n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
}

function calculate() {
  const get = id => parseFloat(document.getElementById(id).value.replace(/,/g, ""));

  const loan = get("loanAmount");
  const dp = get("downpayment") / 100;
  const costs = get("buyingCosts");
  const yrs = get("loanPeriod");
  const r = get("loanInterestRate") / 100;
  const ownP = get("owningCosts") / 100;
  const agent = get("agentFees") / 100;
  const occ = get("occupancyRate") / 100;
  const app = get("propertyAppreciation") / 100;
  const yield = get("rentalIncome") / 100;
  const share = get("stockMarketAppreciation") / 100;
  const build = get("buildingComponent") / 100;
  const tax = get("taxBracket") / 100;
  const yrsRet = get("yearsToRetirement");

  const lmiPct = dp >= 0.2 ? 0 : -(0.046 - 0.01) / (0.196 - 0.05) * dp + 0.058;
  const lmi = Math.round(loan * lmiPct / (1 + lmiPct));
  const price = Math.round(loan / ((1 - dp) * (1 + lmiPct)));
  const upfront = Math.round(dp * price + costs);
  const wkPay = (((r / 12) * loan * Math.pow(1 + r / 12, yrs * 12)) / (Math.pow(1 + r / 12, yrs * 12) - 1)) * 12 / 52;

  document.getElementById("lmiPercentage").value = (lmiPct * 100).toFixed(2);
  document.getElementById("lmiAmount").value = fmt(lmi);
  document.getElementById("buyPrice").value = fmt(price);
  document.getElementById("totalCashUpfront").value = fmt(upfront);
  document.getElementById("weeklyPayment").value = wkPay.toFixed(2);

  let pVal = price, shares = upfront, owed = loan, rows = "";

  for (let y = 0; y <= yrs; y++) {
    const rent = Math.round(pVal * yield * occ);
    const interest = Math.round(owed * r);

    let own = 0, depr = 0, amort = 0, net = 0;

    if (y > 0) {
      own = Math.round(pVal * (ownP + agent));
      depr = Math.round(price * build / 40);
      amort = Math.round(wkPay * 52 - interest);
      const cash = rent - (own + interest + depr);
      net = (cash < 0 && y < yrsRet)
        ? Math.round(cash * (1 - tax) - amort)
        : Math.round(rent - (own + interest) - amort);
      shares = Math.round(shares * (1 + share) - net);
    }

    rows += `<tr>
      <td>${y}</td>
      <td>${fmt(pVal)}</td>
      <td>${fmt(shares)}</td>
      <td>${fmt(owed)}</td>
      <td>${fmt(pVal - owed)}</td>
      <td>${fmt(own)}</td>
      <td>${fmt(rent)}</td>
      <td>${fmt(interest)}</td>
      <td>${fmt(depr)}</td>
      <td>${fmt(amort)}</td>
      <td>${fmt(net)}</td>
    </tr>`;

    pVal = Math.round(pVal * (1 + app));
    owed = Math.round(owed * (1 + r) - wkPay * 52);
  }

  document.getElementById("results").innerHTML = `
    <div class="table-container">
      <table>
        <thead><tr>
          <th>Year</th><th>Property</th><th>Shares</th><th>Capital Owed</th>
          <th>Equity</th><th>Own Costs</th><th>Rent</th><th>Interest</th>
          <th>Deprec.</th><th>Amort.</th><th>Net CF</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

window.calculate = calculate;
