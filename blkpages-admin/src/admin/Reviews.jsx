import React from 'react'

export default function Reviews(){
  const wrap={ padding:24, color:'#eaeaea' }
  const header={ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }
  const title={ fontSize:22, fontWeight:800 }
  const card={ background:'#15151d', border:'1px solid #2a2a35', borderRadius:12, padding:16 }
  const table={ width:'100%', borderCollapse:'collapse', marginTop:10 }
  const thtd={ borderBottom:'1px solid #2a2a35', padding:'10px 8px', textAlign:'left', fontSize:14 }
  const btn={ background:'#FFD700', color:'#111', border:'none', padding:'6px 10px', borderRadius:8, fontWeight:700, cursor:'pointer' }
  return (
    <div style={wrap}>
      <div style={header}><h2 style={title}>Verify Reviews</h2></div>
      <div style={card}>
        <table style={table}>
          <thead>
            <tr>
              <th style={thtd}>ID</th>
              <th style={thtd}>Business</th>
              <th style={thtd}>User</th>
              <th style={thtd}>Rating</th>
              <th style={thtd}>Review</th>
              <th style={thtd}>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={thtd}>#R-1023</td>
              <td style={thtd}>Royal Hair</td>
              <td style={thtd}>aisha.j@example.com</td>
              <td style={thtd}>⭐ 5</td>
              <td style={thtd}>Amazing service, will return!</td>
              <td style={thtd}><button style={btn}>Verify</button></td>
            </tr>
            <tr>
              <td style={thtd}>#R-1022</td>
              <td style={thtd}>Glow Spa</td>
              <td style={thtd}>mike.b@example.com</td>
              <td style={thtd}>⭐ 4</td>
              <td style={thtd}>Great ambience and staff.</td>
              <td style={thtd}><button style={btn}>Verify</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}


