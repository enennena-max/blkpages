import React from 'react'

export default function OverviewCard({ label, value }){
  return (
    <div className="bg-[#15151d] p-5 rounded-lg border border-gray-800 shadow-md flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <h3 className="text-2xl font-semibold">{value}</h3>
      </div>
    </div>
  )
}


