/* =========================================================================
   Tepuy Solutions – Property-vs-Shares Calculator (basic + Pro)
   -------------------------------------------------------------------------
   BASIC: unlimited quick panel + chart + first-10 tables
   PRO: unlimited + save scenario + CSV + sell/CGT toggle
   EXTRA: property sale-cost % (when selling at retirement)
   + NEW: Go-to-Planner button for Pro users, passing inputs via URL
   ========================================================================= */

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
const num = id => parseFloat($(id).value.replace(/,/g, "")) || 0;
const pct = id => num(id) / 100;

/* ---------- global state ---------- */
const FREE_LIMIT = 10;
const usesKey = "pvProUses";
const paidKey = "pvProPaid";

let paid = localStorage.getItem(paidKey) === "yes";
let uses = +localStorage.getItem(usesKey) || 0;

let chart;
let csvRows = [];

/* ---------- comma formatting for money fields ---------- */
function addCommaFormatting() {
  ["loanAmount", "buyingCosts"].forEach(id => {
    $(id).addEventListener("input", e => {
      const raw = e.target.value.replace(/,/g, "");
      if (!isNaN(raw) && raw !== "") e.target.value = parseInt(raw, 10).toLocaleString();
    });
  });
}

/* ---------- quick upfront panel ---------- */
function calculateBasic() {
  const loanAmt = num("loanAmount");
  const dpPct = pct("downpayment");
  const costs = num("buyingCosts");
  const yrs = num("loanPeriod");
  const rLoan = pct("loanInterestRate");

  const lmiPct = dpPct >= 0.20 ? 0 : -(0.046 - 0.01) / (0.196 - 0.05) * dpPct + 0.058;
  const lmiAmt = Math.round(loanAmt * lmiPct / (1 + lmiPct));
  const price = Math.round(loanAmt / ((1 - dpPct) * (1 + lmiPct)));
  const cashUp = Math.round(dpPct * price + costs);
  const wkPay = ((rLoan / 12) * loanAmt * Math.pow(1 + rLoan / 12, yrs * 12)) /
                (Math.pow(1 + rLoan / 12, yrs * 12) - 1) * 12 / 52;

  $("lmiPercentage").value = (lmiPct * 100).toFixed(2);
  $("lmiAmount").value = fmt(lmiAmt);
  $("buyPrice").value = fmt(price);
  $("totalCashUpfront").value = fmt(cashUp);
  $("weeklyPayment").value = wkPay.toFixed(2);

  return { loanAmt, dpPct, costs, yrs, rLoan, price, cashUp, wkPay };
}

