(function () {
  function setVhUnit() {
    document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
  }
  setVhUnit();
  window.addEventListener('resize', setVhUnit);
  window.addEventListener('orientationchange', () => setTimeout(setVhUnit, 120));

  const DATA_URL = 'https://script.google.com/macros/s/AKfycbx_FZBKal3bv6tWPly9Ez285qK6AdoRkEBtpsY98agX6My5nkEOKFQd5UECkC7MdgoCtw/exec';
  const balanceEl = document.getElementById('balance');
  const txContainer = document.getElementById('transactions');
  const loader = document.getElementById('loader');
  const wallet = document.getElementById('wallet');
  const MIN_LOADER_MS = 1200;

  function formatMoney(n) { return '$' + Number(n || 0).toFixed(2); }
  function formatSignedMoney(n) { const sign = (n >= 0) ? '+' : '-'; return sign + '$' + Math.abs(Number(n || 0)).toFixed(2); }

  function clearAndShowLoading() {
    txContainer.innerHTML = '';
    const loading = document.createElement('div');
    loading.className = 'loading-state';
    loading.innerHTML = '<span class="loading-spinner" aria-hidden="true"></span> Loading transactions...';
    txContainer.appendChild(loading);
  }

  function renderTransactions(data) {
    balanceEl.classList.remove('loading');
    balanceEl.textContent = formatMoney(data.balance);

    txContainer.innerHTML = '';
    if (!data.transactions || data.transactions.length === 0) {
      txContainer.innerHTML = '<div class="empty-state">No transactions yet</div>';
      return;
    }

    data.transactions.forEach((tx, index) => {
      const row = document.createElement('div');
      row.className = 'tx';
      row.style.animationDelay = `${index * 0.04}s`;
      row.setAttribute('role', 'listitem');

      const item = document.createElement('span');
      item.className = 'tx-item';
      item.textContent = tx.item ?? 'Transaction';

      const amount = document.createElement('span');
      amount.className = 'tx-amount ' + (Number(tx.amount) >= 0 ? 'positive' : 'negative');
      amount.textContent = formatSignedMoney(tx.amount);

      row.appendChild(item);
      row.appendChild(amount);
      txContainer.appendChild(row);
    });
  }

  function fetchWithTimeout(url, timeout = 8000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
  }

  (function load() {
    const start = Date.now();
    wallet.classList.add('hidden');
    wallet.setAttribute('aria-hidden', 'true');
    loader.setAttribute('aria-busy', 'true');

    clearAndShowLoading();

    fetchWithTimeout(DATA_URL, 8000)
      .then(resp => {
        if (!resp.ok) throw new Error('Network response failed: ' + resp.status);
        return resp.json();
      })
      .then(data => {
        data.balance = Number(data.balance) || 0;
        data.transactions = Array.isArray(data.transactions) ? data.transactions : [];
        renderTransactions(data);

        const elapsed = Date.now() - start;
        const wait = Math.max(0, MIN_LOADER_MS - elapsed);
        setTimeout(() => {
          loader.classList.add('hidden');
          loader.setAttribute('aria-busy', 'false');
          wallet.classList.remove('hidden');
          wallet.setAttribute('aria-hidden', 'false');
        }, wait);
      })
      .catch(err => {
        console.error('Data load error', err);
        const elapsed = Date.now() - start;
        const wait = Math.max(0, MIN_LOADER_MS - elapsed);
        setTimeout(() => {
          txContainer.innerHTML = '<div class="error-state">Unable to load transactions<br>Please try again later</div>';
          loader.classList.add('hidden');
          loader.setAttribute('aria-busy', 'false');
          wallet.classList.remove('hidden');
          wallet.setAttribute('aria-hidden', 'false');
        }, wait);
      });
  })();
})();