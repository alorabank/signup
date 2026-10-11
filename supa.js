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
