import React from 'react'

export default function Alerts(){
  const wrap={ padding:24, color:'#eaeaea' }
  const header={ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }
  const title={ fontSize:22, fontWeight:800 }
  const card={ background:'#15151d', border:'1px solid #2a2a35', borderRadius:12, padding:16 }
  const filterRow={ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:8, marginBottom:12 }
  const pill={ display:'inline-block', padding:'6px 10px', border:'1px solid rgba(255,215,0,0.35)', borderRadius:999 }
  const listItem={ background:'rgba(255,255,255,0.05)', borderLeft:'3px solid #FFD700', padding:10, borderRadius:8, marginBottom:10 }
  return (
    <div style={wrap}>
      <div style={header}><h2 style={title}>Live Alerts</h2></div>
      <div style={card}>
        <div style={filterRow}>
          <span style={pill}>Payments</span>
          <span style={pill}>Cancellations</span>
          <span style={pill}>Reviews</span>
          <span style={pill}>Loyalty</span>
        </div>
        <div style={listItem}>💳 Demo payment of £12.00 from Test User</div>
        <div style={listItem}>⭐ Demo 5★ review from Aisha</div>
        <div style={listItem}>🚨 Fraud flag: Possible duplicate referral activity</div>
      </div>
    </div>
  )
}


