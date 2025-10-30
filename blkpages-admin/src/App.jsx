import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './admin/components/Sidebar.jsx'
import Overview from './admin/Overview.jsx'
import Users from './admin/Users.jsx'
import Reviews from './admin/Reviews.jsx'
import Businesses from './admin/Businesses.jsx'
import Referrals from './admin/Referrals.jsx'
import Disputes from './admin/Disputes.jsx'
import Finances from './admin/Finances.jsx'
import AdjustPoints from './admin/AdjustPoints.jsx'
import Alerts from './admin/Alerts.jsx'

export default function App(){
  const layout = { display:'grid', gridTemplateColumns:'240px 1fr', minHeight:'100vh', background:'#0b0b0f' }
  return (
    <BrowserRouter>
      <div style={layout}>
        <Sidebar />
        <main>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/users" element={<Users />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/businesses" element={<Businesses />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/disputes" element={<Disputes />} />
            <Route path="/finances" element={<Finances />} />
            <Route path="/adjust" element={<AdjustPoints />} />
            <Route path="/alerts" element={<Alerts />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}


