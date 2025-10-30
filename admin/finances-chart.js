// admin/finances-chart.js
// Revenue & Bookings chart with 7d/30d/90d/custom + CSV (moved from Overview)

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import { getFirestore, collection, onSnapshot, query, orderBy, where } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

(function initFinancesChart(){
  const canvas = document.getElementById('financeTrendChart');
  if (!canvas || !window.Chart) return;

  const isDemo = (window.DEMO_CHARTS === true) || !window.firebaseConfig || !window.firebaseConfig.apiKey || window.firebaseConfig.apiKey === 'your-api-key-here';
  let range = '7d';
  let unsub = null;
  let customStart = '';
  let customEnd = '';
  let lastPoints = [];

  let chart;
  function renderChart(labels, revenueData, bookingsData){
    const ctx = canvas.getContext('2d');
    const data = { labels, datasets: [
      { label:'Revenue (£)', data: revenueData, borderColor:'#D4AF37', backgroundColor:'rgba(212, 175, 55, 0.2)', tension:0.3, fill:true, yAxisID:'y1' },
      { label:'Bookings', data: bookingsData, borderColor:'#4ADE80', backgroundColor:'rgba(74,222,128,0.2)', tension:0.3, fill:true, yAxisID:'y2' }
    ]};
    const options = { responsive:true, interaction:{ mode:'index', intersect:false }, stacked:false,
      plugins:{ legend:{ labels:{ color:'#fff' } }, tooltip:{ backgroundColor:'#111', titleColor:'#FFD700', bodyColor:'#fff' }},
      scales:{ x:{ ticks:{ color:'#aaa' }, grid:{ color:'rgba(255,255,255,0.05)' } }, y1:{ type:'linear', position:'left', ticks:{ color:'#FFD700' }, grid:{ color:'rgba(255,215,0,0.1)' } }, y2:{ type:'linear', position:'right', ticks:{ color:'#4ADE80' }, grid:{ drawOnChartArea:false } } }
    };
    if (chart) { chart.data=data; chart.options=options; chart.update(); return; }
    chart = new window.Chart(ctx, { type:'line', data, options });
  }

  function getStart(){
    const now = Date.now();
    if (range==='custom') return customStart? new Date(customStart+'T00:00:00'): new Date(now-7*86400000);
    const days = range==='7d'?7: range==='30d'?30:90;
    const d = new Date(now - days*86400000);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function getEnd(){
    return (range==='custom' && customEnd)? new Date(customEnd+'T23:59:59') : new Date(new Date().setHours(23,59,59,999));
  }

  function setButtons(){
    const s = 'padding:6px 10px;border-radius:8px;font-weight:700;cursor:pointer';
    const on = 'background:#FFD700;color:#111;border:none;'+s;
    const off = 'background:transparent;color:#ddd;border:1px solid rgba(255,215,0,.35);'+s;
    const b7=document.getElementById('fBtn7'); if (b7) b7.style.cssText = range==='7d'? on:off;
    const b30=document.getElementById('fBtn30'); if (b30) b30.style.cssText = range==='30d'? on:off;
    const b90=document.getElementById('fBtn90'); if (b90) b90.style.cssText = range==='90d'? on:off;
    const bc=document.getElementById('fBtnCustom'); if (bc) bc.style.cssText = range==='custom'? on:off;
    const iS=document.getElementById('fStart'); const iE=document.getElementById('fEnd'); const iT=document.getElementById('fTo');
    if (iS && iE && iT){ const show = range==='custom'; iS.style.display= show?'inline-block':'none'; iE.style.display= show?'inline-block':'none'; iT.style.display= show?'inline-block':'none'; }
  }

  function buildDemo(){
    const daysCount = range==='custom'? Math.max(1, Math.ceil((getEnd()-getStart())/86400000)+1) : (range==='7d'?7: range==='30d'?30:90);
    const labels = Array.from({length:daysCount}).map((_,i)=>{ const d=new Date(Date.now()-(daysCount-1-i)*86400000); return d.toLocaleDateString('en-GB'); });
    const bookings = labels.map(()=> Math.floor(Math.random()*10)+3);
    const revenue = bookings.map(c=> c*(20+Math.floor(Math.random()*40)));
    lastPoints = labels.map((d,idx)=> ({ date:d, bookings: bookings[idx], revenue: Number(revenue[idx].toFixed(2)) }));
    renderChart(labels, revenue, bookings);
  }

  if (isDemo){
    buildDemo(); setButtons();
    const b7=document.getElementById('fBtn7'); if (b7) b7.onclick=()=>{ range='7d'; setButtons(); buildDemo(); };
    const b30=document.getElementById('fBtn30'); if (b30) b30.onclick=()=>{ range='30d'; setButtons(); buildDemo(); };
    const b90=document.getElementById('fBtn90'); if (b90) b90.onclick=()=>{ range='90d'; setButtons(); buildDemo(); };
    const bc=document.getElementById('fBtnCustom'); if (bc) bc.onclick=()=>{ range='custom'; setButtons(); };
    const iS=document.getElementById('fStart'); const iE=document.getElementById('fEnd');
    if (iS) iS.addEventListener('change', e=>{ customStart=e.target.value; if (range==='custom' && customStart && customEnd) buildDemo(); });
    if (iE) iE.addEventListener('change', e=>{ customEnd=e.target.value; if (range==='custom' && customStart && customEnd) buildDemo(); });
    const csv=document.getElementById('fCsv'); if (csv) csv.addEventListener('click', ()=>{
      const header='Date,Bookings,Revenue\n';
      const rows=(lastPoints||[]).map(p=> `${p.date},${p.bookings},${p.revenue}`);
      const blob=new Blob([header+rows.join('\n')],{type:'text/csv;charset=utf-8;'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`BlkPages_Performance_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
    });
    // expose manual trigger
    window.__initDemoFinancesTrend = buildDemo;
    return;
  }

  try {
    const app = initializeApp(window.firebaseConfig);
    const db = getFirestore(app);
    function subscribe(){
      if (unsub){ try{ unsub(); }catch(_){} }
      const start=getStart(); const end=getEnd();
      const qy = query(collection(db,'bookings'), where('createdAt','>=', start), where('createdAt','<=', end), orderBy('createdAt','asc'));
      unsub = onSnapshot(qy, (snap)=>{
        const daily = Object.create(null);
        snap.docs.forEach(doc=>{
          const b = doc.data()||{};
          const ts = b.createdAt?.seconds ? new Date(b.createdAt.seconds*1000) : (b.createdAt ? new Date(b.createdAt) : new Date());
          const key = ts.toLocaleDateString('en-GB');
          if (!daily[key]) daily[key] = { bookings:0, revenue:0 };
          daily[key].bookings += 1;
          daily[key].revenue += Number(b.amountPaid || b.total || 0);
        });
        const labels = Object.keys(daily).sort((a,b)=> new Date(a)-new Date(b));
        const bookings = labels.map(k=> daily[k].bookings);
        const revenue = labels.map(k=> Number(daily[k].revenue.toFixed(2)));
        lastPoints = labels.map((k,i)=> ({ date:k, bookings: bookings[i], revenue: revenue[i] }));
        renderChart(labels, revenue, bookings);
      });
    }
    subscribe(); setButtons();
    const b7=document.getElementById('fBtn7'); if (b7) b7.onclick=()=>{ range='7d'; setButtons(); subscribe(); };
    const b30=document.getElementById('fBtn30'); if (b30) b30.onclick=()=>{ range='30d'; setButtons(); subscribe(); };
    const b90=document.getElementById('fBtn90'); if (b90) b90.onclick=()=>{ range='90d'; setButtons(); subscribe(); };
    const bc=document.getElementById('fBtnCustom'); if (bc) bc.onclick=()=>{ range='custom'; setButtons(); };
    const iS=document.getElementById('fStart'); const iE=document.getElementById('fEnd');
    if (iS) iS.addEventListener('change', e=>{ customStart=e.target.value; if (range==='custom' && customStart && customEnd) subscribe(); });
    if (iE) iE.addEventListener('change', e=>{ customEnd=e.target.value; if (range==='custom' && customStart && customEnd) subscribe(); });
    const csv=document.getElementById('fCsv'); if (csv) csv.addEventListener('click', ()=>{
      const header='Date,Bookings,Revenue\n';
      const rows=(lastPoints||[]).map(p=> `${p.date},${p.bookings},${p.revenue}`);
      const blob=new Blob([header+rows.join('\n')],{type:'text/csv;charset=utf-8;'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`BlkPages_Performance_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
    });
  } catch(_) {}
})();

// Monthly charts: BlkPages packages revenue and Businesses services revenue
(function initMonthlyRevenueCharts(){
  if (!window.Chart) return;
  const blkCanvas = document.getElementById('financeBlkChart');
  const bizCanvas = document.getElementById('financeBizChart');
  const noteEl = document.getElementById('monthWindowNote');
  if (!blkCanvas || !bizCanvas) return;

  const isDemo = (window.DEMO_CHARTS === true) || !window.firebaseConfig || !window.firebaseConfig.apiKey || window.firebaseConfig.apiKey === 'your-api-key-here';

  function lastWorkingDayOfMonth(date){
    const d = new Date(date.getFullYear(), date.getMonth()+1, 0); // last day of month
    while (d.getDay() === 0 || d.getDay() === 6) { d.setDate(d.getDate()-1); }
    return d;
  }
  function monthWindow(){
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0,0,0,0);
    const endCandidate = lastWorkingDayOfMonth(now);
    const end = now < endCandidate ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999) : new Date(endCandidate.getFullYear(), endCandidate.getMonth(), endCandidate.getDate(), 23,59,59,999);
    return { start, end };
  }

  function newLineChart(ctx, label, color){
    return new window.Chart(ctx, {
      type:'line',
      data: { labels: [], datasets: [{ label, data: [], borderColor: color, backgroundColor: color.replace('1)', '0.2)'), tension:0.3, fill:true }] },
      options: { responsive:true, plugins:{ legend:{ labels:{ color:'#fff' } }, tooltip:{ backgroundColor:'#111', titleColor:'#FFD700', bodyColor:'#fff' } },
        scales:{ x:{ ticks:{ color:'#aaa' }, grid:{ color:'rgba(255,255,255,0.05)' } }, y:{ ticks:{ color:'#FFD700' }, grid:{ color:'rgba(255,215,0,0.1)' } } } }
    });
  }

  let blkChart = newLineChart(blkCanvas.getContext('2d'), 'BlkPages Revenue (£)', 'rgba(212,175,55,1)');
  let bizChart = newLineChart(bizCanvas.getContext('2d'), 'Businesses Revenue (£)', 'rgba(74,222,128,1)');

  function setNote(){
    const { start, end } = monthWindow();
    if (noteEl) noteEl.textContent = start.toLocaleDateString('en-GB') + ' → ' + end.toLocaleDateString('en-GB');
  }
  setNote();

  function buildDemo(){
    const { start, end } = monthWindow();
    const days = [];
    for (let d=new Date(start); d<=end; d.setDate(d.getDate()+1)){
      days.push(new Date(d));
    }
    const labels = days.map(d=> d.toLocaleDateString('en-GB'));
    const blk = labels.map(()=> Math.round(40 + Math.random()*120));
    const biz = labels.map(()=> Math.round(120 + Math.random()*400));
    blkChart.data.labels = labels; blkChart.data.datasets[0].data = blk; blkChart.update();
    bizChart.data.labels = labels; bizChart.data.datasets[0].data = biz; bizChart.update();
  }

  if (isDemo){ buildDemo(); return; }
  // expose manual trigger even in live
  window.__initDemoFinancesMonthly = buildDemo;

  try {
    const app = initializeApp(window.firebaseConfig);
    const db = getFirestore(app);
    const { start, end } = monthWindow();

    // BlkPages revenue from businessPayments.paidAt
    onSnapshot(query(collection(db,'businessPayments'), where('paidAt','>=', start), where('paidAt','<=', end), orderBy('paidAt','asc')), (snap)=>{
      const byDay = Object.create(null);
      snap.docs.forEach(doc=>{
        const p = doc.data()||{};
        const ts = p.paidAt?.seconds ? new Date(p.paidAt.seconds*1000) : (p.paidAt ? new Date(p.paidAt) : new Date());
        const key = ts.toLocaleDateString('en-GB');
        byDay[key] = (byDay[key]||0) + Number(p.amount||0);
      });
      const labels = Object.keys(byDay).sort((a,b)=> new Date(a)-new Date(b));
      blkChart.data.labels = labels;
      blkChart.data.datasets[0].data = labels.map(k=> Number(byDay[k].toFixed(2)) );
      blkChart.update();
    });

    // Businesses revenue from bookings.paymentDate/createdAt
    onSnapshot(query(collection(db,'bookings'), where('paymentDate','>=', start), where('paymentDate','<=', end), orderBy('paymentDate','asc')), (snap)=>{
      const byDay = Object.create(null);
      snap.docs.forEach(doc=>{
        const b = doc.data()||{};
        const tsv = b.paymentDate?.seconds ? new Date(b.paymentDate.seconds*1000) : (b.paymentDate ? new Date(b.paymentDate) : (b.createdAt?.seconds ? new Date(b.createdAt.seconds*1000) : new Date(b.createdAt || Date.now())));
        const key = tsv.toLocaleDateString('en-GB');
        byDay[key] = (byDay[key]||0) + Number(b.amountPaid || b.total || 0);
      });
      const labels = Object.keys(byDay).sort((a,b)=> new Date(a)-new Date(b));
      bizChart.data.labels = labels;
      bizChart.data.datasets[0].data = labels.map(k=> Number(byDay[k].toFixed(2)) );
      bizChart.update();
    });
  } catch(_) {}
})();



