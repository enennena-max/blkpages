// admin/overview-live.js
// Live Firestore bindings for Admin Overview (visuals untouched)

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import { getFirestore, collection, onSnapshot, query, orderBy, limit, where } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

(function initLiveOverview(){
  if (!window.firebaseConfig) return; // no-op without config
  const app = initializeApp(window.firebaseConfig);
  const db = getFirestore(app);

  // Cards: Pending Reviews, Pending Businesses, Disputes (example live bindings)
  try {
    // Loading placeholders
    const revEl = document.getElementById('revCount'); if (revEl) revEl.textContent = '…';
    const bizEl = document.getElementById('bizCount'); if (bizEl) bizEl.textContent = '…';
    const disEl = document.getElementById('disputeCount'); if (disEl) disEl.textContent = '…';
    const usersTotalEl = document.getElementById('usersTotal'); if (usersTotalEl) usersTotalEl.textContent = '…';
    const bizTotalEl = document.getElementById('bizTotal'); if (bizTotalEl) bizTotalEl.textContent = '…';
    const pendingReviewsEl = document.getElementById('pendingReviewsTotal'); if (pendingReviewsEl) pendingReviewsEl.textContent = '…';
    const openDisputesEl = document.getElementById('openDisputesTotal'); if (openDisputesEl) openDisputesEl.textContent = '…';
    const unreadAlertsEl = document.getElementById('unreadAlertsTotal'); if (unreadAlertsEl) unreadAlertsEl.textContent = '…';
    // Example collections: 'reviews', 'businesses', 'disputes' with status fields
    onSnapshot(collection(db, 'reviews'), (snap) => {
      const pending = snap.docs.filter(d => (d.data()?.status || '').toLowerCase() === 'pending').length;
      const el = document.getElementById('revCount'); if (el) el.textContent = String(pending);
      const pEl = document.getElementById('pendingReviewsTotal'); if (pEl) pEl.textContent = String(pending);
    }, (err) => { const el = document.getElementById('revCount'); if (el) el.textContent = '—'; });

    onSnapshot(collection(db, 'businesses'), (snap) => {
      const pending = snap.docs.filter(d => (d.data()?.status || '').toLowerCase() === 'pending').length;
      const el = document.getElementById('bizCount'); if (el) el.textContent = String(pending);
      const totalEl = document.getElementById('bizTotal'); if (totalEl) totalEl.textContent = String(snap.size);
    }, (err) => { const el = document.getElementById('bizCount'); if (el) el.textContent = '—'; });

    onSnapshot(collection(db, 'disputes'), (snap) => {
      const open = snap.docs.filter(d => (d.data()?.status || '').toLowerCase() !== 'closed').length;
      const el = document.getElementById('disputeCount'); if (el) el.textContent = String(open);
      const openEl = document.getElementById('openDisputesTotal'); if (openEl) openEl.textContent = String(open);
    }, (err) => { const el = document.getElementById('disputeCount'); if (el) el.textContent = '—'; const openEl=document.getElementById('openDisputesTotal'); if (openEl) openEl.textContent='—'; });

    // Users total
    onSnapshot(collection(db, 'users'), (snap)=>{
      const el = document.getElementById('usersTotal'); if (el) el.textContent = String(snap.size);
    }, (err)=>{ const el=document.getElementById('usersTotal'); if (el) el.textContent='—'; });

    // Unread alerts
    onSnapshot(query(collection(db, 'adminAlerts'), where('read','==', false)), (snap)=>{
      const el=document.getElementById('unreadAlertsTotal'); if (el) el.textContent=String(snap.size);
    }, (err)=>{ const el=document.getElementById('unreadAlertsTotal'); if (el) el.textContent='—'; });
  } catch(_) {}

  // Recent bookings summary (inject simple rows into #recentBookings if present)
  try {
    const recentWrap = document.getElementById('recentBookings');
    if (recentWrap) {
      // Loading spinner
      recentWrap.innerHTML = '<div style="padding:12px; color:#ffd700;">Loading…</div>';
      const q = query(collection(db, 'bookings'), orderBy('paymentDate', 'desc'), limit(10));
      onSnapshot(q, (snap) => {
        recentWrap.innerHTML = '';
        snap.docs.forEach(d => {
          const b = d.data() || {};
          const row = document.createElement('div');
          row.className = 'booking-row';
          const amount = Number(b.amountPaid || 0).toFixed(2);
          const ts = b.paymentDate ? new Date(b.paymentDate) : new Date();
          row.innerHTML = `
            <div><strong>${b.customerName || 'Unknown'}</strong></div>
            <div>£${amount}</div>
            <div>${b.status || '—'}</div>
            <div>${ts.toLocaleString()}</div>
          `;
          recentWrap.appendChild(row);
        });
        if (!recentWrap.children.length) {
          recentWrap.innerHTML = '<div style="padding:12px; color:#aaa;">No recent bookings</div>';
        }
      }, (err) => { recentWrap.innerHTML = '<div style="padding:12px; color:#ff6b6b;">⚠️ Failed to load recent bookings</div>'; });
    }
  } catch(_) {}

  // Revenue / Refunds (from bookings)
  try {
    const revenueEl = document.getElementById('revenueTotal');
    const refundsEl = document.getElementById('refundsTotal');
    if (revenueEl || refundsEl) {
      onSnapshot(collection(db, 'bookings'), (snap)=>{
        let revenue = 0;
        let refunds = 0;
        snap.docs.forEach(d=>{
          const b = d.data() || {};
          const status = (b.status || '').toLowerCase();
          const amountPaid = Number(b.amountPaid || b.total || 0);
          const refundAmt = Number(b.refundAmount || 0);
          if (status === 'paid' || status === 'completed') revenue += amountPaid;
          if (refundAmt > 0) refunds += refundAmt;
        });
        const fmt = (n)=>'£'+(Number(n||0).toFixed(0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        if (revenueEl) revenueEl.textContent = fmt(revenue);
        if (refundsEl) refundsEl.textContent = fmt(refunds);
      }, (err)=>{
        if (revenueEl) revenueEl.textContent = '—';
        if (refundsEl) refundsEl.textContent = '—';
      });
    }
  } catch(_) {}
})();


