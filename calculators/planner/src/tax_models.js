/* AU income-tax helper (very simplified) */
export function incomeTax(t){
  const bands=[[0,18200,0],[18200,45000,.16],[45000,135000,.30],
               [135000,190000,.37],[190000,1e12,.45]];
  let tax=0;
  for(const [min,max,r] of bands){
    if(t>min){ tax+=(Math.min(t,max)-min)*r; if(t<max)break; }
  }
  return tax;
}
export const medicare = t=>t*0.02;
const cgtDisc = (g,r)=>incomeTax(g*0.5)+(medicare(g*0.5));

/*  ▸▸  ALL KEYS NOW USE HYPHENS  ◂◂ */
export const taxModels = {
  "IND-NG":            (g,tr)=>cgtDisc(g,tr),
  "IND-SELL-TO-SUPER": (g,tr)=>cgtDisc(g,tr)+13500,
  "IND-HOLD-TILL-DEATH": ()=>0,
  "F-TRUST":           (g,tr,splits=2)=>splits*cgtDisc(g/splits,tr),
  "COMP":              g=>g*0.25,
  "SMSF-ACC":          g=>g*(2/3)*0.15,
  "SMSF-PENS":         ()=>0,
  "SHARES-IND":        (v,tr,yrs=20)=>yrs*(v*0.04)*0.5*(tr/100),
  "SHARES-SMSF":       (v,yrs=20)=>yrs*(v*0.04)*0.15
};
