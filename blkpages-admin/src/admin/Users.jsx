import React from 'react'

export default function Users(){
  const wrap={ padding:24, color:'#eaeaea' }
  const header={ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }
  const title={ fontSize:22, fontWeight:800 }
  const card={ background:'#15151d', border:'1px solid #2a2a35', borderRadius:12, padding:16 }
  const table={ width:'100%', borderCollapse:'collapse', marginTop:10 }
  const thtd={ borderBottom:'1px solid #2a2a35', padding:'10px 8px', textAlign:'left', fontSize:14 }
  return (
    <div style={wrap}>
      <div style={header}><h2 style={title}>Customers</h2></div>
      <div style={card}>
        <table style={table}>
          <thead>
            <tr>
              <th style={thtd}>Name</th>
              <th style={thtd}>Email</th>
              <th style={thtd}>BlkPoints</th>
              <th style={thtd}>Joined</th>
              <th style={thtd}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={thtd}>Aisha Johnson</td>
              <td style={thtd}>aisha.johnson@example.com</td>
              <td style={{...thtd, color:'#FFD700'}}>2,400</td>
              <td style={thtd}>2025-10-30</td>
              <td style={thtd}><span style={{border:'1px solid #3a3a3a', padding:'4px 8px', borderRadius:999}}>Active</span></td>
            </tr>
            <tr>
              <td style={thtd}>Michael Brown</td>
              <td style={thtd}>michael.brown@example.com</td>
              <td style={{...thtd, color:'#FFD700'}}>120</td>
              <td style={thtd}>2025-10-28</td>
              <td style={thtd}><span style={{border:'1px solid #3a3a3a', padding:'4px 8px', borderRadius:999}}>Active</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}


