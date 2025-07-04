document.getElementById("retirementForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const age = parseInt(document.getElementById("currentAge").value);
  const capital = parseFloat(document.getElementById("currentCapital").value);
  const returnRate = parseFloat(document.getElementById("annualReturn").value) / 100;
  const inflation = parseFloat(document.getElementById("inflation").value) / 100;
  const swr = parseFloat(document.getElementById("withdrawalRate").value) / 100;
  const contrib = parseFloat(document.getElementById("monthlyContribution").value) * 12;
  const targetIncome = parseFloat(document.getElementById("targetIncome").value) * 12;

  let balance = capital;
  let target = 0;
  let year = age;
  const rows = [];

  while (balance * swr < targetIncome && year < 100) {
    target = targetIncome / swr / Math.pow(1 + inflation, year - age);
    balance = balance * (1 + returnRate) + contrib;
    rows.push({year, balance: Math.round(balance), target: Math.round(target), contrib});
    year++;
  }

  const result = document.getElementById("resultMessage");
  const table = document.getElementById("resultsTable");

  if (balance * swr >= targetIncome) {
    result.innerHTML = `✅ You will reach your retirement income goal by age <strong>${year}</strong>, with a projected capital of <strong>$${balance.toLocaleString()}</strong>.`;
    result.style.background = "#d4edda";
  } else {
    result.innerHTML = `❌ Based on your inputs, you will not reach your goal by age 100.`;
    result.style.background = "#f8d7da";
  }

  let html = "<table><tr><th>Age</th><th>Capital ($)</th><th>Inflation-Adjusted Goal ($)</th><th>Annual Contribution</th></tr>";
  rows.forEach(r => {
    html += `<tr><td>${r.year}</td><td>$${r.balance.toLocaleString()}</td><td>$${r.target.toLocaleString()}</td><td>$${r.contrib.toLocaleString()}</td></tr>`;
  });
  html += "</table>";
  table.innerHTML = html;
});
