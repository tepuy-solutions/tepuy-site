// tepuy-charts.js
const watermarkLogo = new Image();
watermarkLogo.src = '/img/tepuy_logo_dark.png';

function createTepuyStyledChart(ctx, labels, data1, data2, label1 = 'Dataset 1', label2 = 'Dataset 2', xAxisLabel = 'Year') {
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: label1, // Custom label for first dataset
          data: data1,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.08)',
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: true,
          tension: 0.35,
        },
        {
          label: label2, // Custom label for second dataset
          data: data2,
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
            text: xAxisLabel, // Custom x-axis label
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