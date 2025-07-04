/* ============================================================== */
/*  Property-vs-Shares Calculator – Tepuy Solutions (July 2025)   */
/* ============================================================== */

/* ---------- helper: format with commas ---------- */
const fmt = n => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });

/* ---------- helper: build one table row ---------- */
function row(y, p, s, owed, eq, own, rent, int, depr, amort, net) {
  return `<tr>
      <td>${y}</td><td>${fmt(p)}</td><td>${fmt(s)}</td><td>${fmt(owed)}</td>
      <td>${fmt(eq)}</td><td>${fmt(own)}</td><td>${fmt(rent)}</td>
      <td>${fmt(int)}</td><td>${fmt(depr)}</td><td>${fmt(amort)}</td>
      <td>${fmt(net)}</td></tr>`;
}

/* ---------- comma-format two big inputs ---------- */
["loanAmount", "buyingCosts"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", () => {
    const raw = el.value.replace(/,/g, "");
    if (!isNaN(raw) && raw !== "") el.value = Number(raw).toLocaleString();
  });
});

/* ------------------------------------------------- */
/*  MAIN                                              */
/* ------------------------------------------------- */
function calculate() {
  /* grab numeric helper */
  const num = id =>
    parseFloat(document.getElementById(id).value.replace(/,/g, ""));

  /* inputs */
  const loan          = num("loanAmount");
  const downPct       = num("downpayment") / 100;
  const buyCosts      = num("buyingCosts");
  const years         = num("loanPeriod");
  const rate          = num("loanInterestRate") / 100;
  const ownPct        = num("owningCosts") / 100;
  const agentPct      = num("agentFees") / 100;
  const occupancy     = num("occupancyRate") / 100;
  const propApp       = num("propertyAppreciation") / 100;
  const rentYield     = num("rentalIncome") / 100;
  const sharesReturn  = num("stockMarketAppreciation") / 100;
  const buildPct      = num("buildingComponent") / 100;
  const tax           = num("taxBracket") / 100;
  const yrsToRet      = num("yearsToRetirement");

  /* quick calcs */
  const lmiPct   = downPct >= 0.20 ? 0 :
                   -(0.046 - 0.01) / (0.196 - 0.05) * downPct + 0.058;
  const lmiAmt   = Math.round(loan * lmiPct / (1 + lmiPct));
  const buyPrice = Math.round(loan / ((1 - downPct) * (1 + lmiPct)));
  const upfront  = Math.round(downPct * buyPrice + buyCosts);
  const wkPay    = (((rate / 12) * loan * Math.pow(1 + rate / 12, years * 12)) /
                   (Math.pow(1 + rate / 12, years * 12) - 1)) * 12 / 52;

  /* update quick-output boxes */
  const q = id => (document.getElementById(id).value = "");
  q("lmiPercentage"); q("lmiAmount"); q("buyPrice");
  q("totalCashUpfront"); q("weeklyPayment");

  document.getElementById("lmiPercentage").value = (lmiPct * 100).toFixed(2);
  document.getElementById("lmiAmount").value     = fmt(lmiAmt);
  document.getElementById("buyPrice").value      = fmt(buyPrice);
  document.getElementById("totalCashUpfront").value = fmt(upfront);
  document.getElementById("weeklyPayment").value = wkPay.toFixed(2);

  /* projections */
  let propVal = buyPrice,
      shares  = upfront,
      owed    = loan;

  const labels = [], eqData = [], shData = [];
  let rowsHTML = "";

  for (let y = 0; y <= years; y++) {
    const rent      = Math.round(propVal * rentYield * occupancy);
    const interest  = Math.round(owed * rate);

    let own  = 0, depr = 0, amort = 0, net  = 0;

    if (y > 0) {
      own   = Math.round(propVal * (ownPct + agentPct));
      depr  = Math.round((buyPrice * buildPct) / 40);
      amort = Math.round(wkPay * 52 - interest);

      const cashFlow = rent - (own + interest + depr);
      net = (cashFlow < 0 && y < yrsToRet)
        ? Math.round(cashFlow * (1 - tax) - amort)
        : Math.round(rent - (own + interest) - amort);

      shares = Math.round(shares * (1 + sharesReturn) - net);
    }

    /* push chart points */
    labels.push(`Yr ${y}`);
    eqData.push(propVal - owed);
    shData.push(shares);

    /* build table row */
    rowsHTML += row(
      y, propVal, shares, owed, propVal - owed,
      own, rent, interest, depr, amort, net
    );

    /* update for next year */
    propVal = Math.round(propVal * (1 + propApp));
    owed    = Math.round(owed * (1 + rate) - wkPay * 52);
  }

  /* ---- inject table ---- */
  document.getElementById("results").innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Year</th><th>Property</th><th>Shares</th><th>Capital Owed</th>
            <th>Equity</th><th>Own Costs</th><th>Rent</th><th>Interest</th>
            <th>Deprec.</th><th>Amort.</th><th>Net CF</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
      </table>
    </div>`;

  /* ---- draw / update chart ---- */
  const canvas = document.getElementById("investmentChart");
  if (!canvas) {
    console.error("Canvas #investmentChart not found");
    return;
  }
  const ctx = canvas.getContext("2d");

  try {
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
          y: { ticks: { callback: v => fmt(v) } }
        },
        plugins: {
          legend: { position: "top" }
        }
      }
    });
  } catch (err) {
    console.error("Chart build failed:", err);
  }
}

/* ---------- expose for HTML button ---------- */
window.calculate = calculate;
