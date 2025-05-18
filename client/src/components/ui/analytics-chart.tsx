import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, LineChart, PieChart, PieChartIcon, BarChart, TrendingUp, Activity } from "lucide-react";

// Define props for all chart types
interface ChartProps {
  type: "line" | "bar" | "pie" | "doughnut";
  data: any;
  labels: string[];
  title: string;
  description?: string;
  height?: number;
  options?: any;
  className?: string;
}

// Define prop types for the data series
interface DataSeries {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

/**
 * A reusable analytics chart component that renders different types of charts.
 * This uses a canvas-based approach to draw charts from scratch to avoid external dependencies.
 */
export function AnalyticsChart({
  type,
  data,
  labels,
  title,
  description,
  height = 300,
  options = {},
  className = "",
}: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Effect for rendering the chart
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions accounting for device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    // Common chart padding
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;
    
    // Define some nice colors for the charts
    const colorPalette = [
      '#3b82f6', // blue-500
      '#10b981', // emerald-500
      '#f59e0b', // amber-500
      '#ef4444', // red-500
      '#8b5cf6', // violet-500
      '#ec4899', // pink-500
      '#06b6d4', // cyan-500
    ];
    
    // Helper for drawing axes
    const drawAxes = () => {
      ctx.strokeStyle = '#e5e7eb'; // gray-200
      ctx.lineWidth = 1;
      
      // Y-axis
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, rect.height - padding.bottom);
      ctx.stroke();
      
      // X-axis
      ctx.beginPath();
      ctx.moveTo(padding.left, rect.height - padding.bottom);
      ctx.lineTo(rect.width - padding.right, rect.height - padding.bottom);
      ctx.stroke();
    };
    
    // Helper for drawing labels
    const drawLabels = () => {
      ctx.fillStyle = '#6b7280'; // gray-500
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      
      // X-axis labels
      const xStep = chartWidth / (labels.length - 1 || 1);
      labels.forEach((label, i) => {
        const x = padding.left + i * xStep;
        ctx.fillText(label, x, rect.height - padding.bottom + 15);
      });
      
      // Y-axis labels
      const allDataPoints = data.datasets.flatMap((dataset: DataSeries) => dataset.data);
      const maxValue = Math.max(...allDataPoints, 10);
      const yStep = chartHeight / 5;
      
      for (let i = 0; i <= 5; i++) {
        const y = rect.height - padding.bottom - i * yStep;
        const value = Math.round((maxValue * i) / 5);
        ctx.textAlign = 'right';
        ctx.fillText(value.toString(), padding.left - 5, y + 3);
      }
    };
    
