import React from 'react'

export default function Businesses(){
  const wrap={ padding:24, color:'#eaeaea' }
  const header={ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }
  const title={ fontSize:22, fontWeight:800 }
  const card={ background:'#15151d', border:'1px solid #2a2a35', borderRadius:12, padding:16 }
  const table={ width:'100%', borderCollapse:'collapse', marginTop:10 }
  const thtd={ borderBottom:'1px solid #2a2a35', padding:'10px 8px', textAlign:'left', fontSize:14 }
  const btn={ background:'#FFD700', color:'#111', border:'none', padding:'6px 10px', borderRadius:8, fontWeight:700, cursor:'pointer' }
  return (
    <div style={wrap}>
      <div style={header}><h2 style={title}>Approve Businesses</h2></div>
      <div style={card}>
        <table style={table}>
          <thead>
            <tr>
              <th style={thtd}>ID</th>
              <th style={thtd}>Name</th>
              <th style={thtd}>Owner</th>
              <th style={thtd}>Requested</th>
              <th style={thtd}>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={thtd}>#B-901</td>
              <td style={thtd}>Royal Hair Studio</td>
              <td style={thtd}>owner@royalhair.com</td>
              <td style={thtd}>2025-10-30</td>
              <td style={thtd}><button style={btn}>Approve</button></td>
            </tr>
            <tr>
              <td style={thtd}>#B-900</td>
              <td style={thtd}>Glow Spa</td>
              <td style={thtd}>admin@glowspa.com</td>
              <td style={thtd}>2025-10-28</td>
              <td style={thtd}><button style={btn}>Approve</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}


