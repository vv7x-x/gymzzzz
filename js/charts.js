import { getTheme } from './prefs.js';

function getChartColors() {
  const isDark = getTheme() === 'dark';
  return {
    grid: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    tick: '#5c6678',
    primary: '#5B6AF0',
    primaryBg: 'rgba(91,106,240,0.12)',
    green: '#25A06E',
    orange: '#D98A2C',
    purple: '#7C6FF0',
    red: '#D94A4A',
  };
}

function createBaseOptions() {
  const c = getChartColors();
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: c.grid },
        ticks: { color: c.tick, font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: c.tick, font: { size: 11 } }
      }
    }
  };
}

export function createRevenueChart(canvasId, payments) {
  if (!window.Chart || !canvasId) return null;
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const c = getChartColors();

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const data = Array(12).fill(0);
  (payments || []).forEach(p => {
    const d = new Date(p.paid_at);
    if (!isNaN(d.getTime())) {
      data[d.getMonth()] += Number(p.amount) || 0;
    }
  });

  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Revenue',
        data,
        borderColor: c.primary,
        backgroundColor: c.primaryBg,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: c.primary,
        borderWidth: 2
      }]
    },
    options: createBaseOptions()
  });
}

export function createDoughnutChart(canvasId, labels, data, colors) {
  if (!window.Chart || !canvasId) return null;
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const c = getChartColors();

  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels || [],
      datasets: [{
        data: data || [],
        backgroundColor: colors || [c.primary, c.green, c.orange, c.purple, c.red],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: c.tick, padding: 16, font: { size: 11 } }
        }
      }
    }
  });
}

export function createBarChart(canvasId, labels, data) {
  if (!window.Chart || !canvasId) return null;
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const c = getChartColors();

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels || [],
      datasets: [{
        label: 'Value',
        data: data || [],
        backgroundColor: c.primaryBg,
        borderColor: c.primary,
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: createBaseOptions()
  });
}
