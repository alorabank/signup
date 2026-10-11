/* Alora Bank — Supabase client.
 *
 * SETUP: paste your two values below.
 * Supabase dashboard -> Project Settings -> API -> Project URL + anon public key.
 * (The anon key is public by design — it ships in this file. Never put the
 * service_role key in frontend code.)
 */
var SUPABASE_URL = "https://zvubytosshkxpbpvgcsw.supabase.co";
var SUPABASE_ANON_KEY = "sb_publishable_c1sl1Mw4Y5EMWjkmYSzEow_m5Yowqk0";

window.supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// PWA: register the service worker (all pages load this file).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  });
}

window.Alora = (function () {
  'use strict';

  function money(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function genReference() {
    var d = '';
    for (var i = 0; i < 9; i++) d += Math.floor(Math.random() * 10);
    return 'ALB' + d;
  }

  // Bank-style receipt popup. Requires #confirm-backdrop markup on the page.
  // o: { status: 'success'|'pending', amount, from, to, reference, date }
  function showReceipt(o) {
    var bd = document.getElementById('confirm-backdrop');
    if (!bd) return;
    var ok = o.status === 'success';
    var icon = document.getElementById('confirm-icon');
    icon.className = 'confirm-icon ' + (ok ? 'ok' : 'pending');
    icon.innerHTML = ok
      ? '<svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>'
      : '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>';
    document.getElementById('confirm-title').textContent = ok ? 'Transaction Successful' : 'Transaction Pending';
    document.getElementById('confirm-sub').textContent = ok ? '' : 'Transactions usually take 1-3 business days to be processed.';
    document.getElementById('confirm-amount').textContent = money(o.amount);
    var rows = [['From', o.from], ['To', o.to], ['Reference', o.reference], ['Date', o.date]];
    document.getElementById('confirm-details').innerHTML = rows.map(function (r) {
      return '<div class="row"><span>' + r[0] + '</span><strong>' + escapeHtml(r[1]) + '</strong></div>';
    }).join('');
    document.getElementById('confirm-done').onclick = function () { bd.classList.add('hidden'); };
    document.getElementById('confirm-x').onclick = function () { bd.classList.add('hidden'); };
    bd.classList.remove('hidden');
  }

  // Virtual card helpers — display-only cards, not real payment instruments.
  function genCardNumber() {
    var digits = '4';
    for (var i = 0; i < 14; i++) digits += Math.floor(Math.random() * 10);
    var sum = 0;
    for (var i = 0; i < digits.length; i++) {
      var d = Number(digits[i]);
      if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    return digits + String((10 - (sum % 10)) % 10);
  }

  function genCardExpiry() {
    var now = new Date();
    var mm = String(now.getMonth() + 1).padStart(2, '0');
    var yy = String((now.getFullYear() + 3) % 100).padStart(2, '0');
    return mm + '/' + yy;
  }

  function genCardCvv() {
    return String(Math.floor(100 + Math.random() * 900));
  }

  function maskCard(num) {
    return '\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ' + num.slice(-4);
  }

  function groupCard(num) {
    return num.replace(/(.{4})/g, '$1 ').trim();
  }

  function todayStr() {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function genAccountNumber() {
    var s = '';
    for (var i = 0; i < 10; i++) s += Math.floor(Math.random() * 10);
    return s.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3');
  }

  function downloadTxt(filename, text) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
  }

  function recordText(rec) {
    return [
      'ALORA BANK — NEW ACCOUNT RECORD',
      '================================',
      'Date:            ' + rec.openedAt,
      'Account holder:  ' + rec.fullName,
      'Email:           ' + rec.email,
      'Phone:           ' + rec.phone,
      'Date of birth:   ' + rec.dob,
      'Address:         ' + rec.address + ', ' + rec.city + ', ' + rec.state + ' ' + rec.zip,
      'Account type:    ' + rec.accountType,
      'Account number:  ' + rec.accountNumber,
      'Initial deposit: ' + money(rec.initialDeposit),
      '================================',
      'Record generated at account opening.'
    ].join('\n');
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Human-readable destination for a money request's details field.
  // Encoded forms: "BANK::<bank>::<acct>::<routing>", "ALORA::<email|acct>::<routing?>".
  function formatDest(details) {
    if (!details) return '—';
    var p = String(details).split('::');
    if (p[0] === 'BANK' && p.length >= 4) return '→ ' + p[1] + ' ····' + String(p[2]).slice(-4);
    if (p[0] === 'ALORA' && p.length >= 2) {
      var id = p[1] || '';
      return id.indexOf('@') > -1 ? '→ Alora user ' + id : '→ Alora acct ····' + id.slice(-4);
    }
    return details;
  }

  // 9-digit routing number with a valid ABA checksum.
  function genRoutingNumber() {
    var d = [];
    for (var i = 0; i < 8; i++) d.push(Math.floor(Math.random() * 10));
    var sum = 3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5]);
    d.push((10 - (sum % 10)) % 10);
    return d.join('');
  }

  return {
    money: money,
    genReference: genReference,
    showReceipt: showReceipt,
    genCardNumber: genCardNumber,
    genCardExpiry: genCardExpiry,
    genCardCvv: genCardCvv,
    maskCard: maskCard,
    groupCard: groupCard,
    todayStr: todayStr,
    genAccountNumber: genAccountNumber,
    genRoutingNumber: genRoutingNumber,
    downloadTxt: downloadTxt,
    recordText: recordText,
    escapeHtml: escapeHtml,
    formatDest: formatDest,
    // Fallback routing number (older accounts predate per-account numbers).
    ROUTING_NUMBER: '026073008',
    // Bitcoin deposit address shown on the investment deposit popup.
    BTC_ADDRESS: 'bc1q0zmw6cqszjv2elnj8m4eex879qlvku48qpmfnj'
  };
})();
