/* =========================================================================
   Tepuy Solutions – Property‑vs‑Shares Calculator (FULL VERSION)
   -------------------------------------------------------------------------
   ▸  Unlimited BASIC results (quick LMI + cash‑flow panel)
   ▸  Chart + Year‑by‑Year table become PRO after a FREE_LIMIT of uses
   ▸  Soft‑upsell overlay lets a power‑user either upgrade or continue basic
   ------------------------------------------------------------------------- */

/* ---------- tiny helpers ---------- */
const $   = id => document.getElementById(id);
const fmt = n  => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
const num = id => parseFloat($(id).value.replace(/,/g, "")) || 0;
const pct = id => num(id) / 100;

/* ---------- GLOBAL STATE ---------- */
const FREE_LIMIT   = 10;
const usesKey      = "pvProUses";
const paidKey      = "pvProPaid";
let   uses         = +localStorage.getItem(usesKey) || 0;
let   paid         =  localStorage.getItem(paidKey) === "yes";

/* ---------- BASIC CALC ---------- */
function calculateBasic() {
  const loanAmt   = num("loanAmount");
  const dpPct     = pct("downpayment");
  const buyCosts  = num("buyingCosts");
  const yearsLoan = num("loanPeriod");
  const rLoan     = pct("loanInterestRate");

  const lmiPct = dpPct >= 0.20 ? 0 : -(0.046 - 0.01) / (0.196 - 0.05) * dpPct + 0.058;
  const lmiAmt = Math.round(loanAmt * lmiPct / (1 + lmiPct));
  const price  = Math.round(loanAmt / ((1 - dpPct) * (1 + lmiPct)));
  const cashUp = Math.round(dpPct * price + buyCosts);
  const wkPay  = (((rLoan / 12) * loanAmt * Math.pow(1 + rLoan / 12, yearsLoan * 12)) /
                 (Math.pow(1 + rLoan / 12, yearsLoan * 12) - 1)) * 12 / 52;

  $("lmiPercentage").value    = (lmiPct * 100).toFixed(2);
  $("lmiAmount").value        = fmt(lmiAmt);
  $("buyPrice").value         = fmt(price);
  $("totalCashUpfront").value = fmt(cashUp);
  $("weeklyPayment").value    = wkPay.toFixed(2);

  return { loanAmt, dpPct, buyCosts, yearsLoan, rLoan, lmiPct, lmiAmt, price, cashUp, wkPay };
}

/* ---------- ADVANCED CHART & TABLE ---------- */
function drawAdvancedParts(basic) {
  const ownPct    = pct("owningCosts");
  const agentPct  = pct("agentFees");
  const occ       = pct("occupancyRate");
  const growProp  = pct("propertyAppreciation");
  const rentYld   = pct("rentalIncome");
  const rShares   = pct("stockMarketAppreciation");
  const buildPct  = pct("buildingComponent");
  const tax       = pct("taxBracket");
  const yearsRet  = num("yearsToRetirement");

  let propVal = basic.price;
  let shares  = basic.cashUp;
  let owed    = basic.loanAmt;

  const labels = [], equityArr = [], sharesArr = [];
  let rows = "";

  for (let y = 0; y <= basic.yearsLoan; y++) {
    const rent     = (y === 0) ? 0 : Math.round(propVal * rentYld * occ);
    const interest = (y === 0) ? 0 : Math.round(owed * basic.rLoan);
    if (y > 0) propVal = Math.round(propVal * (1 + growProp));
    const ownCost = (y === 0) ? 0 : Math.round(propVal * (ownPct + agentPct));
    const depr    = (y === 0) ? 0 : Math.round(basic.price * buildPct / 40);
    const amort   = (y === 0) ? 0 : Math.round(basic.wkPay * 52 - interest);
    if (y > 0) owed = Math.max(0, Math.round(owed * (1 + basic.rLoan) - basic.wkPay * 52));

    const equity   = propVal - owed;
    const cashFlow = rent - (ownCost + interest + depr);
    let netCF;
    if (cashFlow < 0 && y < yearsRet && y > 0) {
      netCF = Math.round(cashFlow * (1 - tax) - amort);
    } else {
      netCF = Math.round(rent - (ownCost + interest) - amort);
    }

    if (y > 0) shares = Math.round(shares * (1 + rShares) - netCF);

    labels.push(`Yr ${y}`);
    equityArr.push(equity);
    sharesArr.push(shares);

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

  if (window.pvChart) window.pvChart.destroy();
  window.pvChart = new Chart($("investmentChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Property Equity", data: equityArr,
          borderColor: "#28a745", backgroundColor: "rgba(40,167,69,.15)", tension: .35, fill: true },
        { label: "Shares Value", data: sharesArr,
          borderColor: "#007bff", backgroundColor: "rgba(0,123,255,.15)", tension: .35, fill: true }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: { ticks: { callback: v => fmt(v) } },
        x: { ticks: { autoSkip: true, maxTicksLimit: 12 } }
      }
    }
  });
}

/* ---------- STRIPE CHECKOUT ---------- */
async function startCheckout(){
  try {
    const r = await fetch('/.netlify/functions/createCheckout', { method:'POST' });
    const j = await r.json();
    if (j.url) {
      window.location.href = j.url;
    } else {
      alert('Checkout link missing');
    }
  } catch (e) {
    console.error(e);
    alert('Checkout failed.');
  }
}

/* ---------- SOFT UPSELL ---------- */
function recommendPro(){
  if (document.querySelector(".overlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.innerHTML = `
    <div class="overlay-card">
      <h3>Love the calculator?</h3>
      <p>You’ve run it <strong>${uses}</strong> times already!<br>
         Unlock unlimited charts, Excel export &amp; save‑scenarios with <b>Tepuy&nbsp;Pro</b>.</p>
      <button id="goPro" class="btn">Upgrade – A$14</button>
      <button id="keepFree" class="btn btn-outline">Keep free version</button>
    </div>`;
  document.body.appendChild(overlay);
  document.querySelector("main").classList.add("blur");

  $("goPro").onclick = () => { overlay.remove(); startCheckout(); };
  $("keepFree").onclick = () => {
    document.querySelector("main").classList.remove("blur");
    overlay.remove();
  };
}

/* ---------- MAIN CALC ---------- */
function calculate(){
  const basic = calculateBasic();
  uses = +localStorage.getItem(usesKey) || 0;
  paid = localStorage.getItem(paidKey) === "yes";

  const allowAdvanced = paid || uses < FREE_LIMIT;

  if (allowAdvanced) {
    drawAdvancedParts(basic);
  } else {
    if (window.pvChart) window.pvChart.destroy();
    $("investmentChart").getContext && $("investmentChart").getContext("2d").clearRect(0, 0, 9999, 9999);
    $("results").innerHTML = "";
    recommendPro();
  }

  if (!paid) {
    uses++;
    localStorage.setItem(usesKey, uses);
  }
}

/* ---------- INIT ---------- */
// email unlock via ?code=XYZ
(function checkUnlockCode(){
  const code = new URLSearchParams(location.search).get("code");
  if (code && code === "abc123") {
    localStorage.setItem(paidKey, "yes");
  }
})();

// button listeners
$("runCalc")?.addEventListener("click", calculate);

const unlockBtn = $("unlockPro");
if (unlockBtn) {
  if (paid) {
    unlockBtn.style.display = "none";
  } else {
    unlockBtn.onclick = () => {
      unlockBtn.disabled = true;
      startCheckout();
    };
  }
}

// expose for console
window.calculate = calculate;