/* ---------- full projection ---------- */
function drawProjection(base, showTable) {
  const ownPct = pct("owningCosts");
  const agentPct = pct("agentFees");
  const occ = pct("occupancyRate");
  const growProp = pct("propertyAppreciation");
  const rentYld = pct("rentalIncome");
  const rShares = pct("stockMarketAppreciation");
  const buildPct = pct("buildingComponent");
  const taxRate = pct("taxBracket");
  const yrsRet = num("yearsToRetirement");
  const salePct = pct("saleCostPct");
  const sellFlag = $("sellAtRet").checked;

  const lastYear = sellFlag ? yrsRet : base.yrs;

  let propVal = base.price,
      shares = base.cashUp,
      owed = base.loanAmt;

  const labels = [], equityArr = [], sharesArr = [];
  csvRows = [["Year", "Property", "Owed", "Equity", "OwnCosts", "Rent", "Interest", "Depr", "Amort", "NetCF", "Shares"]];

  for (let y = 0; y <= lastYear; y++) {
    const rent = y ? Math.round(propVal * rentYld * occ) : 0;
    const interest = y ? Math.round(owed * base.rLoan) : 0;
    if (y) propVal = Math.round(propVal * (1 + growProp));
    const ownCost = y ? Math.round(propVal * (ownPct + agentPct)) : 0;
    const depr = y ? Math.round(base.price * buildPct / 40) : 0;
    const amort = y ? Math.round(base.wkPay * 52 - interest) : 0;
    if (y) owed = Math.max(0, Math.round(owed * (1 + base.rLoan) - base.wkPay * 52));

    let equity = propVal - owed;

    const cashFlowBeforeTax = rent - ownCost - interest;
    const taxableIncome = cashFlowBeforeTax - depr;
    const tax = taxableIncome * taxRate;
    const netCF = Math.round(cashFlowBeforeTax - tax - amort);

    if (y) shares = Math.round(shares * (1 + rShares) - netCF);

    if (sellFlag && y === yrsRet) {
      const gainProp = propVal - base.price;
      const discounted = gainProp * 0.5;
      const cgtProp = Math.max(0, discounted * taxRate);
      const saleCost = propVal * salePct;
      equity -= (cgtProp + saleCost);

      const gainShares = shares - base.cashUp;
      const cgtShares = Math.max(0, gainShares * 0.5 * taxRate);
      shares -= cgtShares;
    }

    labels.push(`Yr ${y}`);
    equityArr.push(equity);
    sharesArr.push(shares);

    csvRows.push([y, propVal, owed, equity, ownCost, rent, interest, depr, amort, netCF, shares]);
  }

  /* ---- chart ---- */
  if (chart) chart.destroy();
  const ctx = $("investmentChart");
  chart = createTepuyStyledChart(ctx, labels, equityArr, sharesArr, 'Property Equity', 'Shares Value', 'Year');

  /* ---- table ---- */
  if (showTable) {
    const rows = csvRows.slice(1)
      .map(r => `<tr>${r.map((c, i) => {
        const highlightCols = [3, 10]; // 3 = Equity, 10 = Shares Value
        const cls = highlightCols.includes(i) ? ' class="highlight"' : '';
        return `<td${cls}>${fmt(c)}</td>`;
      }).join("")}</tr>`).join("");

    $("results").innerHTML =
      `<div class="table-container"><table class="results-table">
         <thead><tr>
           <th>Yr</th><th>Property Value</th><th>Capital Owed</th>
           <th class="highlight">Equity</th>
           <th>Own Costs</th><th>Rent</th><th>Interest</th>
           <th>Depr.</th><th>Amort.</th><th>Net CF</th>
           <th class="highlight">Shares Value</th>
         </tr></thead>
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
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "property_vs_shares.csv"; a.click();
  URL.revokeObjectURL(url);
}

function saveScenario() {
  if (!paid) { alert("Upgrade to Pro to save scenarios."); return; }
  const data = [...document.querySelectorAll("#investmentForm input")]
               .reduce((o, i) => (o[i.id] = i.type === "checkbox" ? i.checked : i.value, o), {});
  localStorage.setItem("pvLastScenario", JSON.stringify(data));
  alert("Scenario saved in this browser.");
}

/* ---------- upsell modal ---------- */
function recommendPro() {
  if (document.querySelector(".overlay")) return;
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.innerHTML = `
    <div class="overlay-card">
      <h2 class="modal-title">🚀 Go Pro with Tepuy</h2>
      <p class="modal-subtitle">You've run the calculator <strong>${uses}</strong> times!</p>
      <ul class="modal-benefits">
        <li>📈 Full investment results for every year</li>
        <li>📊 CSV export to Excel</li>
        <li>💾 Save & reload custom scenarios</li>
        <li>💰 Capital Gains Tax + Sale Cost modeling</li>
        <li>📉 NPV & IRR (coming soon)</li>
        <li>⚖️ Indicative tax impact comparisons</li>
      </ul>
      <button id="goPro" class="btn">Unlock Pro – A$9</button>
      <p><a href="#" id="keepFree" class="text-link">No thanks, keep free version</a></p>
    </div>`;
  document.body.appendChild(overlay);
  document.querySelector("main").classList.add("blur");

  $("goPro").onclick = () => { overlay.remove(); startCheckout(); };
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
    const j = await r.json();
    if (j.url) location.href = j.url;
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

/* ----- NEW: send basic-form values to Planner (Pro users) ----- */
function goToPlanner() {
  const f = document.getElementById("investmentForm");
  const q = new URLSearchParams({
    age: 45, // default estimate
    retAge: 67,
    taxRate: f.taxBracket.value.replace(/[^0-9.]/g, ""),
    propPrice: (+f.loanAmount.value.replace(/[^0-9.]/g, "") + +f.buyingCosts.value.replace(/[^0-9.]/g, "")),
    propLVR: 100 - parseFloat(f.downpayment.value || 0),
    loanRate: f.loanInterestRate.value,
    rentYield: f.rentalIncome.value,
    propGrowth: f.propertyAppreciation.value,
    propExp: f.owningCosts.value,
    propDep: 200000, // simple placeholder
    sharesInit: f.loanAmount.value.replace(/[^0-9.]/g, ""),
    sharesRet: f.stockMarketAppreciation.value,
    divYield: 4
  });

  location.href = `/calculators/planner/index.html?${q.toString()}`;
}

/* ---------- init ---------- */
function init() {
  const sellBox = $("sellAtRet");
  const unlockBtn = $("unlockPro");
  if (!unlockBtn) return; // ✅ prevent crash

  /* unlock via ?code=tepuy2025 */
  if (new URLSearchParams(location.search).get("code") === "tepuy2025") {
    localStorage.setItem(paidKey, "yes");
    paid = true;
  }

  /* gate pro-only UI */
  document.querySelectorAll(".pro-only")
          .forEach(el => el.style.display = paid ? "inline-block" : "none");

  /* button behaviour */
  if (paid) {
    unlockBtn.textContent = "Go to Planner";
    unlockBtn.classList.remove("btn-disabled");
    unlockBtn.onclick = goToPlanner;
    sellBox.disabled = false;
    sellBox.closest("label").classList.remove("locked");
  } else {
    unlockBtn.classList.add("btn-disabled");
    unlockBtn.onclick = startCheckout;
  }

  /* soft upsell click on disabled CGT box */
  sellBox.closest("label").addEventListener("click", e => {
    if (sellBox.disabled) { e.preventDefault(); recommendPro(); }
  });

  /* main listeners */
  addCommaFormatting();
  $("runCalc").addEventListener("click", calculate);
  $("btnSave").addEventListener("click", saveScenario);
  $("btnCSV").addEventListener("click", downloadCSV);
}

document.addEventListener("DOMContentLoaded", init);