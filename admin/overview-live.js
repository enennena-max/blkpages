// admin/overview-live.js
// Live Firestore bindings for Admin Overview (visuals untouched)

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import { getFirestore, collection, onSnapshot, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

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
    // Example collections: 'reviews', 'businesses', 'disputes' with status fields
    onSnapshot(collection(db, 'reviews'), (snap) => {
      const pending = snap.docs.filter(d => (d.data()?.status || '').toLowerCase() === 'pending').length;
      const el = document.getElementById('revCount'); if (el) el.textContent = String(pending);
    }, (err) => { const el = document.getElementById('revCount'); if (el) el.textContent = '—'; });

    onSnapshot(collection(db, 'businesses'), (snap) => {
      const pending = snap.docs.filter(d => (d.data()?.status || '').toLowerCase() === 'pending').length;
      const el = document.getElementById('bizCount'); if (el) el.textContent = String(pending);
    }, (err) => { const el = document.getElementById('bizCount'); if (el) el.textContent = '—'; });

    onSnapshot(collection(db, 'disputes'), (snap) => {
      const open = snap.docs.filter(d => (d.data()?.status || '').toLowerCase() !== 'closed').length;
      const el = document.getElementById('disputeCount'); if (el) el.textContent = String(open);
    }, (err) => { const el = document.getElementById('disputeCount'); if (el) el.textContent = '—'; });
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
})();


