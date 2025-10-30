import React from 'react'

export default function AdjustPoints(){
  const wrap={ padding:24, color:'#eaeaea' }
  const header={ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }
  const title={ fontSize:22, fontWeight:800 }
  const card={ background:'#15151d', border:'1px solid #2a2a35', borderRadius:12, padding:16, maxWidth:520 }
  const input={ width:'100%', padding:10, borderRadius:8, border:'1px solid #333', background:'#111', color:'#eaeaea' }
  const btn={ background:'#FFD700', color:'#111', border:'none', padding:'10px 14px', borderRadius:8, fontWeight:800, cursor:'pointer' }
  return (
    <div style={wrap}>
      <div style={header}><h2 style={title}>Points Adjustments</h2></div>
      <div style={card}>
        <label>User ID or Email<br/><input style={input} placeholder="demo.user@blkpages.com"/></label><br/>
        <label>Amount (+/-)<br/><input style={input} type="number" placeholder="100"/></label><br/>
        <label>Reason<br/><textarea rows="3" style={input} placeholder="Manual adjustment"></textarea></label><br/>
        <button style={btn}>Submit Adjustment</button>
      </div>
    </div>
  )
}


