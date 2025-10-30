import React from 'react'
import { NavLink } from 'react-router-dom'

const linkBase = {
  display: 'block',
  padding: '10px 12px',
  borderRadius: 8,
  color: '#eaeaea',
  textDecoration: 'none',
  border: '1px solid rgba(255,215,0,0.12)',
  background: 'rgba(17,17,17,0.85)',
  marginBottom: 8
}

export default function Sidebar(){
  const wrap = {
    width: 240,
    background: '#0f0f14',
    borderRight: '1px solid #2a2a35',
    padding: 14,
    position: 'sticky',
    top: 0,
    height: '100vh'
  }
  const brand = { color:'#FFD700', fontWeight: 800, marginBottom: 12 }
  const nav = {}

  const getStyle = ({ isActive }) => ({
    ...linkBase,
    color: isActive ? '#111' : '#eaeaea',
    background: isActive ? '#FFD700' : 'rgba(17,17,17,0.85)',
    border: isActive ? '1px solid rgba(255,215,0,0.8)' : '1px solid rgba(255,215,0,0.12)'
  })

  return (
    <aside style={wrap}>
      <div style={brand}>🛡️ BlkPages Admin</div>
      <nav style={nav}>
        <NavLink to="/" style={getStyle} end>📊 Overview</NavLink>
        <NavLink to="/users" style={getStyle}>👤 Users</NavLink>
        <NavLink to="/reviews" style={getStyle}>🧾 Reviews</NavLink>
        <NavLink to="/businesses" style={getStyle}>🏢 Businesses</NavLink>
        <NavLink to="/referrals" style={getStyle}>🎁 Referrals</NavLink>
        <NavLink to="/disputes" style={getStyle}>⚖️ Disputes</NavLink>
        <NavLink to="/finances" style={getStyle}>💷 Finances</NavLink>
        <NavLink to="/adjust" style={getStyle}>💎 Adjust Points</NavLink>
        <NavLink to="/alerts" style={getStyle}>🔔 Alerts</NavLink>
      </nav>
    </aside>
  )
}


