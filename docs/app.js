// ============================================
// ROOMLY · Prototype Interactions
// ============================================

(function () {
  'use strict';

  // ---------- NAVIGATION ----------
  const pages = {
    home: document.getElementById('page-home'),
    laundry: document.getElementById('page-laundry'),
    cleaning: document.getElementById('page-cleaning'),
    tracking: document.getElementById('page-tracking'),
  };

  const navLinks = document.querySelectorAll('.nav-link');

  function navigate(target) {
    if (!pages[target]) return;
    Object.values(pages).forEach((p) => p.classList.remove('page-active'));
    pages[target].classList.add('page-active');
    navLinks.forEach((l) => {
      l.classList.toggle('active', l.dataset.nav === target);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (history.replaceState) history.replaceState(null, '', '#' + target);
  }

  document.addEventListener('click', (e) => {
    const navEl = e.target.closest('[data-nav]');
    if (navEl) {
      e.preventDefault();
      navigate(navEl.dataset.nav);
    }
  });

  // initial route from hash
  const initialHash = (window.location.hash || '#home').replace('#', '');
  if (pages[initialHash]) navigate(initialHash);

  // ---------- LAUNDRY: PRICING ----------
  const laundryPrices = {
    reguler: { rate: 7000, label: 'Reguler' },
    express: { rate: 12000, label: 'Express' },
    oneday:  { rate: 18000, label: 'One-Day' },
  };

  const formatRp = (n) => 'Rp ' + n.toLocaleString('id-ID');

  function recalcLaundry() {
    const pkgInput = document.querySelector('input[name="laundry-pkg"]:checked');
    const pkg = pkgInput ? laundryPrices[pkgInput.value] : laundryPrices.reguler;
    const weight = parseInt(document.getElementById('weight-val').textContent, 10) || 1;
    const subtotal = pkg.rate * weight;

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setText('sum-pkg', pkg.label);
    setText('sum-weight', weight);
    setText('sum-rate', formatRp(pkg.rate));
    setText('sum-sub', formatRp(subtotal));
    setText('sum-total', formatRp(subtotal));
  }

  document.querySelectorAll('input[name="laundry-pkg"]').forEach((el) => {
    el.addEventListener('change', recalcLaundry);
  });

  // weight stepper
  document.querySelectorAll('[data-weight-act]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const valEl = document.getElementById('weight-val');
      let v = parseInt(valEl.textContent, 10);
      if (btn.dataset.weightAct === 'inc') v = Math.min(v + 1, 30);
      else v = Math.max(v - 1, 1);
      valEl.textContent = v;
      recalcLaundry();
    });
  });

  recalcLaundry();

  // ---------- CLEANING: PRICING ----------
  const cleaningPrices = {
    basic:   { price: 45000,  label: 'Basic Cleaning' },
    deep:    { price: 89000,  label: 'Deep Cleaning' },
    premium: { price: 145000, label: 'Premium Care' },
  };

  const roomLabels = {
    kos: 'Kamar Kos',
    studio: 'Studio',
    apartment: 'Apartemen',
  };

  function recalcCleaning() {
    const roomInput = document.querySelector('input[name="clean-room"]:checked');
    const pkgInput = document.querySelector('input[name="clean-pkg"]:checked');
    const room = roomInput ? roomLabels[roomInput.value] : 'Kamar Kos';
    const pkg = pkgInput ? cleaningPrices[pkgInput.value] : cleaningPrices.basic;

    // count addons (each pretend +Rp 25k for demo simplicity, but use individual amounts visible in UI)
    const addons = document.querySelectorAll('.addon-card input:checked');
    const addonAmounts = [25000, 35000, 50000, 15000];
    let addonTotal = 0;
    document.querySelectorAll('.addon-card').forEach((card, i) => {
      const inp = card.querySelector('input');
      if (inp && inp.checked) addonTotal += addonAmounts[i] || 0;
    });

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setText('sum-room', room);
    setText('sum-cpkg', pkg.label);
    setText('sum-cprice', formatRp(pkg.price));
    setText('sum-ctotal', formatRp(pkg.price + addonTotal));

    const addonRow = document.querySelector('#sum-ctotal');
    // update addon "free" or count text
    const addonValueEl = document.querySelectorAll('#page-cleaning .sum-row .sum-value')[3];
    if (addonValueEl) {
      if (addons.length === 0) {
        addonValueEl.textContent = 'Tidak ada';
        addonValueEl.classList.add('sum-free');
      } else {
        addonValueEl.textContent = formatRp(addonTotal);
        addonValueEl.classList.remove('sum-free');
      }
    }
  }

  document.querySelectorAll('input[name="clean-room"], input[name="clean-pkg"], .addon-card input')
    .forEach((el) => el.addEventListener('change', recalcCleaning));

  recalcCleaning();

  // ---------- TRACKING: ORDER SELECTION ----------
  document.querySelectorAll('.order-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.order-card').forEach((c) => c.classList.remove('order-active'));
      card.classList.add('order-active');
    });
  });

  // ---------- TABS ----------
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('tab-active'));
      btn.classList.add('tab-active');
    });
  });

  // ---------- TOAST ----------
  function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    toast.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  const confirmLaundry = document.getElementById('confirm-laundry');
  if (confirmLaundry) {
    confirmLaundry.addEventListener('click', () => {
      showToast('Pesanan laundry berhasil dibuat!');
      setTimeout(() => navigate('tracking'), 800);
    });
  }

  const confirmCleaning = document.getElementById('confirm-cleaning');
  if (confirmCleaning) {
    confirmCleaning.addEventListener('click', () => {
      showToast('Pesanan cleaning service berhasil dibuat!');
      setTimeout(() => navigate('tracking'), 800);
    });
  }

  // ---------- LIVE PROGRESS DEMO ----------
  // gently animate the progress bar in tracking detail
  let progress = 62;
  setInterval(() => {
    if (!pages.tracking.classList.contains('page-active')) return;
    progress = Math.min(progress + 0.5, 92);
    const fills = document.querySelectorAll('.progress-bar-fill, .ft-bar-fill');
    fills.forEach((el) => (el.style.width = progress + '%'));
    const percent = document.querySelector('.progress-percent');
    if (percent) percent.textContent = Math.round(progress) + '%';
  }, 4000);

})();
