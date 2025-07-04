function calculateRetirement() {
  const age = parseInt(document.getElementById('age').value);
  const capital = parseFloat(document.getElementById('capital').value);
  const annualReturn = parseFloat(document.getElementById('return').value) / 100;
  const inflation = parseFloat(document.getElementById('inflation').value) / 100;
  const withdrawalRate = parseFloat(document.getElementById('withdrawal').value) / 100;
  const monthlyContribution = parseFloat(document.getElementById('monthly').value);
  const targetIncome = parseFloat(document.getElementById('targetIncome').value);

  const realReturn = ((1 + annualReturn) / (1 + inflation)) - 1;

  let year = age;
  let balance = capital;
  const yearlyData = [];

  for (let i = 0; i <= 55 - age; i++) {
    balance = balance * (1 + realReturn) + (monthlyContribution * 12);
    yearlyData.push({
      year: year + i,
      age: year + i,
      balance: balance.toFixed(0)
    });
  }

  const retirementCapitalRequired = (targetIncome * 12) / withdrawalRate;
  const canRetireAt = yearlyData.find(y => y.balance >= retirementCapitalRequired);

  const summary = canRetireAt
    ? `🎉 You can retire at age ${canRetireAt.age} with $${parseInt(canRetireAt.balance).toLocaleString()} saved.`
    : `❗ Based on your inputs, you will not reach your target income goal by age 55.`;

  document.getElementById('summary').innerHTML = `<p>${summary}</p>`;

  let tableHTML = `<table><thead><tr><th>Year</th><th>Age</th><th>Projected Balance ($)</th></tr></thead><tbody>`;
  yearlyData.forEach(row => {
    tableHTML += `<tr><td>${row.year}</td><td>${row.age}</td><td>${parseInt(row.balance).toLocaleString()}</td></tr>`;
  });
  tableHTML += '</tbody></table>';

  document.getElementById('result').innerHTML = tableHTML;
}
