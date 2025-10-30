import React from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend)

export default function ChartWidget(){
  const data = {
    labels: ['Jan','Feb','Mar','Apr','May'],
    datasets: [{ label: 'Revenue', data: [12000,15000,18000,22000,27000], borderColor: '#facc15', tension: 0.3, borderWidth: 2 }]
  }
  const options = { responsive: true, plugins: { legend: { display: false } } }
  return (
    <div className="bg-[#15151d] p-5 rounded-lg border border-gray-800 shadow-md">
      <h2 className="text-lg font-semibold mb-3 text-gray-300">Revenue Trends</h2>
      <Line data={data} options={options} />
    </div>
  )
}


