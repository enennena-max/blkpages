import React from 'react'

export default function Disputes(){
  const wrap={ padding:24, color:'#eaeaea' }
  const header={ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }
  const title={ fontSize:22, fontWeight:800 }
  const card={ background:'#15151d', border:'1px solid #2a2a35', borderRadius:12, padding:16 }
  const table={ width:'100%', borderCollapse:'collapse', marginTop:10 }
  const thtd={ borderBottom:'1px solid #2a2a35', padding:'10px 8px', textAlign:'left', fontSize:14 }
  const btn={ background:'transparent', color:'#eaeaea', border:'1px solid rgba(255,215,0,0.35)', padding:'6px 10px', borderRadius:8, cursor:'pointer' }
  return (
    <div style={wrap}>
      <div style={header}><h2 style={title}>Disputes</h2></div>
      <div style={card}>
        <table style={table}>
          <thead>
            <tr>
              <th style={thtd}>Case</th>
              <th style={thtd}>Customer</th>
              <th style={thtd}>Amount</th>
              <th style={thtd}>Status</th>
              <th style={thtd}>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={thtd}>DSP-1009</td>
              <td style={thtd}>Emily Johnson</td>
              <td style={thtd}>£28.00</td>
              <td style={thtd}>Open</td>
              <td style={thtd}><button style={btn}>View</button></td>
            </tr>
            <tr>
              <td style={thtd}>DSP-1010</td>
              <td style={thtd}>Michael Brown</td>
              <td style={thtd}>£15.00</td>
              <td style={thtd}>Open</td>
              <td style={thtd}><button style={btn}>View</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}


