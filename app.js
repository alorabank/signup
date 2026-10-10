/* Alora Bank — shared client logic. All data stays in this browser. */
(function () {
  'use strict';

  var DB_KEY = 'alora_bank_db_v1';
  var SESSION_KEY = 'alora_bank_session_v1';

  function loadDb() {
    try {
      var raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { users: {} };
  }

  function saveDb(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function getSession() {
    return localStorage.getItem(SESSION_KEY);
  }

  function setSession(email) {
    if (email) localStorage.setItem(SESSION_KEY, email);
    else localStorage.removeItem(SESSION_KEY);
  }

  function money(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function todayStr() {
    var d = new Date();
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function genAccountNumber() {
    var s = '';
    for (var i = 0; i < 10; i++) s += Math.floor(Math.random() * 10);
    return s.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3');
  }

  function nowIso() {
    return new Date().toISOString();
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
    var lines = [
      'ALORA BANK — NEW ACCOUNT RECORD',
      '================================',
      'Date:            ' + rec.openedAt,
      'Account holder:  ' + rec.fullName,
      'Email:           ' + rec.email,
      'Phone:           ' + rec.phone,
      'Date of birth:   ' + rec.dob,
      'SSN:             ' + rec.ssn,
      'Address:         ' + rec.address + ', ' + rec.city + ' ' + rec.zip,
      'Account type:    ' + rec.accountType,
      'Account number:  ' + rec.accountNumber,
      'Initial deposit: ' + money(rec.initialDeposit),
      '================================',
      'Record generated at account opening.'
    ];
    return lines.join('\n');
  }

  function seedAdmin() {
    var db = loadDb();
    if (!db.users['admin@alorabank.com']) {
      db.users['admin@alorabank.com'] = {
        fullName: 'Administrator',
        email: 'admin@alorabank.com',
        password: 'admin123',
        isAdmin: true,
        phone: '', dob: '', ssn: '', address: '', city: '', zip: '',
        accounts: []
      };
      saveDb(db);
    }
  }

  seedAdmin();

  window.Alora = {
    loadDb: loadDb,
    saveDb: saveDb,
    getSession: getSession,
    setSession: setSession,
    money: money,
    todayStr: todayStr,
    genAccountNumber: genAccountNumber,
    nowIso: nowIso,
    downloadTxt: downloadTxt,
    recordText: recordText
  };
})();
