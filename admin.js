/* ═══════════ HYPRRIDE — Admin Panel JS ═══════════ */
(function () {
  'use strict';

  const ADMIN_PASS = 'hyprride2026'; /* fallback only — email sign-in is in admin-auth.js */

  const VEHICLES = [
    { slug: 'jupiter-110', name: 'TVS Jupiter 110',     cc: '110', type: 'Scooter',    img: 'jupiter-110.jpg' },
    { slug: 'jupiter-125', name: 'TVS Jupiter 125',     cc: '125', type: 'Scooter',    img: 'jupiter-125.jpg' },
    { slug: 'ntorq-125',   name: 'TVS Ntorq 125',       cc: '125', type: 'Scooter',    img: 'ntorq-125.avif' },
    { slug: 'raider-125',  name: 'TVS Raider 125',      cc: '125', type: 'Motorcycle', img: 'tvs-raider-125.jpg' },
    { slug: 'rayzr-125',   name: 'Yamaha RayZR 125',    cc: '125', type: 'Scooter',    img: 'rayzr-125.avif' },
    { slug: 'apache-160',  name: 'TVS Apache RTR 160',  cc: '160', type: 'Motorcycle', img: '9231777.jpg' },
  ];

  const RATES = {
    '110': { wd: [79, 179, 279, 339, 389, 499], we: [99, 219, 329, 409, 469, 599] },
    '125': { wd: [99, 219, 309, 369, 499, 599], we: [119, 259, 369, 439, 509, 699] },
    '160': { wd: [119, 259, 369, 439, 509, 699], we: [139, 309, 449, 529, 609, 839] },
  };

  const $ = id => document.getElementById(id);
  const rupee = n => '₹' + n.toLocaleString('en-IN');

  /* ────────────── AUTH ────────────── */
  const loginScreen = $('loginScreen');
  const dashboard = $('dashboard');

  function isLoggedIn() {
    return sessionStorage.getItem('hyprride_admin') === '1';
  }

  function showDashboard() {
    loginScreen.hidden = true;
    dashboard.hidden = false;
    document.body.style.overflow = '';
    refreshAll();
  }

  if (isLoggedIn()) {
    showDashboard();
  }

  // Password eye toggle
  const loginEye = $('loginEye');
  const loginPass = $('loginPass');
  loginEye.addEventListener('click', () => {
    const isPass = loginPass.type === 'password';
    loginPass.type = isPass ? 'text' : 'password';
    loginEye.innerHTML = isPass
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  });

  $('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const val = loginPass.value.trim();
    if (val === ADMIN_PASS) {
      sessionStorage.setItem('hyprride_admin', '1');
      showDashboard();
    } else {
      $('loginErr').textContent = 'Incorrect password. Please try again.';
      loginPass.focus();
      loginPass.select();
    }
  });

  $('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('hyprride_admin');
    dashboard.hidden = true;
    loginScreen.hidden = false;
    loginPass.value = '';
    $('loginErr').textContent = '';
  });

  /* ────────────── SIDEBAR / TABS ────────────── */
  const sidebar = $('sidebar');
  const hamburger = $('hamburger');

  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    hamburger.classList.toggle('open');
  });

  const tabs = {
    overview: $('tabOverview'),
    bookings: $('tabBookings'),
    fleet: $('tabFleet'),
  };
  const navItems = document.querySelectorAll('.nav-item[data-tab]');

  function switchTab(tab) {
    Object.values(tabs).forEach(t => t.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));
    tabs[tab].classList.add('active');
    document.querySelector(`.nav-item[data-tab="${tab}"]`).classList.add('active');
    sidebar.classList.remove('open');
    hamburger.classList.remove('open');
  }

  navItems.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  /* ────────────── DATA ────────────── */
  function getBookings() {
    return JSON.parse(localStorage.getItem('hyprride_bookings') || '[]');
  }

  function saveBookings(bookings) {
    const raw = JSON.stringify(bookings);
    localStorage.setItem('hyprride_bookings', raw);
    lastSnapshot = raw; // our own write — don't re-toast on next poll
  }

  function getFleetAvailability() {
    return JSON.parse(localStorage.getItem('hyprride_fleet') || '{}');
  }

  function saveFleetAvailability(fleet) {
    localStorage.setItem('hyprride_fleet', JSON.stringify(fleet));
  }

  /* ────────────── OVERVIEW TAB ────────────── */
  function renderOverview() {
    const bookings = getBookings();
    const total = bookings.length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const revenue = bookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + (b.total || 0), 0);

    $('statTotal').textContent = total;
    $('statPending').textContent = pending;
    $('statConfirmed').textContent = confirmed;
    $('statRevenue').textContent = rupee(revenue);

    // Popular vehicles
    const vehicleCounts = {};
    bookings.forEach(b => {
      vehicleCounts[b.vehicle] = (vehicleCounts[b.vehicle] || 0) + 1;
    });
    const sorted = Object.entries(vehicleCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const popularEl = $('popularVehicles');
    if (sorted.length === 0) {
      popularEl.innerHTML = '<p class="empty-state">No booking data yet</p>';
    } else {
      popularEl.innerHTML = sorted.map(([name, count]) =>
        `<div class="popular-item">
          <span class="popular-item-name">${esc(name)}</span>
          <span class="popular-item-count">${count} booking${count > 1 ? 's' : ''}</span>
        </div>`
      ).join('');
    }

    // Recent bookings
    const recent = bookings.slice(0, 5);
    const recentEl = $('recentBookings');
    if (recent.length === 0) {
      recentEl.innerHTML = '<p class="empty-state">No bookings yet</p>';
    } else {
      recentEl.innerHTML = recent.map(b =>
        `<div class="recent-item">
          <div class="recent-item-info">
            <span class="recent-item-name">${esc(b.name)}</span>
            <span class="recent-item-detail">${esc(b.vehicle)} · ${esc(b.duration)} · ${timeAgo(b.timestamp)}</span>
          </div>
          <span class="recent-item-amount">${rupee(b.total)}</span>
        </div>`
      ).join('');
    }
  }

  /* ────────────── BOOKINGS TAB ────────────── */
  let currentFilter = 'all';
  let searchQuery = '';

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderBookings();
    });
  });

  $('bookingSearch').addEventListener('input', e => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderBookings();
  });

  function renderBookings() {
    let bookings = getBookings();

    // Filter
    if (currentFilter !== 'all') {
      bookings = bookings.filter(b => b.status === currentFilter);
    }

    // Search
    if (searchQuery) {
      bookings = bookings.filter(b =>
        (b.name || '').toLowerCase().includes(searchQuery) ||
        (b.phone || '').includes(searchQuery) ||
        (b.vehicle || '').toLowerCase().includes(searchQuery)
      );
    }

    const tbody = $('bookingsBody');
    const empty = $('emptyBookings');

    if (bookings.length === 0) {
      tbody.innerHTML = '';
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    const NEXT_STATUS = {
      pending: { to: 'confirmed', label: '✓ Confirm', cls: 'quick-confirm' },
      confirmed: { to: 'completed', label: '✓ Done', cls: 'quick-done' },
    };
    tbody.innerHTML = bookings.map(b => {
      const statusClass = 'status-' + b.status;
      const typeClass = b.outstation ? 'type-outstation' : 'type-city';
      const typeLabel = b.outstation ? 'Outstation' : 'In-city';
      const pickupStr = b.pickupFormatted || formatDate(b.pickup);
      const next = NEXT_STATUS[b.status];

      return `<tr data-id="${b.id}">
        <td>
          <div class="rider-cell">
            <span class="rider-name">${esc(b.name)}</span>
            <span class="rider-phone">+91 ${b.phone}</span>
          </div>
        </td>
        <td>${esc(b.vehicle)}</td>
        <td>${esc(pickupStr)}</td>
        <td>${esc(b.duration)}</td>
        <td><span class="type-badge ${typeClass}">${typeLabel}</span></td>
        <td><strong>${rupee(b.total)}</strong></td>
        <td><span class="status-badge ${statusClass}">${b.status}</span></td>
        <td>
          <div class="action-btns">
            ${next ? `<button class="quick-btn ${next.cls}" title="Mark as ${next.to}" onclick="window.adminActions.quickStatus('${b.id}','${next.to}')">${next.label}</button>` : ''}
            <button class="action-btn wa-action" title="WhatsApp" onclick="window.adminActions.whatsapp('${b.phone}')">
              <svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"/></svg>
            </button>
            <button class="action-btn call-action" title="Call" onclick="window.adminActions.call('${b.phone}')">
              <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </button>
            <button class="action-btn view-action" title="View details" onclick="window.adminActions.viewBooking('${b.id}')">
              <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  /* ────────────── FLEET TAB ────────────── */
  function renderFleet() {
    const fleet = getFleetAvailability();
    const grid = $('fleetGrid');

    grid.innerHTML = VEHICLES.map(v => {
      const available = fleet[v.slug] !== false; // default available
      const rates = RATES[v.cc];

      return `<div class="fleet-card">
        <img class="fleet-card-img" src="${v.img}" alt="${esc(v.name)}">
        <div class="fleet-card-body">
          <div class="fleet-card-name">${esc(v.name)}</div>
          <div class="fleet-card-meta">
            <span class="fleet-tag fleet-tag-type">${v.type.toUpperCase()}</span>
            <span class="fleet-tag fleet-tag-cc">${v.cc}CC</span>
          </div>
          <div class="fleet-rates">
            <div class="fleet-rate-item">
              <div class="fleet-rate-label">Weekday (1h)</div>
              <div class="fleet-rate-value">${rupee(rates.wd[0])}</div>
            </div>
            <div class="fleet-rate-item">
              <div class="fleet-rate-label">Weekend (1h)</div>
              <div class="fleet-rate-value">${rupee(rates.we[0])}</div>
            </div>
            <div class="fleet-rate-item">
              <div class="fleet-rate-label">Weekday (24h)</div>
              <div class="fleet-rate-value">${rupee(rates.wd[5])}</div>
            </div>
            <div class="fleet-rate-item">
              <div class="fleet-rate-label">Weekend (24h)</div>
              <div class="fleet-rate-value">${rupee(rates.we[5])}</div>
            </div>
          </div>
          <div class="fleet-avail">
            <span class="fleet-avail-label">
              <span class="fleet-avail-dot ${available ? 'available' : 'unavailable'}"></span>
              ${available ? 'Available' : 'Unavailable'}
            </span>
            <label class="fleet-switch">
              <input type="checkbox" ${available ? 'checked' : ''} onchange="window.adminActions.toggleFleet('${v.slug}', this.checked)">
              <span class="fleet-switch-track"><span class="fleet-switch-thumb"></span></span>
            </label>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  /* ────────────── BOOKING MODAL ────────────── */
  const modal = $('bookingModal');

  function openBookingModal(bookingId) {
    const bookings = getBookings();
    const b = bookings.find(x => x.id === bookingId);
    if (!b) return;

    const statusButtons = ['pending', 'confirmed', 'completed', 'cancelled'].map(s => {
      const isActive = b.status === s;
      return `<button class="modal-status-btn ${isActive ? 'active-' + s : ''}" onclick="window.adminActions.setStatus('${b.id}','${s}')">${s.charAt(0).toUpperCase() + s.slice(1)}</button>`;
    }).join('');

    $('modalContent').innerHTML = `
      <button class="modal-close" onclick="window.adminActions.closeModal()">
        <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <h2 class="modal-title">Booking — ${esc(b.name)}</h2>

      <div class="modal-section">
        <div class="modal-section-title">Rider Details</div>
        <dl class="modal-dl">
          <dt>Name</dt><dd>${esc(b.name)}</dd>
          <dt>Phone</dt><dd>+91 ${b.phone}</dd>
          ${b.address ? `<dt>Address</dt><dd>${esc(b.address)}</dd>` : ''}
          ${b.emergencyName ? `<dt>Emergency</dt><dd>${esc(b.emergencyName)}${b.emergencyPhone ? ' (+91 ' + b.emergencyPhone + ')' : ''}</dd>` : ''}
        </dl>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Ride Details</div>
        <dl class="modal-dl">
          <dt>Vehicle</dt><dd>${esc(b.vehicle)} · ${b.vehicleType} · ${b.vehicleCC}cc</dd>
          <dt>Pickup</dt><dd>${b.pickupFormatted || formatDate(b.pickup)}</dd>
          <dt>Duration</dt><dd>${esc(b.duration)} · ${b.kmIncluded} km included</dd>
          <dt>Rate Type</dt><dd>${esc(b.rateType)} slab</dd>
          <dt>Trip Type</dt><dd>${b.outstation ? '🗺️ Outstation' : 'In-city'}</dd>
          <dt>Helmets</dt><dd>${b.helmets}</dd>
          <dt>Raincoats</dt><dd>${b.raincoats}</dd>
          <dt>Unlimited KM</dt><dd>${b.unlimitedKM ? 'Yes' : 'No'}</dd>
        </dl>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Pricing</div>
        <dl class="modal-dl">
          <dt>Rental</dt><dd>${rupee(b.rental)}</dd>
          ${b.addons ? `<dt>Add-ons</dt><dd>${rupee(b.addons)}</dd>` : ''}
          ${b.unlimitedCost ? `<dt>Unlimited KM</dt><dd>${rupee(b.unlimitedCost)}</dd>` : ''}
          <dt>GST (18%)</dt><dd>${rupee(b.gst)}</dd>
          <dt>Deposit</dt><dd>${rupee(b.deposit)} ${b.outstation ? '(outstation)' : ''}</dd>
          <dt>Total</dt><dd><strong style="color:var(--admin-red);font-size:1.1rem">${rupee(b.total)}</strong></dd>
        </dl>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Status</div>
        <div class="modal-status-group">${statusButtons}</div>
      </div>

      <div class="modal-section" style="margin-top:.5rem">
        <div class="modal-section-title" style="font-size:.7rem;color:var(--admin-muted)">Booked: ${formatDate(b.timestamp)}</div>
      </div>

      <div class="modal-actions">
        <button class="modal-action-btn modal-wa-btn" onclick="window.adminActions.whatsapp('${b.phone}')">
          <svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"/></svg>
          WhatsApp
        </button>
        <button class="modal-action-btn modal-call-btn" onclick="window.adminActions.call('${b.phone}')">
          <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          Call
        </button>
        <button class="modal-action-btn modal-delete-btn" onclick="window.adminActions.deleteBooking('${b.id}')">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Delete
        </button>
      </div>
    `;

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  $('modalBackdrop').addEventListener('click', closeModal);

  /* ────────────── ACTIONS ────────────── */
  window.adminActions = {
    whatsapp(phone) {
      window.open('https://wa.me/91' + phone, '_blank');
    },

    call(phone) {
      window.open('tel:+91' + phone);
    },

    viewBooking(id) {
      openBookingModal(id);
    },

    closeModal() {
      closeModal();
    },

    setStatus(id, status) {
      const bookings = getBookings();
      const idx = bookings.findIndex(b => b.id === id);
      if (idx === -1) return;
      bookings[idx].status = status;
      saveBookings(bookings);
      openBookingModal(id); // refresh modal
      refreshAll();
    },

    quickStatus(id, status) {
      const bookings = getBookings();
      const idx = bookings.findIndex(b => b.id === id);
      if (idx === -1) return;
      bookings[idx].status = status;
      saveBookings(bookings);
      refreshAll();
      toast(status === 'confirmed'
        ? '✓ Booking confirmed — ' + (bookings[idx].name || 'rider')
        : '✓ Ride done — ' + (bookings[idx].name || 'rider'));
    },

    deleteBooking(id) {
      if (!confirm('Are you sure you want to delete this booking? This cannot be undone.')) return;
      let bookings = getBookings();
      bookings = bookings.filter(b => b.id !== id);
      saveBookings(bookings);
      closeModal();
      refreshAll();
    },

    toggleFleet(slug, available) {
      const fleet = getFleetAvailability();
      fleet[slug] = available;
      saveFleetAvailability(fleet);
      renderFleet();
    },

    /* called by admin-auth.js once Firebase confirms an allowed staff email */
    signedIn() {
      sessionStorage.setItem('hyprride_admin', '1');
      showDashboard();
    },

    signedOut() {
      sessionStorage.removeItem('hyprride_admin');
      dashboard.hidden = true;
      loginScreen.hidden = false;
      loginPass.value = '';
    },
  };

  /* ────────────── HELPERS ────────────── */
  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      });
    } catch {
      return iso;
    }
  }

  function timeAgo(iso) {
    if (!iso) return '';
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return mins + 'm ago';
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return hrs + 'h ago';
      const days = Math.floor(hrs / 24);
      if (days < 7) return days + 'd ago';
      return formatDate(iso);
    } catch {
      return '';
    }
  }

  /* ────────────── TOAST ────────────── */
  let toastTimer = null;
  function toast(msg) {
    let el = $('adminToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'adminToast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }

  /* ────────────── REFRESH ALL ────────────── */
  function refreshAll() {
    renderOverview();
    renderBookings();
    renderFleet();
  }

  // Listen for storage changes from booking page (other tabs, same browser)
  window.addEventListener('storage', e => {
    if (e.key === 'hyprride_bookings') refreshAll();
  });

  /* ────────────── LIVE POLL — keep the page open, it stays current ────────────── */
  let lastSnapshot = localStorage.getItem('hyprride_bookings') || '[]';
  setInterval(() => {
    if (dashboard.hidden) return;
    const raw = localStorage.getItem('hyprride_bookings') || '[]';
    if (raw === lastSnapshot) return;
    let grew = false;
    try { grew = JSON.parse(raw).length > JSON.parse(lastSnapshot).length; } catch { /* ignore */ }
    lastSnapshot = raw;
    refreshAll();
    if (grew) toast('🔔 New booking request received');
  }, 4000);

})();
