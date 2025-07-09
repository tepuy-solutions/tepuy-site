/* scenario_models.js
   Very simplified yearly simulator — refine later
*/
import { taxModels } from './tax_models.js';

export function runScenario(inputs) {
  const {
    age,         // current age
    retAge,      // retirement age
    propPrice,   // purchase price
    propLVR,     // loan-to-value %
    loanRate,    // loan interest %
    propGrowth,  // capital growth %
    propDep,     // depreciation claimed $
    taxRate,     // marginal tax rate %
    partner,     // boolean (split trust gains)
    sharesInit,  // initial share lump sum
    sharesRet    // shares total return %
  } = inputs;

  /* ---- years until retirement ---- */
  const years = retAge - age;

  /* ----- PROPERTY path (value + loan) ----- */
  let house = propPrice;
  let loan  = propPrice * (propLVR / 100);

  for (let y = 0; y < years; y++) {
    house *= 1 + propGrowth / 100;
    // simple interest-only repayment model
    loan   = loan * (1 + loanRate / 100) - (loanRate / 100 * loan);
  }

  const grossGain = house - propPrice + propDep;   // inflation ignored
  /* we calculate tax per scenario below */

  /* ----- SHARES path ----- */
  let shares = sharesInit;
  for (let y = 0; y < years; y++) {
    shares *= 1 + sharesRet / 100;
  }

  /* ----- Generate outputs for each structure ----- */
  const calc = {};   // { code: { tax, net } }

  // helper to set result for each scenario
  function set(code, taxDollars) {
    if (code.startsWith('SHARES')) {
      calc[code] = { tax: taxDollars, net: shares - taxDollars };
    } else {
      const netProp = house - loan - taxDollars;
      calc[code] = { tax: taxDollars, net: netProp };
    }
  }

  /* PROPERTY-related scenarios */
  set("IND-NG",              taxModels["IND-NG"](grossGain,      taxRate));
  set("IND-SELL-TO-SUPER",   taxModels["IND-SELL-TO-SUPER"](grossGain, taxRate));
  set("IND-HOLD-TILL-DEATH", taxModels["IND-HOLD-TILL-DEATH"](grossGain, taxRate));
  set("F-TRUST",             taxModels["F-TRUST"](grossGain,     taxRate, partner ? 2 : 1));
  set("COMP",                taxModels["COMP"](grossGain));
  set("SMSF-ACC",            taxModels["SMSF-ACC"](grossGain));
  set("SMSF-PENS",           taxModels["SMSF-PENS"](grossGain));

  /* SHARES scenarios */
  set("SHARES-IND",  taxModels["SHARES-IND"](shares, taxRate));
  set("SHARES-SMSF", taxModels["SHARES-SMSF"](shares));

  return calc;   // caller picks the scenario key they need
}
