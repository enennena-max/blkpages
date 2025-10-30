import React from 'react'

export default function Referrals(){
  const wrap={ padding:24, color:'#eaeaea' }
  const header={ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }
  const title={ fontSize:22, fontWeight:800 }
  const card={ background:'#15151d', border:'1px solid #2a2a35', borderRadius:12, padding:16 }
  const table={ width:'100%', borderCollapse:'collapse', marginTop:10 }
  const thtd={ borderBottom:'1px solid #2a2a35', padding:'10px 8px', textAlign:'left', fontSize:14 }
  return (
    <div style={wrap}>
      <div style={header}><h2 style={title}>Referrals</h2></div>
      <div style={card}>
        <table style={table}>
          <thead>
            <tr>
              <th style={thtd}>Customer</th>
              <th style={thtd}>Referral Code</th>
              <th style={thtd}>Referred By</th>
              <th style={thtd}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={thtd}>CUST_1021</td>
              <td style={thtd}>BLK-7F3D9A</td>
              <td style={thtd}>CUST_1002</td>
              <td style={thtd}>Pending</td>
            </tr>
            <tr>
              <td style={thtd}>CUST_1022</td>
              <td style={thtd}>BLK-9A1B2C</td>
              <td style={thtd}>CUST_1005</td>
              <td style={thtd}>Confirmed</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}


