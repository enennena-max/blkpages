import React, { useEffect, useState } from 'react'
import { db } from '../firebase/firebaseConfig'
import { collection, getDocs } from 'firebase/firestore'
import ChartWidget from './components/ChartWidget'

// Local, purely visual stat card to match the HTML admin style
function StatCard({ label, value }){
  return (
    <div style={{
      background: '#15151d',
      border: '1px solid #2a2a35',
      borderRadius: 12,
      padding: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
    }}>
      <div>
        <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#eaeaea' }}>{value}</div>
      </div>
      <div style={{ width: 10 }} />
    </div>
  )
}

export default function Overview(){
  const [stats, setStats] = useState({ users: 0, businesses: 0, revenue: 0, refunds: 0 })

  useEffect(()=>{
    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'))
        const businessesSnap = await getDocs(collection(db, 'businesses'))
        const transactionsSnap = await getDocs(collection(db, 'transactions'))
        const refundsSnap = await getDocs(collection(db, 'refunds'))
        setStats({
          users: usersSnap.size,
          businesses: businessesSnap.size,
          revenue: transactionsSnap.docs.reduce((sum, d)=> sum + Number(d.data().amount||0), 0),
          refunds: refundsSnap.docs.reduce((sum, d)=> sum + Number(d.data().amount||0), 0)
        })
      } catch(_) {}
    }
    fetchData()
  }, [])

  const wrapStyle = {
    minHeight: '100vh',
    background: '#0b0b0f',
    color: '#eaeaea',
    padding: 24
  }
  const headerRow = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  }
  const titleStyle = { fontSize: 22, fontWeight: 700 }
  const grid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 16
  }
  const grid2 = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 16,
    marginTop: 16
  }
  const cardShell = {
    background: '#15151d',
    border: '1px solid #2a2a35',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
    marginTop: 16
  }

  return (
    <div style={wrapStyle}>
      <div style={headerRow}>
        <h1 style={titleStyle}>Admin Overview</h1>
      </div>

      {/* Summary Cards Row 1 */}
      <div style={grid}>
        <StatCard label="Total Users" value={stats.users} />
        <StatCard label="Total Businesses" value={stats.businesses} />
        <StatCard label="Total Revenue" value={`£${stats.revenue}`} />
        <StatCard label="Refunds" value={`£${stats.refunds}`} />
      </div>

      {/* Summary Cards Row 2 (placeholders for visual parity) */}
      <div style={grid2}>
        <StatCard label="Pending Reviews" value="—" />
        <StatCard label="Open Disputes" value="—" />
        <StatCard label="Unread Alerts" value="—" />
        <StatCard label="Active Sessions" value="—" />
      </div>

      {/* Revenue Trends Chart */}
      <div style={cardShell}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 10 }}>
          <h2 style={{ margin:0, color:'#FFD700', fontSize:16, fontWeight:700 }}>Revenue Trends</h2>
        </div>
        <ChartWidget />
      </div>
    </div>
  )
}


