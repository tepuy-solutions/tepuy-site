// 🔁 Preload once (outside the function)
const watermarkLogo = new Image();
watermarkLogo.src = '/img/tepuy_logo_dark.png';

// ✅ Main chart function
function createTepuyStyledChart(ctx, labels, equityData, sharesData) {
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Property Equity',
          data: equityData,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.08)',
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: true,
          tension: 0.35,
        },
        {
          label: 'Shares Value',
          data: sharesData,
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.08)',
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: true,
          tension: 0.35,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 20 },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { family: 'Inter', size: 14, weight: '600' },
            color: '#163f30',
            boxWidth: 18,
            boxHeight: 18,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: '#163f30',
          titleFont: { family: 'Inter', weight: '700' },
          bodyFont: { family: 'Inter' },
          cornerRadius: 4
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Year',
            font: { family: 'Inter', size: 14, weight: '600' },
            color: '#0b1f16'
          },
          ticks: {
            color: '#0b1f16',
            maxTicksLimit: 12,
            font: { family: 'Inter', size: 12 }
          },
          grid: { color: '#e0e0e0' }
        },
        y: {
          title: {
            display: true,
            text: 'Value (AUD)',
            font: { family: 'Inter', size: 14, weight: '600' },
            color: '#0b1f16'
          },
          ticks: {
            callback: v => v.toLocaleString('en-AU'),
            color: '#0b1f16',
            font: { family: 'Inter', size: 12 }
          },
          grid: { color: '#e0e0e0' }
        }
      }
    },
    plugins: [
      {
        id: 'watermark',
        beforeDraw: chart => {
          const { width, height, ctx } = chart;
          if (watermarkLogo.complete) {
            const scale = 180 / watermarkLogo.width;
            const w = 180;
            const h = watermarkLogo.height * scale;
            ctx.save();
            ctx.globalAlpha = 0.07;
            ctx.drawImage(watermarkLogo, width - w - 10, height - h - 10, w, h);
            ctx.restore();
          }
        }
      }
    ]
  });
}
