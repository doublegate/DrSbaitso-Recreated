/**
 * Chart Utilities (v1.8.0)
 *
 * Canvas-based chart rendering for conversation insights.
 * No external dependencies - pure Canvas API implementation.
 */

import { ChartOptions } from '@/types';

/**
 * Draws a line chart on canvas for timeline visualization
 * @param canvas - HTML Canvas element
 * @param data - Array of {label, value, series} objects
 * @param options - Chart styling options
 */
export function drawLineChart(
  canvas: HTMLCanvasElement,
  data: Array<{ label: string; value: number; series?: string }>,
  options: ChartOptions
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas size with device pixel ratio for crisp rendering
  const dpr = window.devicePixelRatio || 1;
  canvas.width = options.width * dpr;
  canvas.height = options.height * dpr;
  canvas.style.width = `${options.width}px`;
  canvas.style.height = `${options.height}px`;
  ctx.scale(dpr, dpr);

  // Default options
  const padding = options.padding || 40;
  const bgColor = options.backgroundColor || '#1e3a8a';
  const textColor = options.textColor || '#ffffff';
  const fontSize = options.fontSize || 12;
  const colors = options.colors || ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

  // Clear canvas
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, options.width, options.height);

  if (data.length === 0) {
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('No data available', options.width / 2, options.height / 2);
    return;
  }

  // Group data by series
  const seriesMap = new Map<string, Array<{ label: string; value: number }>>();
  data.forEach(point => {
    const seriesName = point.series || 'default';
    if (!seriesMap.has(seriesName)) {
      seriesMap.set(seriesName, []);
    }
    seriesMap.get(seriesName)!.push({ label: point.label, value: point.value });
  });

  // Find min/max values
  const allValues = data.map(d => d.value);
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(0, Math.min(...allValues));

  // Chart area
  const chartWidth = options.width - padding * 2;
  const chartHeight = options.height - padding * 2;
  const chartLeft = padding;
  const chartTop = padding;

  // Draw axes
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(chartLeft, chartTop);
  ctx.lineTo(chartLeft, chartTop + chartHeight);
  ctx.lineTo(chartLeft + chartWidth, chartTop + chartHeight);
  ctx.stroke();

  // Draw Y-axis labels
  ctx.fillStyle = textColor;
  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = 'right';
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const value = minValue + (maxValue - minValue) * (i / ySteps);
    const y = chartTop + chartHeight - (i / ySteps) * chartHeight;
    ctx.fillText(Math.round(value).toString(), chartLeft - 5, y + 4);
  }

  // Draw X-axis labels (show every nth label to avoid crowding)
  ctx.textAlign = 'center';
  const labelStep = Math.ceil(data.length / 10);
  const uniqueLabels = [...new Set(data.map(d => d.label))];
  uniqueLabels.forEach((label, i) => {
    if (i % labelStep === 0) {
      const x = chartLeft + (i / (uniqueLabels.length - 1)) * chartWidth;
      ctx.save();
      ctx.translate(x, chartTop + chartHeight + 15);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }
  });

  // Draw lines for each series
  let seriesIndex = 0;
  seriesMap.forEach((points, seriesName) => {
    const color = colors[seriesIndex % colors.length];
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    points.forEach((point, i) => {
      const x = chartLeft + (i / (points.length - 1)) * chartWidth;
      const normalizedValue = (point.value - minValue) / (maxValue - minValue);
      const y = chartTop + chartHeight - normalizedValue * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = color;
    points.forEach((point, i) => {
      const x = chartLeft + (i / (points.length - 1)) * chartWidth;
      const normalizedValue = (point.value - minValue) / (maxValue - minValue);
      const y = chartTop + chartHeight - normalizedValue * chartHeight;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    seriesIndex++;
  });

  // Draw legend
  ctx.font = `${fontSize}px monospace`;
  let legendY = chartTop;
  seriesIndex = 0;
  seriesMap.forEach((_, seriesName) => {
    const color = colors[seriesIndex % colors.length];
    const legendX = chartLeft + chartWidth - 100;

    ctx.fillStyle = color;
    ctx.fillRect(legendX, legendY, 15, 15);

    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.fillText(seriesName, legendX + 20, legendY + 12);

    legendY += 20;
    seriesIndex++;
  });
}

/**
 * Draws a pie chart on canvas for character usage distribution
 * @param canvas - HTML Canvas element
 * @param data - Array of {label, value} objects
 * @param options - Chart styling options
 */
export function drawPieChart(
  canvas: HTMLCanvasElement,
  data: Array<{ label: string; value: number }>,
  options: ChartOptions
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas size with device pixel ratio
  const dpr = window.devicePixelRatio || 1;
  canvas.width = options.width * dpr;
  canvas.height = options.height * dpr;
  canvas.style.width = `${options.width}px`;
  canvas.style.height = `${options.height}px`;
  ctx.scale(dpr, dpr);

  // Default options
  const bgColor = options.backgroundColor || '#1e3a8a';
  const textColor = options.textColor || '#ffffff';
  const fontSize = options.fontSize || 12;
  const colors = options.colors || ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

  // Clear canvas
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, options.width, options.height);

  if (data.length === 0) {
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('No data available', options.width / 2, options.height / 2);
    return;
  }

  // Calculate total and percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return;

  // Chart positioning
  const centerX = options.width / 2;
  const centerY = options.height / 2;
  const radius = Math.min(options.width, options.height) / 3;

  // Draw pie slices
  let currentAngle = -Math.PI / 2; // Start at top
  data.forEach((item, i) => {
    const sliceAngle = (item.value / total) * Math.PI * 2;
    const color = colors[i % colors.length];

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();

    // Draw slice border
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw percentage label
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
    const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
    const percentage = Math.round((item.value / total) * 100);

    if (percentage >= 5) { // Only show label if slice is large enough
      ctx.fillStyle = bgColor;
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${percentage}%`, labelX, labelY);
    }

    currentAngle += sliceAngle;
  });

  // Draw legend
  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = 'left';
  const legendX = 10;
  let legendY = 20;

  data.forEach((item, i) => {
    const color = colors[i % colors.length];
    const percentage = Math.round((item.value / total) * 100);

    ctx.fillStyle = color;
    ctx.fillRect(legendX, legendY - 10, 15, 15);

    ctx.fillStyle = textColor;
    ctx.fillText(`${item.label}: ${percentage}%`, legendX + 20, legendY);

    legendY += 20;
  });
}

/**
 * Draws a word cloud on canvas
 * @param canvas - HTML Canvas element
 * @param words - Array of {word, count, sentiment} objects
 * @param options - Chart styling options
 */
export function drawWordCloud(
  canvas: HTMLCanvasElement,
  words: Array<{ word: string; count: number; sentiment?: number }>,
  options: ChartOptions
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas size with device pixel ratio
  const dpr = window.devicePixelRatio || 1;
  canvas.width = options.width * dpr;
  canvas.height = options.height * dpr;
  canvas.style.width = `${options.width}px`;
  canvas.style.height = `${options.height}px`;
  ctx.scale(dpr, dpr);

  // Default options
  const bgColor = options.backgroundColor || '#1e3a8a';
  const textColor = options.textColor || '#ffffff';
  const baseFontSize = options.fontSize || 12;

  // Clear canvas
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, options.width, options.height);

  if (words.length === 0) {
    ctx.fillStyle = textColor;
    ctx.font = `${baseFontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('No keywords found', options.width / 2, options.height / 2);
    return;
  }

  // Find max count for scaling
  const maxCount = Math.max(...words.map(w => w.count));
  const minCount = Math.min(...words.map(w => w.count));

  // Simple grid-based layout
  const gridCols = 5;
  const gridRows = Math.ceil(words.length / gridCols);
  const cellWidth = options.width / gridCols;
  const cellHeight = options.height / gridRows;

  words.forEach((wordData, i) => {
    // Calculate font size based on frequency
    const normalizedSize = (wordData.count - minCount) / (maxCount - minCount || 1);
    const fontSize = baseFontSize + normalizedSize * 30;

    // Determine color based on sentiment
    let color = textColor;
    if (wordData.sentiment === 1) {
      color = '#00ff00'; // Positive - green
    } else if (wordData.sentiment === -1) {
      color = '#ff0000'; // Negative - red
    }

    // Grid position
    const col = i % gridCols;
    const row = Math.floor(i / gridCols);
    const x = col * cellWidth + cellWidth / 2;
    const y = row * cellHeight + cellHeight / 2;

    // Draw word
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(wordData.word, x, y);
  });
}

/**
 * Draws a gauge chart for sentiment visualization
 * @param canvas - HTML Canvas element
 * @param value - Sentiment score (-100 to +100)
 * @param trend - Trend indicator: 'up', 'down', or 'stable'
 * @param options - Chart styling options
 */
export function drawGauge(
  canvas: HTMLCanvasElement,
  value: number,
  trend: 'up' | 'down' | 'stable' = 'stable',
  options: ChartOptions
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas size with device pixel ratio
  const dpr = window.devicePixelRatio || 1;
  canvas.width = options.width * dpr;
  canvas.height = options.height * dpr;
  canvas.style.width = `${options.width}px`;
  canvas.style.height = `${options.height}px`;
  ctx.scale(dpr, dpr);

  // Default options
  const bgColor = options.backgroundColor || '#1e3a8a';
  const textColor = options.textColor || '#ffffff';
  const fontSize = options.fontSize || 12;

  // Clear canvas
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, options.width, options.height);

  // Gauge positioning
  const centerX = options.width / 2;
  const centerY = options.height * 0.65;
  const radius = Math.min(options.width, options.height) / 3;

  // Normalize value to 0-1 range (-100..+100 -> 0..1)
  const normalizedValue = (value + 100) / 200;

  // Draw gauge background arc (semicircle)
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, Math.PI, Math.PI * 2);
  ctx.stroke();

  // Draw gauge gradient
  const startAngle = Math.PI;
  const endAngle = startAngle + normalizedValue * Math.PI;

  // Color gradient based on value
  let gaugeColor: string;
  if (value < -33) {
    gaugeColor = '#ff0000'; // Red for negative
  } else if (value < 33) {
    gaugeColor = '#fbbf24'; // Yellow for neutral
  } else {
    gaugeColor = '#00ff00'; // Green for positive
  }

  ctx.strokeStyle = gaugeColor;
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.stroke();

  // Draw center value
  ctx.fillStyle = textColor;
  ctx.font = `bold ${fontSize * 2.5}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value.toString(), centerX, centerY - 10);

  // Draw "Sentiment Score" label
  ctx.font = `${fontSize}px monospace`;
  ctx.fillText('Sentiment Score', centerX, centerY + 30);

  // Draw trend arrow
  ctx.font = `${fontSize * 2}px monospace`;
  if (trend === 'up') {
    ctx.fillStyle = '#00ff00';
    ctx.fillText('↑', centerX, centerY + 55);
  } else if (trend === 'down') {
    ctx.fillStyle = '#ff0000';
    ctx.fillText('↓', centerX, centerY + 55);
  } else {
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('→', centerX, centerY + 55);
  }

  // Draw scale labels
  ctx.fillStyle = textColor;
  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText('-100', centerX - radius - 30, centerY + 10);
  ctx.textAlign = 'right';
  ctx.fillText('+100', centerX + radius + 30, centerY + 10);
  ctx.textAlign = 'center';
  ctx.fillText('0', centerX, centerY + radius + 20);
}
