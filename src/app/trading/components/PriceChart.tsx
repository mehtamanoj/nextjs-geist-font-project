"use client"

import { useRef } from "react"
import { Line } from "react-chartjs-2"
import type { ChartData, ChartOptions } from "chart.js"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface PriceChartProps {
  data: { time: Date; price: number }[]
}

export function PriceChart({ data }: PriceChartProps) {
  const chartData: ChartData<"line"> = {
    labels: data.map(d => d.time.toLocaleTimeString()),
    datasets: [
      {
        label: "Stock Price",
        data: data.map(d => d.price),
        borderColor: "rgb(59, 130, 246)", // Blue
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgb(23, 23, 23)",
        titleColor: "rgb(255, 255, 255)",
        bodyColor: "rgb(255, 255, 255)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: "rgb(161, 161, 170)", // Zinc-400
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
        },
      },
      y: {
        display: true,
        grid: {
          color: "rgba(59, 130, 246, 0.1)", // Subtle blue grid
        },
        ticks: {
          color: "rgb(161, 161, 170)", // Zinc-400
          callback: (value: number | string) => {
            if (typeof value === 'number') {
              return `$${value.toFixed(2)}`
            }
            return value
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    animation: {
      duration: 750,
    },
  }

  return (
    <div className="w-full h-full bg-zinc-950 rounded-lg p-4">
      <Line data={chartData} options={options} />
    </div>
  )
}
