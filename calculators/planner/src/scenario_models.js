/* scenario_models.js – structure-aware simulator */
import { taxEngines, cgt, div43, div40 } from './tax_models.js';

export function runScenario(inputs) {
  const {
    age, retAge, salary,
    /* property */
    propPrice, propLVR, loanRate,
    propGrowth, rentYield, propExp,
    buildPct, plantPct,
    saleCostPct,
    /* shares */
    sharesInit, sharesRet
  } = inputs;

  const yrs = retAge - age;
  const buildingCost = propPrice * (buildPct / 100);
  const plantCost    = propPrice * (plantPct  / 100);

  /* ---------- arrays to collect yearly rows ---------- */
  const rows = Array.from({ length: yrs + 1 }, () => ({}));

  /* ---------- results bucket ---------- */
  const out = {};

  /* ---------- run each structure independently ---------- */
  const structures = ["IND", "TRUST", "COMP", "SMSF_ACC", "SMSF_PENS"];

  for (const code of structures) {
    let house   = propPrice;
    let loan    = propPrice * (propLVR / 100);
    let shares  = sharesInit;
    let lossCF  = 0;                 // carried-forward rental loss
    const table = [];

    for (let y = 0; y < yrs; y++) {
      /* grow values */
      house  *= 1 + propGrowth / 100;
      shares *= 1 + sharesRet  / 100;

      /* rental cash-flow */
      const rent   = house * rentYield / 100;
      const ownExp = house * propExp   / 100;
      const intExp = loan * loanRate   / 100;
      const dep43  = div43(buildingCost);
      const dep40  = div40(plantCost, y);
      const deprec = dep43 + dep40;

      /* taxable income for this wrapper */
      let taxable = rent - ownExp - intExp - deprec;

      /* IND negative gearing offsets salary in same year */
      let personalTax = 0;
      if (code === "IND") {
        const totalIncome = Math.max(0, salary + taxable);
        personalTax       = taxEngines.IND({ taxableIncome: totalIncome });
        if (taxable < 0) taxable = 0;   // loss already used
      }

      /* carry losses for others */
      if (taxable < 0) {
        lossCF += -taxable;
        taxable = 0;
      } else if (lossCF > 0) {
        const offset = Math.min(taxable, lossCF);
        taxable -= offset;
        lossCF  -= offset;
      }

      const entityTax = taxEngines[code]({ taxableIncome: taxable });
      const cashFlow  = rent - ownExp - intExp;   // real cash, deprec non-cash
      const afterTax  = cashFlow - entityTax - personalTax;

      /* lifestyle parity:  
         – if property CF < 0  ⇒ buy shares with the shortfall  
         – if property CF > 0  ⇒ sell shares to fund lifestyle  */
      if (afterTax < 0) {
        shares += -afterTax;   // invest extra
      } else {
        shares -= afterTax;
      }

      table.push({
        year: y,
        house: Math.round(house),
        rent:  Math.round(rent),
        intExp: Math.round(intExp),
        ownExp: Math.round(ownExp),
        deprec: Math.round(deprec),
        taxable,
        entityTax: Math.round(entityTax),
        personalTax: Math.round(personalTax),
        cashAfterTax: Math.round(afterTax),
        shares: Math.round(shares),
        loan: Math.round(loan)
      });
    }

    /* ---------- sale at retirement ---------- */
    const salePrice = house;
    const saleCost  = salePrice * (saleCostPct / 100);
    const gain      = salePrice - propPrice - saleCost - buildingCost - plantCost;
    const cgtPay    = cgt(code, Math.max(0, gain));
    const netProp   = salePrice - loan - saleCost - cgtPay;

    out[code] = {
      tax:   Math.round(cgtPay),
      net:   Math.round(netProp),
      table  // year-by-year detail for audit
    };
  }

  /* ---------- shares-only path as a baseline ---------- */
  {
    let shares = sharesInit;
    for (let y = 0; y < yrs; y++) shares *= 1 + sharesRet / 100;
    const tax   = 0;     // no CG realised yet
    out.SHARES = { tax, net: Math.round(shares), table: [] };
  }

  return out;
}
