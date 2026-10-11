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

  return {
    money: money,
    todayStr: todayStr,
    genAccountNumber: genAccountNumber,
    downloadTxt: downloadTxt,
    recordText: recordText,
    escapeHtml: escapeHtml
  };
})();
