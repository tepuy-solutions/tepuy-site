/* scenario_models.js – yearly simulator (Planner) */
import { taxModels } from './tax_models.js';

export function runScenario(inputs){
  const {
    age, retAge,
    /* property --------------- */
    propPrice, propLVR, loanRate,
    propGrowth, propDep, saleCostPct,
    /* tax / splits ----------- */
    taxRate, partner,
    /* shares ----------------- */
    sharesInit, sharesRet
  } = inputs;

  /* years until retirement */
  const yrs = retAge - age;

  /* ---- PROPERTY PATH ------------------------------------------- */
  let house = propPrice;
  let loan  = propPrice * (propLVR/100);     // interest-only, principal unchanged

  for(let y=0;y<yrs;y++){
    house *= 1 + propGrowth/100;
  }

  const saleCost   = house * (saleCostPct/100);
  const capitalGain= house - propPrice - saleCost - propDep; // simplified cost base
  const grossGain  = Math.max(0,capitalGain);                // guard negative CG

  /* ---- SHARES PATH --------------------------------------------- */
  let shares = sharesInit;
  for(let y=0;y<yrs;y++){
    shares*= 1 + sharesRet/100;
  }

  /* ---- OUTPUT BUCKET ------------------------------------------- */
  const out={};

  /* helper */
  function set(code,tax){
function set(code, tax){
  if(code.startsWith('SHARES')){
    const cash4 = 0.04*shares - tax;
    const left  = 0.96*shares;
    out[code] = { tax, net: cash4 + left };
  } else {
    const netProp = house - loan - saleCost - tax;
    out[code] = { tax, net: netProp };
  }
  console.log(`Scenario ${code}: tax=${tax}, net=${out[code].net}`);
}
console.log("Gross gain:", grossGain);
console.log("IND-NG tax:", taxModels["IND-NG"](grossGain, taxRate));

  /* property scenarios */
  set('IND-NG',              taxModels['IND-NG'](grossGain, taxRate));
  set('IND-SELL-TO-SUPER',   taxModels['IND-SELL-TO-SUPER'](grossGain, taxRate));
  set('IND-HOLD-TILL-DEATH', taxModels['IND-HOLD-TILL-DEATH'](grossGain, taxRate));
  set('F-TRUST',             taxModels['F-TRUST'](grossGain, taxRate, partner?2:1));
  set('COMP',                taxModels['COMP'](grossGain));
  set('SMSF-ACC',            taxModels['SMSF-ACC'](grossGain));
  set('SMSF-PENS',           taxModels['SMSF-PENS'](grossGain));

  /* shares scenarios */
  set('SHARES-IND',  taxModels['SHARES-IND'](shares, taxRate));
  set('SHARES-SMSF', taxModels['SHARES-SMSF'](shares));

  return out;
}
