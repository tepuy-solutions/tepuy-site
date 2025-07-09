/* rudimentary AU tax helpers – amend each Budget */

export function incomeTax(taxable){
  const bands=[
    [0,18200,0],
    [18200,45000,0.16],
    [45000,135000,0.30],
    [135000,190000,0.37],
    [190000,1e12,0.45]
  ];
  let tax=0;
  for(const [min,max,rate] of bands){
    if(taxable>min){
      tax+=Math.min(taxable,max)-min * rate;
      if(taxable<max)break;
    }
  }
  return tax;
}

export const medicare = t=>t*0.02;

/* helper for CGT discount */
export const cgtDiscounted = (gain,rate)=>incomeTax(gain*0.5)+(medicare(gain*0.5));

/* quick total-tax functions used by scenario engine */
export const taxModels={
  IND_NG:(gain,tr)=>cgtDiscounted(gain,tr),
  IND_SELL_TO_SUPER:(gain,tr)=>cgtDiscounted(gain,tr)+13500,
  IND_HOLD_TILL_DEATH:()=>0,
  F_TRUST:(gain,tr,splits=2)=>splits*cgtDiscounted(gain/splits,tr),
  COMP:gain=>gain*0.25,
  SMSF_ACC:gain=>gain*(2/3)*0.15,
  SMSF_PENS:()=>0,
  SHARES_IND:(value,tr,years=20)=>years*(value*0.04)*0.5*(tr/100),
  SHARES_SMSF:(value,years=20)=>years*(value*0.04)*0.15
};
