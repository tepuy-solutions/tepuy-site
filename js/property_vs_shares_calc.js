/* =========================================================================
   Tepuy Solutions – Property-vs-Shares Calculator
   -------------------------------------------------------------------------
   BASIC : unlimited quick panel + chart
           + full table for the first 10 runs
   PRO   : unlimited + Save Scenario + CSV export
   EXTRA : Optional CGT in retirement year (sellAtRet toggle)
   ------------------------------------------------------------------------- */

/* ---------- helpers ---------- */
const $   = id => document.getElementById(id);
const fmt = n  => n.toLocaleString("en-AU",{maximumFractionDigits:0});
const num = id => parseFloat($(id).value.replace(/,/g,"")) || 0;
const pct = id => num(id) / 100;

/* ---------- global state ---------- */
const FREE_LIMIT = 10;
const usesKey    = "pvProUses";
const paidKey    = "pvProPaid";

let paid = localStorage.getItem(paidKey) === "yes";
let uses = +localStorage.getItem(usesKey) || 0;

let chart;
let csvRows = [];

/* ---------- quick upfront panel ---------- */
function calculateBasic() {
  const loanAmt = num("loanAmount");
  const dpPct   = pct("downpayment");
  const costs   = num("buyingCosts");
  const yrs     = num("loanPeriod");
  const rLoan   = pct("loanInterestRate");

  const lmiPct = dpPct >= 0.20 ? 0
               : -(0.046 - 0.01) / (0.196 - 0.05) * dpPct + 0.058;
  const lmiAmt = Math.round(loanAmt * lmiPct / (1 + lmiPct));
  const price  = Math.round(loanAmt / ((1 - dpPct) * (1 + lmiPct)));
  const cashUp = Math.round(dpPct * price + costs);
  const wkPay  = (((rLoan / 12) * loanAmt *
                  Math.pow(1 + rLoan / 12, yrs * 12)) /
                  (Math.pow(1 + rLoan / 12, yrs * 12) - 1)) * 12 / 52;

  $("lmiPercentage").value    = (lmiPct * 100).toFixed(2);
  $("lmiAmount").value        = fmt(lmiAmt);
  $("buyPrice").value         = fmt(price);
  $("totalCashUpfront").value = fmt(cashUp);
  $("weeklyPayment").value    = wkPay.toFixed(2);

  return { loanAmt, dpPct, costs, yrs, rLoan, price, cashUp, wkPay };
}

/* ---------- full projection ---------- */
function drawProjection(base, showTable) {
  const ownPct   = pct("owningCosts");
  const agentPct = pct("agentFees");
  const occ      = pct("occupancyRate");
  const growProp = pct("propertyAppreciation");
  const rentYld  = pct("rentalIncome");
  const rShares  = pct("stockMarketAppreciation");
  const buildPct = pct("buildingComponent");
  const taxRate  = pct("taxBracket");
  const yrsRet   = num("yearsToRetirement");
  const sellFlag = $("sellAtRet").checked;

  // If selling at retirement, stop at yrsRet; otherwise run full loan period
  const lastYear = $("sellAtRet").checked ? yrsRet : base.yrs;

  let propVal = base.price,
      shares  = base.cashUp,
      owed    = base.loanAmt;

  const labels = [], equityArr = [], sharesArr = [];
  csvRows = [["Year","Property","Shares","Owed","Equity",
              "OwnCosts","Rent","Interest","Depr","Amort","NetCF"]];

  for (let y = 0; y <= lastYear; y++) {
    const rent     = y ? Math.round(propVal * rentYld * occ) : 0;
    const interest = y ? Math.round(owed * base.rLoan)       : 0;
    if (y) propVal = Math.round(propVal * (1 + growProp));
    const ownCost  = y ? Math.round(propVal * (ownPct + agentPct)) : 0;
    const depr     = y ? Math.round(base.price * buildPct / 40)    : 0;
    const amort    = y ? Math.round(base.wkPay * 52 - interest)    : 0;
    if (y) owed    = Math.max(0, Math.round(owed * (1 + base.rLoan) - base.wkPay * 52));

    let equity = propVal - owed;
    const cashFlow = rent - (ownCost + interest + depr);
    const netCF = (cashFlow < 0 && y < yrsRet && y)
                ? Math.round(cashFlow * (1 - taxRate) - amort)
                : Math.round(rent - (ownCost + interest) - amort);

    if (y) shares = Math.round(shares * (1 + rShares) - netCF);

    /* apply CGT in retirement year if toggle is on */
    if (sellFlag && y === yrsRet) {
      const gainProp   = propVal - base.price;
      const gainShares = shares  - base.cashUp;      // simplified cost base
      const cgtProp    = Math.max(0, gainProp   * 0.5 * taxRate);
      const cgtShares  = Math.max(0, gainShares * 0.5 * taxRate);
      equity -= cgtProp;
      shares -= cgtShares;
    }

    labels.push(`Yr ${y}`);
    equityArr.push(equity);
    sharesArr.push(shares);

    csvRows.push([y, propVal, shares, owed, equity,
                  ownCost, rent, interest, depr, amort, netCF]);
  }

  /* ---- chart ---- */
  if (chart) chart.destroy();
  chart = new Chart($("investmentChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Property Equity", data: equityArr,
          borderColor: "#28a745", backgroundColor: "rgba(40,167,69,.15)", fill: true, tension: .35 },
        { label: "Shares Value", data: sharesArr,
          borderColor: "#007bff", backgroundColor: "rgba(0,123,255,.15)", fill: true, tension: .35 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: { ticks: { callback: v => fmt(v) } },
        x: { ticks: { autoSkip: true, maxTicksLimit: 12 } }
      }
    }
  });

  /* ---- table ---- */
  if (showTable) {
    const rows = csvRows.slice(1)
      .map(r => `<tr>${r.map(c => `<td>${fmt(c)}</td>`).join("")}</tr>`).join("");
    $("results").innerHTML =
      `<div class="table-container"><table>
         <thead><tr><th>Yr</th><th>Property Value</th><th>Shares Value</th>
         <th>Capital Owed</th><th>Equity</th><th>Own Costs</th><th>Rent</th>
         <th>Interest</th><th>Depr.</th><th>Amort.</th><th>Net CF</th></tr></thead>
         <tbody>${rows}</tbody></table></div>`;
  } else {
    $("results").innerHTML = "";
  }
}

