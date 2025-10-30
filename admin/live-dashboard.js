// admin/live-dashboard.js
// Real-time admin auto-refresh using Firestore listeners

import { getFirestore, collection, doc, onSnapshot, query, orderBy, where, limit, addDoc, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";

// Guard: only run if Firebase config is present
if (window.firebaseConfig) {
  const app = initializeApp(window.firebaseConfig);
  const db = getFirestore(app);

  document.addEventListener('DOMContentLoaded', () => {
    // Ensure containers exist (non-breaking)
    const main = document.querySelector('main') || document.body;

    function ensureSection(id, titleHtml) {
      let section = document.getElementById(id);
      if (!section) {
        section = document.createElement('section');
        section.id = id;
        section.style.marginTop = '16px';
        section.innerHTML = titleHtml;
        main.appendChild(section);
      }
      return section;
    }

    // Summary section
    const summary = ensureSection('summary', `
      <h3 style="color:#ffd700; margin-bottom:6px">📊 Summary</h3>
      <p><strong>Total Points Awarded:</strong> <span id="totalPointsAwarded">0</span></p>
      <p><strong>Total Revenue:</strong> <span id="totalRevenue">£0.00</span></p>
    `);

    // Recent bookings section
    const recent = ensureSection('recentBookingsContainer', `
      <h3 style="color:#ffd700; margin:14px 0 6px">🧾 Recent Bookings</h3>
      <div id="recentBookings"></div>
    `);

    // Leaderboard section
    const leaderboard = ensureSection('leaderboardContainer', `
      <h3 style="color:#ffd700; margin:14px 0 6px">🏆 Top Customers</h3>
      <ul id="pointsLeaderboard" style="list-style:none; padding:0; margin:0"></ul>
    `);

    // Basic row style (lightweight, inline)
    const style = document.createElement('style');
    style.textContent = `
      .booking-row{display:grid;grid-template-columns:2fr 1fr 1fr 1.4fr;gap:8px;padding:8px 0;border-bottom:1px dashed rgba(255,215,0,.25)}
    `;
    document.head.appendChild(style);

    // 1) Live bookings feed
    const bookingsQuery = query(collection(db, 'bookings'), orderBy('paymentDate', 'desc'), limit(10));
    onSnapshot(bookingsQuery, (snapshot) => {
      const wrap = document.getElementById('recentBookings');
      if (!wrap) return;
      wrap.innerHTML = '';
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() || {};
        const row = document.createElement('div');
        row.className = 'booking-row';
        const amount = Number(data.amountPaid || 0);
        const ts = data.paymentDate ? new Date(data.paymentDate) : new Date();
        row.innerHTML = `
          <div><strong>${data.customerName || 'Unknown'}</strong></div>
          <div>£${amount.toFixed(2)}</div>
          <div>${data.status || '—'}</div>
          <div>${ts.toLocaleString()}</div>
        `;
        wrap.appendChild(row);
      });
      flashElement('recentBookings');
    });

    // 2) Live admin stats
    const statsRef = doc(db, 'adminStats', 'loyaltySummary');
    onSnapshot(statsRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data() || {};
      const ptsEl = document.getElementById('totalPointsAwarded');
      const revEl = document.getElementById('totalRevenue');
      if (ptsEl) ptsEl.textContent = data.totalPointsAwarded || 0;
      if (revEl) revEl.textContent = `£${Number(data.totalRevenue || 0).toFixed(2)}`;
      flashElement('summary');
    });

    // 3) Top customers leaderboard
    const customersQuery = query(collection(db, 'customers'), orderBy('blkPoints', 'desc'), limit(5));
    onSnapshot(customersQuery, (snapshot) => {
      const list = document.getElementById('pointsLeaderboard');
      if (!list) return;
      list.innerHTML = '';
      snapshot.forEach((docSnap) => {
        const c = docSnap.data() || {};
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.padding = '6px 0';
        li.innerHTML = `<span>${c.name || 'Customer'}</span><span>${c.blkPoints || 0} pts</span>`;
        list.appendChild(li);
      });
      flashElement('leaderboardContainer');
    });

    // ───────────────────────────────────────────
    // LIVE ALERTS (payments, cancellations, signups, reviews, loyalty releases, tickets, flags)
    // ───────────────────────────────────────────
    const alertList = document.getElementById('alertList');

    // Filters with persistence
    const filters = {
      payments: true,
      cancellations: true,
      reviews: true,
      loyalty: true,
      businesses: true,
      customers: true,
      support: true,
      fraud: true
    };
    function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
    Object.keys(filters).forEach((key)=>{
      const saved = localStorage.getItem(`filter_${key}`);
      if (saved !== null) filters[key] = saved === 'true';
      const cb = document.getElementById(`filter${cap(key)}`);
      if (cb) {
        cb.checked = filters[key];
        cb.addEventListener('change', (e)=>{
          filters[key] = e.target.checked;
          localStorage.setItem(`filter_${key}`, String(e.target.checked));
        });
      }
    });

    async function logAlertToFirestore(message, typeKey, data={}){
      try{
        const alertsRef = collection(db, 'adminAlerts');
        await addDoc(alertsRef, {
          message,
          type: typeKey,
          timestamp: serverTimestamp(),
          userId: data.customerId || data.userId || null,
          businessId: data.businessId || null,
          read: false
        });
      }catch(_e){}
    }

    async function showAlert(message, typeKey, data){
      if (!alertList) return;
      if (typeKey && filters[typeKey] === false) return;
      const li = document.createElement('li');
      li.className = 'alert-item';
      li.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
          <div style="flex:1;min-width:0">${message}</div>
          <div style="display:flex;gap:6px;white-space:nowrap">
            <button class="mark-read-btn" title="Mark as read" style="background:#2a2a2a;border:1px solid #3a3a3a;color:#ddd;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:12px">Read</button>
          </div>
        </div>
      `;
      // Priority placement
      if (["fraud","support","cancellations"].includes(typeKey||'')) alertList.prepend(li); else alertList.appendChild(li);
      // Sound per type (fallback to generic)
      try {
        const src = typeKey ? `/assets/${typeKey}.mp3` : '/assets/alert.mp3';
        const sound = new Audio(src);
        sound.volume = 0.3; sound.play();
      } catch(_e){}
      // Persist to Firestore and attach id for read
      let alertId = null;
      try { alertId = await logAlertToFirestore(message, typeKey, data); } catch(_e){}
      const markBtn = li.querySelector('.mark-read-btn');
      const removeLi = () => { try { li.remove(); } catch(_e){} };
      if (markBtn) markBtn.onclick = async () => {
        try { if (db && alertId) await updateDoc(doc(db,'adminAlerts', alertId), { read: true }); } catch(_e){}
        removeLi();
      };
      setTimeout(removeLi, 60000);
    }

    // Bookings: payments + cancellations
    const bookingsAlertQ = query(collection(db,'bookings'), orderBy('paymentDate','desc'), limit(20));
    onSnapshot(bookingsAlertQ, (snap) => {
      snap.docChanges().forEach((chg) => {
        const d = chg.doc.data() || {};
        if (chg.type === 'added' && d.status === 'paid') {
          showAlert(`💳 New payment of £${Number(d.amountPaid||0).toFixed(2)} from ${d.customerName||'Customer'}`, 'payments', d);
        }
        if (chg.type === 'modified' && d.status === 'cancelled') {
          showAlert(`❌ Booking cancelled by ${d.businessName||'Business'}`, 'cancellations', d);
        }
      });
    });

    // New business signups
    onSnapshot(collection(db,'businesses'), (snap) => {
      snap.docChanges().forEach((chg) => {
        if (chg.type === 'added') {
          const d = chg.doc.data() || {};
          showAlert(`🏪 New business registered: ${d.name||'Unnamed'}`, 'businesses', d);
        }
      });
    });

    // New customer signups
    onSnapshot(collection(db,'customers'), (snap) => {
      snap.docChanges().forEach((chg) => {
        if (chg.type === 'added') {
          const d = chg.doc.data() || {};
          showAlert(`👤 New customer joined: ${d.name||'Unknown'}`, 'customers', d);
        }
      });
    });

    // Reviews
    onSnapshot(collection(db,'reviews'), (snap) => {
      snap.docChanges().forEach((chg) => {
        if (chg.type === 'added') {
          const d = chg.doc.data() || {};
          showAlert(`⭐ New review (${d.rating||'?'}★) from ${d.customerName||'Anonymous'}`, 'reviews', d);
        }
      });
    });

    // Loyalty points released
    const loyaltyQ = query(collection(db,'loyaltyQueue'), where('released','==',true), orderBy('releaseTime','desc'), limit(10));
    onSnapshot(loyaltyQ, (snap) => {
      snap.docChanges().forEach((chg) => {
        if (chg.type === 'added') {
          const d = chg.doc.data() || {};
          showAlert(`🎁 ${Math.floor(Number(d.amount||0))} BlkPoints released for ${d.customerId||'customer'}`, 'loyalty', d);
        }
      });
    });

    // Support tickets
    onSnapshot(collection(db,'supportTickets'), (snap) => {
      snap.docChanges().forEach((chg) => {
        if (chg.type === 'added') {
          const d = chg.doc.data() || {};
          showAlert(`⚠️ New support ticket from ${d.fromName||'User'}: “${d.subject||'No subject'}”`, 'support', d);
        }
      });
    });

    // Fraud flags
    onSnapshot(collection(db,'flags'), (snap) => {
      snap.docChanges().forEach((chg) => {
        if (chg.type === 'added') {
          const d = chg.doc.data() || {};
          showAlert(`🚨 Fraud flag raised: ${d.reason||'Unspecified issue'}`, 'fraud', d);
        }
      });
    });

    function flashElement(id){
      const el = document.getElementById(id);
      if (!el) return;
      el.style.transition = 'background 0.6s ease';
      el.style.background = 'rgba(255,215,0,0.18)';
      setTimeout(()=>{ el.style.background = 'transparent'; }, 900);
    }
  });
} else {
  console.log('Admin live-dashboard: firebaseConfig not present; realtime not enabled.');
}

// Demo helper: allow sending a demo alert even without Firebase configured
window.sendDemoAdminAlert = function(message, typeKey = 'payments'){
  // Respect current filter checkboxes if present
  try {
    const map = {
      payments: 'filterPayments',
      cancellations: 'filterCancellations',
      reviews: 'filterReviews',
      loyalty: 'filterLoyalty',
      businesses: 'filterBusinesses',
      customers: 'filterCustomers',
      support: 'filterSupport',
      fraud: 'filterFraud'
    };
    const cbId = map[typeKey] || '';
    if (cbId) {
      const cb = document.getElementById(cbId);
      if (cb && cb.checked === false) {
        return; // filtered out by admin preference
      }
    }
  } catch(_e){}
  const panelId = 'adminAlerts';
  const listId = 'alertList';
  let panel = document.getElementById(panelId);
  if (!panel) {
    panel = document.createElement('div');
    panel.id = panelId;
    panel.className = 'alerts-panel';
    panel.style.position = 'fixed';
    panel.style.bottom = '24px';
    panel.style.right = '24px';
    panel.style.width = '340px';
    panel.style.background = '#111';
    panel.style.color = '#fff';
    panel.style.border = '1px solid #FFD700';
    panel.style.borderRadius = '10px';
    panel.style.padding = '15px';
    panel.style.boxShadow = '0 0 15px rgba(255,215,0,0.3)';
    panel.style.zIndex = '9999';
    panel.innerHTML = '<h3 style="margin:0 0 10px;color:#ffd700">🔔 Live Alerts</h3><ul id="'+listId+'" style="list-style:none;padding:0;margin:0"></ul>';
    document.body.appendChild(panel);
  }
  const ul = document.getElementById(listId);
  if (!ul) return;
  const li = document.createElement('li');
  li.className = 'alert-item';
  li.style.background = 'rgba(255,255,255,0.05)';
  li.style.borderLeft = '3px solid #FFD700';
  li.style.marginBottom = '10px';
  li.style.padding = '10px';
  li.style.fontSize = '14px';
  li.style.borderRadius = '6px';
  li.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
      <div style="flex:1;min-width:0">${message || 'Demo alert'}</div>
      <div style="display:flex;gap:6px;white-space:nowrap">
        <button class="mark-read-btn" title="Mark as read" style="background:#2a2a2a;border:1px solid #3a3a3a;color:#ddd;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:12px">✓</button>
        <button class="dismiss-btn" title="Dismiss" style="background:#2a2a2a;border:1px solid #3a3a3a;color:#ddd;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:12px">✕</button>
      </div>
    </div>
  `;
  ul.prepend(li);
  try { const sound = new Audio('/assets/alert.mp3'); sound.volume = 0.3; sound.play(); } catch(_e){}
  const removeLi = () => { try { li.remove(); } catch(_e){} };
  const markBtn = li.querySelector('.mark-read-btn');
  const dismissBtn = li.querySelector('.dismiss-btn');
  if (markBtn) markBtn.onclick = removeLi;
  if (dismissBtn) dismissBtn.onclick = removeLi;
  setTimeout(removeLi, 60000);
}


