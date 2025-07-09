/* tax_models.js – AU tax helpers (still simplified) */
export function incomeTax(t){
  const bands=[[0,18200,0],[18200,45000,.16],[45000,135000,.30],
               [135000,190000,.37],[190000,1e12,.45]];
  let tax=0;
  for(const [min,max,r] of bands){
    if(t>min){ tax+=(Math.min(t,max)-min)*r; if(t<max)break; }
  }
  return tax;
}
export const medicare = t => t*0.02;

/* 50 % CGT discount for individuals & trusts */
const cgtDisc = (gain,mtr)=>
  incomeTax(gain*0.5) + medicare(gain*0.5);

/* --- scenarios ---------------------------------------------------- */
export const taxModels = {
  /* property held directly ---------------------------------------- */
  "IND-NG":            (g,mtr)=>cgtDisc(g,mtr),              // negative-geared rental
  "IND-SELL-TO-SUPER": (g,mtr)=>cgtDisc(g,mtr)+13500,        // $30 k concessional + $15 k NCC cap
  "IND-HOLD-TILL-DEATH":()=>0,                               // CGT reset on death

  /* other ownership wrappers -------------------------------------- */
  "F-TRUST": (g,mtr,splits=2)=>splits*cgtDisc(g/splits,mtr), // family trust, split 2 ways
  "COMP":    g=>g*0.25,                                      // company 25 %
  "SMSF-ACC":g=>g*(2/3)*0.15,                                // SMSF accumulation (⅔ gain taxed @15 %)
  "SMSF-PENS":()=>0,                                         // SMSF pension phase (no CGT)

  /* shares: only the FIRST 4 % is crystallised at retirement ------ */
  "SHARES-IND":  (v,mtr)=>0.04*v*0.5*(mtr/100),   // 50 % disc on 4 % sale
  "SHARES-SMSF": v     =>0.04*v*0.15              // SMSF 15 % on 4 % sale
};