/* ---------- CSV & Save (Pro only) ---------- */
function downloadCSV() {
  if (!paid) { alert("Upgrade to Pro to export CSV."); return; }
  const csv = csvRows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "property_vs_shares.csv"; a.click();
  URL.revokeObjectURL(url);
}

function saveScenario() {
  if (!paid) { alert("Upgrade to Pro to save scenarios."); return; }
  const data = [...document.querySelectorAll("#investmentForm input")]
               .reduce((o, i) => (o[i.id] = i.value, o), {});
  data.sellAtRet = $("sellAtRet").checked;
  localStorage.setItem("pvLastScenario", JSON.stringify(data));
  alert("Scenario saved in this browser.");
}

/* ---------- upsell overlay ---------- */
function recommendPro() {
  if (document.querySelector(".overlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.innerHTML = `
    <div class="overlay-card">
      <h2 class="modal-title">🚀 Go Pro with Tepuy</h2>
      <p class="modal-subtitle">You've run the calculator <strong>${uses}</strong> times!</p>
      <ul class="modal-benefits">
        <li>Unlimited year-by-year results</li>
        <li>CSV export</li>
        <li>Save and load scenarios</li>
        <li>Capital Gains Tax toggle</li>
        <li>NPV and IRR projection</li>
      </ul>
      <button id="goPro" class="btn">Unlock Pro – A$9</button>
      <p><a href="#" id="keepFree" class="text-link">No thanks, continue with free</a></p>
    </div>
  `;

  document.body.appendChild(overlay);
  document.querySelector("main").classList.add("blur");

  $("goPro").onclick = () => {
    overlay.remove();
    startCheckout();
  };
  $("keepFree").onclick = e => {
    e.preventDefault();
    document.querySelector("main").classList.remove("blur");
    overlay.remove();
  };
}


/* ---------- Stripe checkout ---------- */
async function startCheckout() {
  try {
    const r = await fetch("/.netlify/functions/createCheckout", { method: "POST" });
    const { url } = await r.json();
    if (url) location.href = url;
  } catch { alert("Checkout failed."); }
}

/* ---------- main ---------- */
function calculate() {
  const base = calculateBasic();
  const allowTable = paid || uses < FREE_LIMIT;

  drawProjection(base, allowTable);

  if (!paid) {
    uses++; localStorage.setItem(usesKey, uses);
    if (!allowTable) recommendPro();
  }
}

function init() {
  /* unlock via query code */
  if (new URLSearchParams(location.search).get("code") === "tepuy2025") {
    localStorage.setItem(paidKey, "yes"); paid = true;
  }

  /* gate pro-only buttons */
  document.querySelectorAll(".pro-only")
          .forEach(el => el.style.display = paid ? "inline-block" : "none");
  if (paid) $("unlockPro").style.display = "none";

  $("runCalc").addEventListener("click", calculate);
  $("btnSave").addEventListener("click", saveScenario);
  $("btnCSV").addEventListener("click", downloadCSV);
}
document.addEventListener("DOMContentLoaded", init);
