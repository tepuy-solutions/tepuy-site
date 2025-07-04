/* =========================================================
   Property-vs-Shares Calculator  —  Tepuy Solutions
   ========================================================= */

/* ---------- helpers ------------------------------------ */
const fmt = n => n.toLocaleString('en-AU', { maximumFractionDigits: 0 });

["loanAmount", "buyingCosts"].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener("input", () => {
    const v = el.value.replace(/,/g, "");
    if (!isNaN(v) && v !== "") el.value = Number(v).toLocaleString();
  });
});

/* ---------- quick row builder --------------------------- */
function row(y, p, s, cOwed, eq, own, rent, int, depr, amort, net) {
  return `<tr>
    <td>${y}</td><td>${fmt(p)}</td><td>${fmt(s)}</td><td>${fmt(cOwed)}</td>
    <td>${fmt(eq)}</td><td>${fmt(own)}</td><td>${fmt(rent)}</td>
    <td>${fmt(int)}</td><td>${fmt(depr)}</td><td>${fmt(amort)}</td>
    <td>${fmt(net)}</td></tr>`;
}

/* ---------- MAIN ---------------------------------------- */
function calculate() {
  /* grab values */
  const num = id => parseFloat(document.getElementById(id).value.replace(/,/g, ""));
  const loan = num("loanAmount");
  const down = num("downpayment") / 100;
  const costs = num("buyingCosts");
  const years = num("loanPeriod");
  const rate = num("loanInterestRate") / 100;
  const ownPct = num("owningCosts") / 100;
  const agent = num("agentFees") / 100;
  const occ = num("occupancyRate") / 100;
  const propApp = num("propertyAppreciation") / 100;
  const rentY = num("rentalIncome") / 100;
  const sharesR = num("stockMarketAppreciation") / 100;
  const build = num("buildingComponent") / 100;
  const tax = num("taxBracket") / 100;
  const yrsRet = num("yearsToRetirement");

  /* lender’s mortgage insurance */
  const lmiPct = down >= 0.2 ? 0 : -(0.046 - 0.01) / (0.196 - 0.05) * down + 0.058;
  const lmiAmt = Math.round(loan * lmiPct / (1 + lmiPct));
  const buyPrice = Math.round(loan / ((1 - down) * (1 + lmiPct)));
  const upfront = Math.round(down * buyPrice + costs);
  const weekPay = (((rate / 12) * loan * Math.pow(1 + rate / 12, years * 12))
                  / (Math.pow(1 + rate / 12, years * 12) - 1)) * 12 / 52;

  /* quick outputs */
  const q = id => document.getElementById(id);
  q("lmiPercentage").value = (lmiPct * 100).toFixed(2);
  q("lmiAmount").value = fmt(lmiAmt);
  q("buyPrice").value = fmt(buyPrice);
  q("totalCashUpfront").value = fmt(upfront);
  q("weeklyPayment").value = weekPay.toFixed(2);

  /* projection loop */
  let propVal = buyPrice,
      sharesVal = upfront,
      capOwed = loan,
      labels = [], eqData = [], shData = [], tableRows = "";

  for (let y = 0; y <= years; y++) {

    /* yearly rentals etc. */
    const rent = Math.round(propVal * rentY * occ);
    const interest = Math.round(capOwed * rate);

    let own = 0, depr = 0, amort = 0, net = 0;

    if (y > 0) {
      own  = Math.round(propVal * (ownPct + agent));
      depr = Math.round((buyPrice * build) / 40);
      amort = Math.round(weekPay * 52 - interest);

      const cashFlow = rent - (own + interest + depr);
      net = (cashFlow < 0 && y < yrsRet)
        ? Math.round(cashFlow * (1 - tax) - amort)
        : Math.round(rent - (own + interest) - amort);

      sharesVal = Math.round(sharesVal * (1 + sharesR) - net);
    }

    /* push chart data */
    labels.push(`Yr ${y}`);
    eqData.push(propVal - capOwed);
    shData.push(sharesVal);

    tableRows += row(y, propVal, sharesVal, capOwed, propVal - capOwed,
                     own, rent, interest, depr, amort, net);

    /* next year values */
    propVal = Math.round(propVal * (1 + propApp));
    capOwed = Math.round(capOwed * (1 + rate) - weekPay * 52);
  }

  /* inject table */
  document.getElementById("results").innerHTML =
    `<div class="table-container"><table>
       <thead><tr>
       <th>Year</th><th>Property</th><th>Shares</th><th>Capital Owed</th>
       <th>Equity</th><th>Own Costs</th><th>Rent</th><th>Interest</th>
       <th>Deprec.</th><th>Amort.</th><th>Net CF</th></tr></thead>
       <tbody>${tableRows}</tbody></table></div>`;

  /* build / update chart */
  const canvas = document.getElementById("investmentChart");
  if (!canvas) return;                       // safety check
  const ctx = canvas.getContext("2d");
  if (window.equityChart) window.equityChart.destroy();
  window.equityChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Equity",
          data: eqData,
          fill: true,
          backgroundColor: "rgba(40,167,69,.25)",
          borderColor: "#28a745",
          tension: .35
        },
        {
          label: "Shares Value",
          data: shData,
          fill: true,
          backgroundColor: "rgba(23,162,184,.25)",
          borderColor: "#17a2b8",
          tension: .35
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        y: {
          ticks: { callback: v => fmt(v) }
        }
      }
    }
  });
}

/* expose to HTML button */
window.calculate = calculate;
