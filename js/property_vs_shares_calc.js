// Function to format numbers with commas
function formatNumber(num) {
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// Function to format inputs (adding commas)
function formatInput(input) {
    // Remove all non-digit characters except commas
    let val = input.value.replace(/[^0-9,]/g, '');
    
    // Remove commas for calculation
    let num = val.replace(/,/g, '');
    
    // Format number with commas
    if (num) {
        num = parseInt(num, 10).toLocaleString();
    }
    input.value = num || '';
}

// Main calculate function
function calculate() {
    // Convert input values to usable numbers
    let loanAmount = parseInt(document.getElementById('loanAmount').value.replace(/,/g, ''));
    let downpayment = parseFloat(document.getElementById('downpayment').value) / 100;
    let buyingCosts = parseInt(document.getElementById('buyingCosts').value.replace(/,/g, ''));
    let loanPeriod = parseInt(document.getElementById('loanPeriod').value);
    let loanInterestRate = parseFloat(document.getElementById('loanInterestRate').value) / 100;
    let owningCosts = parseFloat(document.getElementById('owningCosts').value) / 100;
    let agentFees = parseFloat(document.getElementById('agentFees').value) / 100;
    let occupancyRate = parseFloat(document.getElementById('occupancyRate').value) / 100;
    let propertyAppreciation = parseFloat(document.getElementById('propertyAppreciation').value) / 100;
    let rentalIncome = parseFloat(document.getElementById('rentalIncome').value) / 100;
    let stockMarketAppreciation = parseFloat(document.getElementById('stockMarketAppreciation').value) / 100;
    let buildingComponent = parseFloat(document.getElementById('buildingComponent').value) / 100;
    let taxBracket = parseFloat(document.getElementById('taxBracket').value) / 100;
    let yearsToRetirement = parseInt(document.getElementById('yearsToRetirement').value);

    // Calculate LMI (Lender's Mortgage Insurance)
    let lmiPercentage = downpayment >= 0.2 ? 0 : -(0.046 - 0.01) / (0.196 - 0.05) * downpayment + 0.058;
    let lmiAmount = Math.round(loanAmount * lmiPercentage / (1 + lmiPercentage));
    
    // Calculate Buy Price
    let buyPrice = Math.round(loanAmount / ((1 - downpayment) * (1 + lmiPercentage)));

    // Total Cash Upfront
    let totalCashUpfront = Math.round((downpayment * buyPrice) + buyingCosts);

    // Weekly Payment Calculation
    let monthlyRate = loanInterestRate / 12;
    let numPayments = loanPeriod * 12;
    let weeklyPayment = (monthlyRate * loanAmount * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1) * 12 / 52;

    // Update form fields
    document.getElementById('lmiPercentage').value = (lmiPercentage * 100).toFixed(2);
    document.getElementById('lmiAmount').value = lmiAmount.toLocaleString();
    document.getElementById('buyPrice').value = buyPrice.toLocaleString();
    document.getElementById('totalCashUpfront').value = totalCashUpfront.toLocaleString();
    document.getElementById('weeklyPayment').value = weeklyPayment.toFixed(2);

    // Generate Investment Comparison Table
    // Generate Investment Comparison Table with thead and tbody
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>End of Year</th>
                    <th>Property Value</th>
                    <th>Shares Value</th>
                    <th>Capital Owed</th>
                    <th>Equity</th>
                    <th>Owning Costs</th>
                    <th>Income Rent</th>
                    <th>Interest on Loan</th>
                    <th>Depreciation per Year</th>
                    <th>Capital Amortization on Mortgage</th>
                    <th>Net Cash Flow</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    let propertyValue = buyPrice;
    let sharesValue = totalCashUpfront;
    let capitalOwed = loanAmount;
    let equity = 0;
    let owningCostAmount = 0;
    let incomeRent = 0;
    let depreciationPerYear = 0;
    let capitalAmortization = 0; 
    let interestOnLoan = 0;
    let netCashFlow = 0;

    // Arrays to hold chart data
    let labels = [];
    let equityData = [];
    let sharesData = [];

    for (let year = 0; year <= loanPeriod; year++) {
        let buyCosts = (year === 0) ? buyingCosts : 0;
        incomeRent = Math.round(propertyValue * rentalIncome * occupancyRate);

        propertyValue = (year === 0) ? buyPrice : Math.round(propertyValue * (1 + propertyAppreciation));

        // Simplified calculations for demonstration. Refine for accuracy.
        interestOnLoan = Math.round(capitalOwed * loanInterestRate);
        capitalOwed = (year === 0) ? loanAmount : Math.round(capitalOwed * (1 + loanInterestRate) - (weeklyPayment * 52));
        equity = propertyValue - capitalOwed;

        // Set these values to 0 for year 0, calculate them for subsequent years
        if (year > 0) {
            owningCostAmount = Math.round(propertyValue * (owningCosts + agentFees));
            depreciationPerYear = Math.round((buyPrice * buildingComponent) / 40);
            
            let monthlyPayment = weeklyPayment * 52 / 12;
            capitalAmortization = Math.round(weeklyPayment * 52 - interestOnLoan);

            let cashFlow = incomeRent - (owningCostAmount + interestOnLoan + depreciationPerYear);
            if (cashFlow < 0 && year < yearsToRetirement) {
                netCashFlow = Math.round(cashFlow * (1 - taxBracket) - capitalAmortization);
            } else {
                netCashFlow = Math.round(incomeRent - (owningCostAmount + interestOnLoan) - capitalAmortization);
            }

            sharesValue = (year === 0) ? sharesValue : Math.round(sharesValue * (1 + stockMarketAppreciation) - netCashFlow);
        }

        // Add data for the chart
        labels.push(`Year ${year}`);
        equityData.push(equity);
        sharesData.push(sharesValue);

        tableHTML += `
            <tr>
                <td>${year}</td>
                <td>${formatNumber(propertyValue)}</td>
                <td>${formatNumber(sharesValue)}</td>
                <td>${formatNumber(capitalOwed)}</td>
                <td>${formatNumber(equity)}</td>
                <td>${year > 0 ? formatNumber(owningCostAmount) : 0}</td>
                <td>${year > 0 ? formatNumber(incomeRent) : 0}</td>
                <td>${year > 0 ? formatNumber(interestOnLoan) : 0}</td>
                <td>${year > 0 ? formatNumber(depreciationPerYear) : 0}</td>
                <td>${year > 0 ? formatNumber(capitalAmortization) : 0}</td>
                <td>${year > 0 ? formatNumber(netCashFlow) : 0}</td>
            </tr>
        `;
    }
    
    tableHTML += `
            </tbody>
        </table>
    `;
    document.querySelector('.table-container').innerHTML = tableHTML;



	
    // Destroy any existing chart instance to avoid duplicates
    if (window.equitySharesChart && typeof window.equitySharesChart.destroy === 'function') {
        window.equitySharesChart.destroy();
    }


    // Create the chart using the existing canvas in .chart-container
    var ctx = document.getElementById('investmentChart').getContext('2d');
    window.equitySharesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Equity',
                data: equityData,
                borderColor: 'rgb(125, 249, 255)', // Electric blue in RGB
                fill: false
            }, {
                label: 'Shares Value',
                data: sharesData,
                borderColor: 'rgb(255, 105, 180)', // Hot pink in RGB
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Allow chart to fill container height
            plugins: {
                legend: {
                    labels: {
                        color: 'rgb(80, 80, 80)'  // White color for legend labels
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year',
                        color: 'rgb(80, 80, 80)' // White color for x-axis title
                    },
                    ticks: {
                        color: 'rgb(80, 80, 80)' // White color for x-axis numbers
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Value ($)',
                        color: 'rgb(80, 80, 80)' // White color for y-axis title
                    },
                    ticks: {
                        color: 'rgb(80, 80, 80)', // White color for y-axis numbers
                        beginAtZero: true,
                        callback: function(value) {
                            return formatNumber(value); // Format y-axis numbers with commas
                        }
                    }
                }
            },
            elements: {
                line: {
                    borderWidth: 2
                }
            },
            layout: {
                padding: {
                    top: 10,
                    bottom: 10,
                    left: 10,
                    right: 10
                }
            }
        }
    });
}
