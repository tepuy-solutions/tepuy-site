function calculateRetirement() {
  const age = parseInt(document.getElementById("current-age").value);
  const retirementAge = parseInt(document.getElementById("retirement-age").value);
  const currentSavings = parseFloat(document.getElementById("current-savings").value);
  const annualContribution = parseFloat(document.getElementById("annual-contribution").value);
  const returnRate = parseFloat(document.getElementById("investment-return").value) / 100;
  const retirementYears = parseInt(document.getElementById("retirement-years").value);

  const resultDiv = document.getElementById("result");

  if (
    isNaN(age) || isNaN(retirementAge) || isNaN(currentSavings) ||
    isNaN(annualContribution) || isNaN(returnRate) || isNaN(retirementYears)
  ) {
    resultDiv.innerHTML = "❌ Please fill out all fields with valid numbers.";
    return;
  }

  const yearsToGrow = retirementAge - age;
  let futureValue = currentSavings;

  for (let i = 0; i < yearsToGrow; i++) {
    futureValue = (futureValue + annualContribution) * (1 + returnRate);
  }

  const annualWithdrawal = futureValue / retirementYears;

  resultDiv.innerHTML = `
    💰 At retirement, you’ll have approximately <strong>$${futureValue.toFixed(2)}</strong> saved.<br/>
    📆 This allows for a yearly withdrawal of about <strong>$${annualWithdrawal.toFixed(2)}</strong> for ${retirementYears} years.
  `;
}
