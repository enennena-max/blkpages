// admin/overview-chart.js
// Live Revenue & Bookings trend chart (non-invasive to existing logic)

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import { getFirestore, collection, onSnapshot, query, orderBy, where } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

(function initOverviewChart(){
  const canvas = document.getElementById('overviewTrendChart');
  if (!canvas || !window.Chart) return; // require chart canvas and Chart.js

  const isDemo = !window.firebaseConfig || !window.firebaseConfig.apiKey || window.firebaseConfig.apiKey === 'your-api-key-here';
  let currentRange = '7d';
  let unsubscribe = null;
  let customStart = '';
  let customEnd = '';
  let lastPoints = [];

  let chart;
  function ensureChart(labels, revenueData, bookingsData){
    const ctx = canvas.getContext('2d');
    const data = {
      labels,
      datasets: [
        {
          label: 'Revenue (£)',
          data: revenueData,
          borderColor: '#D4AF37',
          backgroundColor: 'rgba(212, 175, 55, 0.2)',
          tension: 0.3,
          fill: true,
          yAxisID: 'y1'
        },
        {
          label: 'Bookings',
          data: bookingsData,
          borderColor: '#4ADE80',
          backgroundColor: 'rgba(74, 222, 128, 0.2)',
          tension: 0.3,
          fill: true,
          yAxisID: 'y2'
        }
      ]
    };
    const options = {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      stacked: false,
      plugins: {
        legend: { labels: { color: '#fff' } },
        tooltip: { backgroundColor: '#111', titleColor: '#FFD700', bodyColor: '#fff' }
      },
      scales: {
        x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y1: { type: 'linear', position: 'left', ticks: { color: '#FFD700' }, grid: { color: 'rgba(255,215,0,0.1)' } },
        y2: { type: 'linear', position: 'right', ticks: { color: '#4ADE80' }, grid: { drawOnChartArea: false } }
      }
    };
    if (chart) { chart.data = data; chart.options = options; chart.update(); return; }
    chart = new window.Chart(ctx, { type: 'line', data, options });
  }

  function getStartDate(){
    const now = Date.now();
    if (currentRange === 'custom') {
      if (!customStart) return new Date(now - 7*24*60*60*1000);
      return new Date(customStart + 'T00:00:00');
    }
    const days = currentRange === '7d' ? 7 : currentRange === '30d' ? 30 : 90;
    const d = new Date(now - days*24*60*60*1000);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function getEndDate(){
    if (currentRange === 'custom' && customEnd) return new Date(customEnd + 'T23:59:59');
    const t = new Date(); t.setHours(23,59,59,999); return t;
  }

  function setButtonsActive(){
    const b7=document.getElementById('btnRange7');
    const b30=document.getElementById('btnRange30');
    const b90=document.getElementById('btnRange90');
    const bC=document.getElementById('btnRangeCustom');
    const activeStyle = 'background:#FFD700;color:#111;border:none';
    const idleStyle = 'background:transparent;color:#ddd;border:1px solid rgba(255,215,0,.35)';
    if (b7) b7.style.cssText = currentRange==='7d'? activeStyle+';padding:6px 10px;border-radius:8px;font-weight:700;cursor:pointer' : idleStyle+';padding:6px 10px;border-radius:8px;font-weight:700;cursor:pointer';
    if (b30) b30.style.cssText = currentRange==='30d'? activeStyle+';padding:6px 10px;border-radius:8px;font-weight:700;cursor:pointer' : idleStyle+';padding:6px 10px;border-radius:8px;font-weight:700;cursor:pointer';
    if (b90) b90.style.cssText = currentRange==='90d'? activeStyle+';padding:6px 10px;border-radius:8px;font-weight:700;cursor:pointer' : idleStyle+';padding:6px 10px;border-radius:8px;font-weight:700;cursor:pointer';
    if (bC) bC.style.cssText = currentRange==='custom'? activeStyle+';padding:6px 10px;border-radius:8px;font-weight:700;cursor:pointer' : idleStyle+';padding:6px 10px;border-radius:8px;font-weight:700;cursor:pointer';
    const s=document.getElementById('chartStart'); const e=document.getElementById('chartEnd'); const t=document.getElementById('chartTo');
    if (s && e && t) {
      const show = currentRange==='custom';
      s.style.display = show? 'inline-block':'none';
      e.style.display = show? 'inline-block':'none';
      t.style.display = show? 'inline-block':'none';
    }
  }

  // Demo Mode with range support
  function buildDemo(){
    const daysCount = currentRange==='custom' ? Math.max(1, Math.ceil((getEndDate()-getStartDate())/86400000)+1) : (currentRange==='7d'?7: currentRange==='30d'?30:90);
    const days = Array.from({length:daysCount}).map((_,i)=>{ const d=new Date(Date.now()-(daysCount-1-i)*86400000); return d.toLocaleDateString('en-GB'); });
    const bookings = days.map(()=> Math.floor(Math.random()*10)+3);
    const revenue = bookings.map(c=> c * (20 + Math.floor(Math.random()*40)));
    lastPoints = days.map((d,idx)=> ({ date:d, bookings: bookings[idx], revenue: Number(revenue[idx].toFixed(2)) }));
    ensureChart(days, revenue, bookings);
  }

  if (isDemo) {
    buildDemo();
    const b7=document.getElementById('btnRange7'); if (b7) b7.onclick=()=>{ currentRange='7d'; setButtonsActive(); buildDemo(); };
    const b30=document.getElementById('btnRange30'); if (b30) b30.onclick=()=>{ currentRange='30d'; setButtonsActive(); buildDemo(); };
    const b90=document.getElementById('btnRange90'); if (b90) b90.onclick=()=>{ currentRange='90d'; setButtonsActive(); buildDemo(); };
    setButtonsActive();
    return;
  }

  // Live Firestore wiring
  try {
    const app = initializeApp(window.firebaseConfig);
    const db = getFirestore(app);
    function subscribe(){
      if (unsubscribe) { try{ unsubscribe(); }catch(_){} }
      const start = getStartDate();
      const end = getEndDate();
      const qy = query(collection(db,'bookings'), where('createdAt','>=', start), where('createdAt','<=', end), orderBy('createdAt','asc'));
      unsubscribe = onSnapshot(qy, (snap)=>{
        const daily = Object.create(null);
        snap.docs.forEach(doc=>{
          const b = doc.data() || {};
          const ts = b.createdAt?.seconds ? new Date(b.createdAt.seconds*1000) : (b.createdAt ? new Date(b.createdAt) : new Date());
          const key = ts.toLocaleDateString('en-GB');
          if (!daily[key]) daily[key] = { bookings: 0, revenue: 0 };
          daily[key].bookings += 1;
          const paid = Number(b.amountPaid || b.total || 0);
          daily[key].revenue += paid;
        });
        const labels = Object.keys(daily).sort((a,b)=> new Date(a) - new Date(b));
        const bookingsData = labels.map(k=> daily[k].bookings);
        const revenueData = labels.map(k=> Number(daily[k].revenue.toFixed(2)) );
        lastPoints = labels.map((k,idx)=> ({ date:k, bookings: bookingsData[idx], revenue: revenueData[idx] }));
        ensureChart(labels, revenueData, bookingsData);
      }, (err)=>{ /* leave chart as-is */ });
    }

    // Initial
    subscribe();
    setButtonsActive();
    const b7=document.getElementById('btnRange7'); if (b7) b7.onclick=()=>{ currentRange='7d'; setButtonsActive(); subscribe(); };
    const b30=document.getElementById('btnRange30'); if (b30) b30.onclick=()=>{ currentRange='30d'; setButtonsActive(); subscribe(); };
    const b90=document.getElementById('btnRange90'); if (b90) b90.onclick=()=>{ currentRange='90d'; setButtonsActive(); subscribe(); };
    const bC=document.getElementById('btnRangeCustom'); if (bC) bC.onclick=()=>{ currentRange='custom'; setButtonsActive(); };
    const s=document.getElementById('chartStart'); const e=document.getElementById('chartEnd');
    if (s) s.addEventListener('change', (ev)=>{ customStart = ev.target.value; if (currentRange==='custom' && customStart && customEnd) subscribe(); });
    if (e) e.addEventListener('change', (ev)=>{ customEnd = ev.target.value; if (currentRange==='custom' && customStart && customEnd) subscribe(); });

    const btnCsv=document.getElementById('btnExportCsv');
    if (btnCsv) btnCsv.addEventListener('click', ()=>{
      const header = 'Date,Bookings,Revenue\n';
      const rows = (lastPoints||[]).map(p=> `${p.date},${p.bookings},${p.revenue}`);
      const csv = header + rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `BlkPages_Performance_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  } catch(_) { /* no-op */ }
})();


