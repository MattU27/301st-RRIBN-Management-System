'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface ReadinessData {
  company: string;
  personnel: number;
  readyPersonnel: number;
  documentsComplete: number;
  trainingsComplete: number;
  readinessScore: number;
}

interface ReadinessChartProps {
  data: ReadinessData[];
  type: 'bar' | 'radar' | 'pie';
  title: string;
}

export default function ReadinessChart({ data, type, title }: ReadinessChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const labels = data.map(item => item.company);
    const readinessScores = data.map(item => item.readinessScore);
    const personnelReadiness = data.map(item => (item.readyPersonnel / item.personnel) * 100);
    const documentCompletion = data.map(item => item.documentsComplete);
    const trainingCompletion = data.map(item => item.trainingsComplete);

    let chartConfig;

    if (type === 'bar') {
      chartConfig = {
        type: 'bar' as const,
        data: {
          labels,
          datasets: [
            {
              label: 'Overall Readiness (%)',
              data: readinessScores,
              backgroundColor: 'rgba(99, 102, 241, 0.8)',
              borderColor: 'rgb(99, 102, 241)',
              borderWidth: 1
            },
            {
              label: 'Personnel Readiness (%)',
              data: personnelReadiness,
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              borderColor: 'rgb(16, 185, 129)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: title,
              font: {
                size: 16
              }
            },
            legend: {
              position: 'bottom' as const
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  return `${context.dataset.label}: ${context.raw.toFixed(1)}%`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Percentage (%)'
              }
            }
          }
        }
      };
    } else if (type === 'radar') {
      chartConfig = {
        type: 'radar' as const,
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Readiness Score',
              data: readinessScores,
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              borderColor: 'rgb(99, 102, 241)',
              pointBackgroundColor: 'rgb(99, 102, 241)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgb(99, 102, 241)'
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: title,
              font: {
                size: 16
              }
            },
            legend: {
              position: 'bottom' as const
            }
          },
          scales: {
            r: {
              angleLines: {
                display: true
              },
              suggestedMin: 0,
              suggestedMax: 100
            }
          }
        }
      };
    } else if (type === 'pie') {
      chartConfig = {
        type: 'pie' as const,
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Readiness Score',
              data: readinessScores,
              backgroundColor: [
                'rgba(99, 102, 241, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(139, 92, 246, 0.8)',
                'rgba(20, 184, 166, 0.8)'
              ],
              borderColor: [
                'rgb(99, 102, 241)',
                'rgb(16, 185, 129)',
                'rgb(245, 158, 11)',
                'rgb(239, 68, 68)',
                'rgb(139, 92, 246)',
                'rgb(20, 184, 166)'
              ],
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: title,
              font: {
                size: 16
              }
            },
            legend: {
              position: 'bottom' as const
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  return `${context.label}: ${context.raw.toFixed(1)}%`;
                }
              }
            }
          }
        }
      };
    }

    if (chartConfig) {
      chartInstance.current = new Chart(ctx, chartConfig);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, type, title]);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <canvas ref={chartRef} />
    </div>
  );
} 