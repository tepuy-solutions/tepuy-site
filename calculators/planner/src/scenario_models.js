import { taxModels } from './tax_models.js';

/* very simplified yearly simulator; refine later */

export function runScenario(code,inputs){
  const {
    age,retAge,propPrice,propLVR,loanRate,rentYield,
    propGrowth,propExp,propDep,taxRate,partner,
    sharesInit,sharesRet,divYield
  } = inputs;

  /* ----- PROPERTY path ----- */
  let years = retAge - age;
  let house = propPrice;
  let loan  = propPrice * (propLVR/100);
  for(let y=0;y<years;y++){
    house*=1+propGrowth/100;
    loan = loan*(1+loanRate/100) - (loanRate/100*loan); // interest-only, fast
  }
  const grossGain = house - propPrice + propDep;
  const propNetProceeds = house - loan - taxModels.IND_NG(grossGain,taxRate);

  /* ----- SHARES path ----- */
  let shares=sharesInit;
  for(let y=0;y<years;y++){
    shares*=1+sharesRet/100;
  }

  /* dispatch tax variation */
  const out = {};
  const scenarios = {
    "IND-NG":       taxModels.IND_NG(grossGain,taxRate),
    "IND-SELL-TO-SUPER":taxModels.IND_SELL_TO_SUPER(grossGain,taxRate),
    "IND-HOLD-TILL-DEATH":0,
    "F-TRUST":      taxModels.F_TRUST(grossGain,taxRate,partner?2:1),
    "COMP":         taxModels.COMP(grossGain),
    "SMSF-ACC":     taxModels.SMSF_ACC(grossGain),
    "SMSF-PENS":    0,
    "SHARES-IND":   taxModels.SHARES_IND(shares,taxRate),
    "SHARES-SMSF":  taxModels.SHARES_SMSF(shares)
  };
  Object.entries(scenarios).forEach(([k,v])=>{
    out[k] = {
      tax:v,
      net:(k.startsWith('SHARES')?shares:propNetProceeds) - (k.startsWith('SHARES')?v:0)
    };
  });
  return out;
}
