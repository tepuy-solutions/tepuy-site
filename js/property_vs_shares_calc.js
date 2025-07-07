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
const FREE_LIMIT   = 10;                                              // free runs with charts
const usesKey      = "pvProUses";                                   // localStorage counter
const paidKey      = "pvProPaid";                                   // localStorage flag set after Stripe / email link
let   uses         = +localStorage.getItem(usesKey) || 0;
let   paid         =  localStorage.getItem(paidKey) === "yes";

/* ---------- CALCULATION CORE ---------- */
function calculateBasic() {
  /* === INPUTS === */
  const loanAmt   = num("loanAmount");
  const dpPct     = pct("downpayment");
  const buyCosts  = num("buyingCosts");
  const yearsLoan = num("loanPeriod");
  const rLoan     = pct("loanInterestRate");

  /* === UP‑FRONT FIGURES === */
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

  /* basic part done – return all variables in case advanced needs them */
  return { loanAmt, dpPct, buyCosts, yearsLoan, rLoan, lmiPct, lmiAmt,
           price, cashUp, wkPay };
}

function drawAdvancedParts(basic) {
  /* re‑read advanced‑only inputs (they don’t affect quick panel) */
  const ownPct    = pct("owningCosts");
  const agentPct  = pct("agentFees");
  const occ       = pct("occupancyRate");
  const growProp  = pct("propertyAppreciation");
  const rentYld   = pct("rentalIncome");
  const rShares   = pct("stockMarketAppreciation");
  const buildPct  = pct("buildingComponent");
  const tax       = pct("taxBracket");
  const yearsRet  = num("yearsToRetirement");

  /* opening values (year 0) */
  let propVal = basic.price;
  let shares  = basic.cashUp;
  let owed    = basic.loanAmt;

  const labels = [], equityArr = [], sharesArr = [];
  let rows = "";

  for (let y = 0; y <= basic.yearsLoan; y++) {
    /* ----- income & costs based on opening values ----- */
    const rent     = (y === 0) ? 0 : Math.round(propVal * rentYld * occ);
    const interest = (y === 0) ? 0 : Math.round(owed * basic.rLoan);

    /* ----- grow property for this year ----- */
    if (y > 0) propVal = Math.round(propVal * (1 + growProp));

    /* owning costs, depreciation use NEW value */
    const ownCost = (y === 0) ? 0 : Math.round(propVal * (ownPct + agentPct));
    const depr    = (y === 0) ? 0 : Math.round(basic.price * buildPct / 40);

    /* amortisation after interest (based on fixed wkPay) */
    const amort   = (y === 0) ? 0 : Math.round(basic.wkPay * 52 - interest);

    /* update loan balance for next loop */
    if (y > 0) {
      owed = Math.max(0, Math.round(owed * (1 + basic.rLoan) - basic.wkPay * 52));
    }

    const equity = propVal - owed;
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

  /* --- inject table --- */
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

  /* --- chart --- */
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
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: { ticks: { callback: v => fmt(v) } },
        x: { ticks: { autoSkip: true, maxTicksLimit: 12 } }
      }
    }
  });
}

/* ---------- SOFT‑UPSELL OVERLAY ---------- */
function recommendPro() {
  // avoid stacking multiple overlays
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

  document.getElementById("goPro").onclick   = () => { overlay.remove(); startCheckout(); };
  document.getElementById("keepFree").onclick= () => {
    document.querySelector("main").classList.remove("blur");
    overlay.remove();
  };
}

/* ---------- MAIN CALC WRAPPER ---------- */
function calculate() {
  const basic = calculateBasic();            // always show quick outputs

  // refresh paid / uses (they might have changed via other tab)
  uses = +localStorage.getItem(usesKey) || 0;
  paid =  localStorage.getItem(paidKey) === "yes";

  const advancedAllowed = paid || uses < FREE_LIMIT;

  if (advancedAllowed) {
    drawAdvancedParts(basic);
  } else {
    // hide previous chart/table if present
    if (window.pvChart) window.pvChart.destroy();
    $("investmentChart").getContext && $("investmentChart").getContext("2d").clearRect(0,0,9999,9999);
    $("results").innerHTML = "";
    recommendPro();
  }

  // increment free‑use counter AFTER running to avoid off‑by‑one irritation
  if (!paid) {
    uses++;
    localStorage.setItem(usesKey, uses);
  }
}

/* ---------- BUTTON/URL SETUP ---------- */
// load via ?code=XYZ email link
(function checkProLink(){
  const code = new URLSearchParams(location.search).get("code");
  if(code && code === "abc123") localStorage.setItem(paidKey,"yes");  // TODO: replace with env code
})();

// run button
$("runCalc")?.addEventListener("click", calculate);

// unlock button already in HTML – disabled if paid
const unlockBtn = $("unlockPro");
if (unlockBtn) {
  if (paid) { unlockBtn.style.display = "none"; }
  unlockBtn.onclick = () => { unlockBtn.disabled = true; startCheckout(); };
}

// expose for dev console / other modules
window.calculate = calculate;
