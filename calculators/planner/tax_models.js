/* Quick-and-clean tax calculators for each scenario
   – simplify where appropriate; refine later for full cash-flow */

export function taxIndividualCGT(gain, taxRate){
  return gain * 0.5 * (taxRate/100);
}

/* Map of scenario ➜ tax-owed function.
   Each function returns TOTAL tax in dollars on a $1.2 m gross capital gain
   (you can parameterise gain later). `partner` toggles trust split.           */
export const taxModels = {
  "IND-NG":      (gain, tr)          => taxIndividualCGT(gain, tr),

  "IND-SELL-TO-SUPER": (gain, tr)    =>
      taxIndividualCGT(gain, tr) + 13500,   // 15 % on $30k concessional

  "IND-HOLD-TILL-DEATH": ()          => 0,  // cost base reset

  "F-TRUST":     (gain, tr, partner) =>{
      const discounted = gain * 0.5;
      const splits = partner ? 2 : 1;
      const perB = discounted / splits;
      return splits * perB * (tr/100);
  },

  "COMP":        gain                => gain * 0.25,  // base-rate 25 %

  "SMSF-ACC":    gain                => gain * (2/3) * 0.15,

  "SMSF-PENS":   ()                  => 0,

  // shares: treat 4 % p.a. draw over 20 yrs, CGT on half each year
  "SHARES-IND":  (value, tr)         =>
      20 * (value*0.04) * 0.5 * (tr/100),

  "SHARES-SMSF": value               =>
      20 * (value*0.04) * 0.15        // accum phase; pension ≈ 0
};