    // Draw line chart
    const drawLineChart = () => {
      drawAxes();
      
      const allDataPoints = data.datasets.flatMap((dataset: DataSeries) => dataset.data);
      const maxValue = Math.max(...allDataPoints, 10);
      
      data.datasets.forEach((dataset: DataSeries, datasetIndex: number) => {
        ctx.strokeStyle = dataset.borderColor || colorPalette[datasetIndex % colorPalette.length];
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const xStep = chartWidth / (labels.length - 1 || 1);
        
        dataset.data.forEach((value: number, i: number) => {
          const x = padding.left + i * xStep;
          const y = rect.height - padding.bottom - (value / maxValue) * chartHeight;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        
        ctx.stroke();
        
        // Fill area under the line if specified
        if (dataset.fill) {
          ctx.lineTo(padding.left + (labels.length - 1) * xStep, rect.height - padding.bottom);
          ctx.lineTo(padding.left, rect.height - padding.bottom);
          ctx.closePath();
          ctx.fillStyle = `${dataset.borderColor}20` || `${colorPalette[datasetIndex % colorPalette.length]}20`;
          ctx.fill();
        }
      });
      
      drawLabels();
    };
    
    // Draw bar chart
    const drawBarChart = () => {
      drawAxes();
      
      const allDataPoints = data.datasets.flatMap((dataset: DataSeries) => dataset.data);
      const maxValue = Math.max(...allDataPoints, 10);
      const datasetCount = data.datasets.length;
      const groupWidth = chartWidth / labels.length;
      const barWidth = (groupWidth * 0.8) / datasetCount;
      const barSpacing = groupWidth * 0.2 / (datasetCount + 1);
      
      data.datasets.forEach((dataset: DataSeries, datasetIndex: number) => {
        ctx.fillStyle = dataset.backgroundColor || colorPalette[datasetIndex % colorPalette.length];
        
        dataset.data.forEach((value: number, i: number) => {
          const x = padding.left + i * groupWidth + barSpacing + datasetIndex * (barWidth + barSpacing);
          const barHeight = (value / maxValue) * chartHeight;
          const y = rect.height - padding.bottom - barHeight;
          
          // Draw bar
          ctx.fillRect(x, y, barWidth, barHeight);
        });
      });
      
      drawLabels();
    };
    
    // Draw pie or doughnut chart
    const drawPieChart = (isDoughnut = false) => {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const radius = Math.min(chartWidth, chartHeight) / 2;
      
      // Doughnut hole radius
      const innerRadius = isDoughnut ? radius * 0.5 : 0;
      
      let total = 0;
      data.datasets[0].data.forEach((value: number) => {
        total += value;
      });
      
      let startAngle = 0;
      
      data.datasets[0].data.forEach((value: number, i: number) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        
        const bgColor = Array.isArray(data.datasets[0].backgroundColor) 
          ? data.datasets[0].backgroundColor[i] 
          : colorPalette[i % colorPalette.length];
          
        ctx.fillStyle = bgColor;
        ctx.fill();
        
        // If it's a doughnut, cut out the center
        if (isDoughnut) {
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, innerRadius, startAngle, startAngle + sliceAngle);
          ctx.closePath();
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
        
        // Draw labels if the slice is large enough
        if (sliceAngle > 0.2) {
          const midAngle = startAngle + sliceAngle / 2;
          const labelRadius = radius * 0.7;
          const labelX = centerX + Math.cos(midAngle) * labelRadius;
          const labelY = centerY + Math.sin(midAngle) * labelRadius;
          
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labels[i], labelX, labelY);
        }
        
        startAngle += sliceAngle;
      });
      
      // Add legend
      const legendX = rect.width - padding.right - 100;
      const legendY = padding.top;
      
      labels.forEach((label, i) => {
        const y = legendY + i * 20;
        
        // Color box
        const bgColor = Array.isArray(data.datasets[0].backgroundColor) 
          ? data.datasets[0].backgroundColor[i] 
          : colorPalette[i % colorPalette.length];
          
        ctx.fillStyle = bgColor;
        ctx.fillRect(legendX, y, 12, 12);
        
        // Label text
        ctx.fillStyle = '#374151'; // gray-700
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, legendX + 16, y + 6);
      });
    };
    
    // Draw the appropriate chart type
    switch (type) {
      case 'line':
        drawLineChart();
        break;
      case 'bar':
        drawBarChart();
        break;
      case 'pie':
        drawPieChart(false);
        break;
      case 'doughnut':
        drawPieChart(true);
        break;
      default:
        drawLineChart();
    }
  }, [type, data, labels, height, options]);
  
  // Determine icon based on chart type
  const renderIcon = () => {
    switch (type) {
      case 'line':
        return <LineChart className="h-4 w-4 text-neutral-500" />;
      case 'bar':
        return <BarChart3 className="h-4 w-4 text-neutral-500" />;
      case 'pie':
      case 'doughnut':
        return <PieChartIcon className="h-4 w-4 text-neutral-500" />;
      default:
        return <Activity className="h-4 w-4 text-neutral-500" />;
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {renderIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px`, position: 'relative' }}>
          <canvas 
            ref={canvasRef} 
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}