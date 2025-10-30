import React from 'react'

export default function Finances(){
  const wrap={ padding:24, color:'#eaeaea' }
  const header={ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }
  const title={ fontSize:22, fontWeight:800 }
  const card={ background:'#15151d', border:'1px solid #2a2a35', borderRadius:12, padding:16, marginBottom:16 }
  const grid={ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:16 }
  const kpi={ background:'#0f0f14', border:'1px solid #2a2a35', borderRadius:12, padding:14 }
  const table={ width:'100%', borderCollapse:'collapse', marginTop:10 }
  const thtd={ borderBottom:'1px solid #2a2a35', padding:'10px 8px', textAlign:'left', fontSize:14 }
  return (
    <div style={wrap}>
      <div style={header}><h2 style={title}>Finances</h2></div>
      <div style={grid}>
        <div style={kpi}><div style={{color:'#9ca3af',fontSize:12}}>Total Revenue</div><div style={{fontWeight:800,fontSize:20}}>£115.00</div></div>
        <div style={kpi}><div style={{color:'#9ca3af',fontSize:12}}>Total Refunds</div><div style={{fontWeight:800,fontSize:20}}>£15.00</div></div>
        <div style={kpi}><div style={{color:'#9ca3af',fontSize:12}}>Net Revenue</div><div style={{fontWeight:800,fontSize:20}}>£100.00</div></div>
        <div style={kpi}><div style={{color:'#9ca3af',fontSize:12}}>Total Bookings</div><div style={{fontWeight:800,fontSize:20}}>3</div></div>
      </div>

      <div style={card}>
        <h3 style={{margin:0,color:'#FFD700'}}>Transactions</h3>
        <table style={table}>
          <thead>
            <tr>
              <th style={thtd}>Date</th>
              <th style={thtd}>Customer</th>
              <th style={thtd}>Status</th>
              <th style={thtd}>Amount</th>
              <th style={thtd}>Refund</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={thtd}>2025-10-30</td>
              <td style={thtd}>Jane Smith</td>
              <td style={thtd}>paid</td>
              <td style={thtd}>£35.00</td>
              <td style={thtd}>—</td>
            </tr>
            <tr>
              <td style={thtd}>2025-10-29</td>
              <td style={thtd}>Michael Brown</td>
              <td style={thtd}>paid</td>
              <td style={thtd}>£52.00</td>
              <td style={thtd}>—</td>
            </tr>
            <tr>
              <td style={thtd}>2025-10-29</td>
              <td style={thtd}>Emily Johnson</td>
              <td style={thtd}>refunded</td>
              <td style={thtd}>£28.00</td>
              <td style={thtd}>£15.00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}


