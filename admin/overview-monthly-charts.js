// admin/overview-monthly-charts.js
// Two live monthly revenue charts for Overview: BlkPages packages and Businesses services

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import { getFirestore, collection, onSnapshot, query, orderBy, where } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

(function initOverviewMonthlyCharts(){
  if (!window.Chart) return;
  const blkCanvas = document.getElementById('ovBlkChart');
  const bizCanvas = document.getElementById('ovBizChart');
  const noteEl = document.getElementById('ovMonthWindowNote');
  if (!blkCanvas || !bizCanvas) return;

  const isDemo = (window.DEMO_CHARTS === true) || !window.firebaseConfig || !window.firebaseConfig.apiKey || window.firebaseConfig.apiKey === 'your-api-key-here';

  function lastWorkingDayOfMonth(date){
    const d = new Date(date.getFullYear(), date.getMonth()+1, 0);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate()-1);
    return d;
  }
  function monthWindow(){
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0,0,0,0);
    const endCandidate = lastWorkingDayOfMonth(now);
    const end = now < endCandidate ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999) : new Date(endCandidate.getFullYear(), endCandidate.getMonth(), endCandidate.getDate(), 23,59,59,999);
    return { start, end };
  }
  function setNote(){
    const { start, end } = monthWindow();
    if (noteEl) noteEl.textContent = start.toLocaleDateString('en-GB') + ' → ' + end.toLocaleDateString('en-GB');
  }
  setNote();

  function newLine(ctx, label, color){
    return new window.Chart(ctx, {
      type:'line',
      data:{ labels:[], datasets:[{ label, data:[], borderColor:color, backgroundColor: color.replace('1)', '0.2)'), tension:0.3, fill:true }]},
      options:{ responsive:true, plugins:{ legend:{ labels:{ color:'#fff' } }, tooltip:{ backgroundColor:'#111', titleColor:'#FFD700', bodyColor:'#fff' }},
        scales:{ x:{ ticks:{ color:'#aaa' }, grid:{ color:'rgba(255,255,255,0.05)' } }, y:{ ticks:{ color:'#FFD700' }, grid:{ color:'rgba(255,215,0,0.1)' } } } }
    });
  }

  let blkChart = newLine(blkCanvas.getContext('2d'), 'BlkPages Revenue (£)', 'rgba(212,175,55,1)');
  let bizChart = newLine(bizCanvas.getContext('2d'), 'Businesses Revenue (£)', 'rgba(74,222,128,1)');

  function buildDemo(){
    const { start, end } = monthWindow();
    const days = [];
    for (let d=new Date(start); d<=end; d.setDate(d.getDate()+1)) days.push(new Date(d));
    const labels = days.map(d=> d.toLocaleDateString('en-GB'));
    const blk = labels.map(()=> Math.round(40 + Math.random()*120));
    const biz = labels.map(()=> Math.round(120 + Math.random()*400));
    blkChart.data.labels = labels; blkChart.data.datasets[0].data = blk; blkChart.update();
    bizChart.data.labels = labels; bizChart.data.datasets[0].data = biz; bizChart.update();
  }

  if (isDemo) { buildDemo(); window.__initDemoOverviewMonthly = buildDemo; return; }

  try {
    const app = initializeApp(window.firebaseConfig);
    const db = getFirestore(app);
    const { start, end } = monthWindow();

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
  // expose manual trigger for demo/testing
  window.__initDemoOverviewMonthly = buildDemo;
})();


