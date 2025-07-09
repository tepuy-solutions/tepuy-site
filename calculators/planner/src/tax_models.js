/* tax_models.js – AU tax + depreciation helpers (Planner Pro) */

/* ---------- marginal tax table (FY24) ---------- */
export function incomeTax(t) {
  const bands = [
    [0, 18200, 0],
    [18200, 45000, .16],
    [45000, 135000, .30],
    [135000, 190000, .37],
    [190000, 1e12, .45]
  ];
  let tax = 0;
  for (const [min, max, r] of bands) {
    if (t > min) {
      tax += (Math.min(t, max) - min) * r;
      if (t < max) break;
    }
  }
  return tax;
}
export const medicare = t => t * 0.02;

/* ---------- depreciation ---------- */
export function div43(buildingCost) {
  /* 2.5 % straight-line – division 43 */
  return buildingCost * 0.025;
}
export function div40(plantCost, year) {
  /* 10 % diminishing-value – division 40 */
  return plantCost * 0.10 * Math.pow(0.90, year);
}

/* ---------- entity-specific annual tax ---------- */
export const taxEngines = {
  IND: ({ taxableIncome }) => incomeTax(taxableIncome) + medicare(taxableIncome),

  TRUST: ({ taxableIncome, splits = 2 }) =>
    splits > 0 ? splits *
      (incomeTax(taxableIncome / splits) + medicare(taxableIncome / splits)) : 0,

  COMPANY: ({ taxableIncome }) => taxableIncome * 0.25,  // small-biz rate

  SMSF_ACC: ({ taxableIncome }) => taxableIncome * 0.15, // accumulation

  SMSF_PENS: () => 0                                     // pension phase
};

/* ---------- capital-gains tax at sale ---------- */
export function cgt(entity, gain) {
  switch (entity) {
    case "IND":
    case "TRUST":
      return (incomeTax(gain * 0.5) + medicare(gain * 0.5));
    case "COMP":
      return gain * 0.25;
    case "SMSF_ACC":
      return gain * (2 / 3) * 0.15;   // 2/3 taxed @15 %
    case "SMSF_PENS":
      return 0;
  }
}
