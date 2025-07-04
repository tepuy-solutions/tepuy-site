
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('retirement-form');
  const resultTable = document.getElementById('resultTable');
  const summary = document.getElementById('summary');

  const rInput = document.getElementById('annualReturn');
  const iInput = document.getElementById('inflation');
  const swrInput = document.getElementById('withdrawalRate');
  const swrHint = swrInput.previousElementSibling.querySelector('small');

  function suggestSWR() {
    const r = (+rInput.value || 0) / 100;
    const i = (+iInput.value || 0) / 100;
    if (r <= 0) return;
    const swr = (((1 + r) / (1 + i)) - 1) * 100;
    swrInput.value = swr.toFixed(1);
    if (swrHint) swrHint.textContent = `Suggested: ${swr.toFixed(1)}%`;
  }

  rInput.addEventListener('input', suggestSWR);
  iInput.addEventListener('input', suggestSWR);
  suggestSWR();

  form.addEventListener('submit', e => {
    e.preventDefault();
    const currentAge = +document.getElementById('currentAge').value;
    const retirementAge = +document.getElementById('retirementAge').value;
    const capital = +document.getElementById('currentCapital').value;
    const returnRate = +document.getElementById('annualReturn').value / 100;
    const inflation = +document.getElementById('inflation').value / 100;
    const swr = +document.getElementById('withdrawalRate').value / 100;
    const monthlyContribution = +document.getElementById('monthlyContribution').value;
    const targetIncome = +document.getElementById('targetMonthlyIncome').value;

    let balance = capital;
    let tableHTML = '<tr><th>Age</th><th>Capital ($)</th><th>Inflation-Adjusted Goal</th><th>Annual Contribution</th></tr>';
    let goalReached = false;
    let finalAge = retirementAge;

    for (let age = currentAge; age <= 90; age++) {
      const contribution = monthlyContribution * 12;
      balance *= (1 + returnRate);
      balance += contribution;

      const targetAnnualIncome = targetIncome * 12 * Math.pow(1 + inflation, age - currentAge);
      const requiredCapital = targetAnnualIncome / swr;

      tableHTML += `<tr><td>${age}</td><td>${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td><td>${requiredCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td><td>${contribution.toLocaleString()}</td></tr>`;

      if (!goalReached && balance >= requiredCapital) {
        goalReached = true;
        finalAge = age;
        summary.textContent = `✅ You will reach your retirement income goal by age ${age} (in ${age - currentAge} years), with a projected capital of ${balance.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}.`;
      }
    }

    if (!goalReached) {
      summary.textContent = `❌ Based on your inputs, you will not reach your target income goal by age ${retirementAge}.`;
    }

    resultTable.innerHTML = tableHTML;
  });
});
