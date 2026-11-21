(function () {
  'use strict';
  var $ = function (s, e) { return (e || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var DAY = 864e5, KEY = 'fluent.v1';
  var EASY_MS = 2500, GOOD_MS = 5000; // reaction-time thresholds for auto grading
  var PROMPT = 'ช่วยสร้าง content pack สำหรับฝึกพูดภาษาอังกฤษของคนทำงานสาย IT ชาวไทยระดับกลาง\n' +
    'หัวข้อ: <ใส่หัวข้อ เช่น Code Review / Client Call / Interview>\n' +
    'เงื่อนไข: 12 รายการ, เป็นประโยคหรือวลีที่คนใช้จริงในที่ทำงาน (4-14 คำ), ธรรมชาติ ไม่เป็นทางการเกินไป, ' +
    'ใช้ contraction (I\'m, we\'ll), เขียนตัวเลขเป็นตัวหนังสือ, มีคำแปลภาษาไทยที่ฟังเป็นธรรมชาติ\n' +
    'ตอบเป็น JSON อย่างเดียว รูปแบบ:\n' +
    '{"pack":"code-review","title":"Code Review","items":[{"text":"English sentence.","th":"คำแปลไทย"}]}';

  /* ---------- storage ---------- */
  function defaults() {
    return { custom: [], states: {}, logs: [], daily: { date: '', newDone: 0 }, streak: { last: '', count: 0 },
      settings: { newPerDay: 5, minutes: 15, rate: 1, voice: '', mic: true, packsOff: [] } };
  }
  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY));
      if (d) { var f = defaults(); return Object.assign(f, d, { settings: Object.assign(f.settings, d.settings) }); }
    } catch (e) {}
    return defaults();
  }
  var db = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
  function ymd(t) {
    var d = new Date(t === undefined ? Date.now() : t);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  var allItems = function () { return window.CONTENT.concat(db.custom); };
  var activeItems = function () { return allItems().filter(function (i) { return db.settings.packsOff.indexOf(i.pack) < 0; }); };
  var byId = function (id) { return allItems().filter(function (i) { return i.id === id; })[0]; };

  /* ---------- planner ---------- */
  function plan() {
    if (db.daily.date !== ymd()) { db.daily = { date: ymd(), newDone: 0 }; save(); }
    var eod = new Date(); eod.setHours(23, 59, 59, 999);
    var act = activeItems(), st = db.states;
    var due = act.filter(function (i) { return st[i.id] && st[i.id].due <= eod.getTime(); })
      .sort(function (a, b) { return st[a.id].due - st[b.id].due; });
    var maxRev = Math.max(1, Math.floor(db.settings.minutes * 60 / 25));
    var reviews = due.slice(0, maxRev), backlog = due.length > maxRev * 2;
    var fresh = act.filter(function (i) { return !st[i.id]; });
    var n = backlog ? 0 : Math.max(0, db.settings.newPerDay - db.daily.newDone);
    var news = fresh.slice(0, n);
    return { reviews: reviews, news: news, dueTotal: due.length, backlog: backlog, freshLeft: fresh.length,
      est: Math.max(1, Math.round((reviews.length * 25 + news.length * 60) / 60)) };
  }
  function markStreak() {
    var s = db.streak, t = ymd();
    if (s.last === t) return;
    s.count = s.last === ymd(Date.now() - DAY) ? s.count + 1 : 1; s.last = t;
  }

  /* ---------- speech ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var canRec = !!(navigator.mediaDevices && window.MediaRecorder);
  var micOn = function () { return db.settings.mic && !!SR; };
  function voices() { return ('speechSynthesis' in window) ? speechSynthesis.getVoices().filter(function (v) { return /^en/i.test(v.lang); }) : []; }
  function speak(text, rate, onend) {
    if (!('speechSynthesis' in window)) return toast('เบราว์เซอร์นี้ไม่รองรับเสียงพูด');
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = rate || db.settings.rate;
    var vs = voices(), v = vs.filter(function (x) { return x.name === db.settings.voice; })[0] || vs.filter(function (x) { return x.lang === 'en-US'; })[0] || vs[0];
    if (v) u.voice = v;
    if (onend) u.onend = onend;
    speechSynthesis.speak(u);
  }
  function listen(o) {
    var r = new SR(); S.r = r; r.lang = 'en-US'; r.interimResults = true; r.continuous = false;
    r.onspeechstart = function () { o.onStart && o.onStart(); };
    r.onresult = function (ev) {
      var t = ''; for (var i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript + ' ';
      o.onStart && o.onStart(); o.onText(t.trim());
    };
    r.onerror = function (ev) { o.onErr && o.onErr(ev.error); };
    r.onend = function () { if (S && S.r === r) S.r = null; o.onEnd && o.onEnd(); };
    try { r.start(); } catch (e) { o.onErr && o.onErr('start'); }
  }
  var mr = null, mchunks = [], mstream = null;
  function stopAll() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (S && S.r) { var r = S.r; S.r = null; try { r.abort(); } catch (e) {} }
    if (mr && mr.state === 'recording') { try { mr.stop(); } catch (e) {} }
  }

  /* ---------- ui helpers ---------- */
  var S = null, tab = 'home', A = {};
  function view(h) { $('#view').innerHTML = h; window.scrollTo(0, 0); }
  function setFb(h) { var e = $('#fb'); if (e) e.innerHTML = h; }
  function toast(m) { var t = $('#toast'); t.textContent = m; t.className = 'show'; clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = ''; }, 2200); }
  function markHtml(c) { return c.tokens.map(function (w, i) { return '<span class="' + (c.marks[i] ? 'ok' : 'miss') + '">' + esc(w) + '</span>'; }).join(' '); }
  function prog() { return '<div class="prog"><i style="width:' + Math.round(100 * S.done / Math.max(1, S.total)) + '%"></i></div>'; }
  function status(id) {
    var s = db.states[id];
    if (!s) return 'ใหม่';
    if (s.due <= Date.now()) return 'ถึงกำหนด';
    return s.s >= 21 ? 'คล่องแล้ว ✓' : 'กำลังจำ';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-act]'); if (!b) return;
    var f = A[b.dataset.act]; if (f) f(b.dataset, b);
  });

  /* ---------- tabs ---------- */
  function render() {
    stopAll();
    ({ home: rHome, lib: rLib, stats: rStats, set: rSet })[tab]();
    Array.prototype.forEach.call(document.querySelectorAll('#nav button'), function (b) { b.className = b.dataset.v === tab ? 'on' : ''; });
  }
  A.tab = function (d) { tab = d.v; S = null; render(); };

  /* ---------- home ---------- */
  function rHome() {
    var p = plan(), s = db.streak, live = s.last === ymd() || s.last === ymd(Date.now() - DAY) ? s.count : 0;
    var todo = p.reviews.length + p.news.length;
    view('<h1>วันนี้ฝึกอะไรดี</h1><div class="card">' +
      (todo ? '<div class="grid3"><div><b>' + p.reviews.length + '</b><span>ทบทวน</span></div><div><b>' + p.news.length + '</b><span>ของใหม่</span></div><div><b>~' + p.est + '</b><span>นาที</span></div></div>' +
        (p.backlog ? '<p class="hint">มีของค้าง ' + p.dueTotal + ' รายการ วันนี้พักของใหม่ก่อน เคลียร์ของเก่าให้หมดจะจำได้แม่นกว่า</p>' : '') +
        '<button class="btn primary big" data-act="start">▶ เริ่มเลย</button>'
        : '<p class="cue">🎉 วันนี้ครบแล้ว</p><p class="hint">' + (p.freshLeft ? 'อยากฝึกเพิ่มก็ได้ ไม่บังคับ' : 'ไม่มีของใหม่เหลือ ลองนำเข้า pack ใหม่ที่ตั้งค่า') + '</p>' +
        (p.freshLeft ? '<button class="btn big" data-act="more">+ เพิ่มของใหม่อีก 3 รายการ</button>' : '')) + '</div>' +
      '<div class="card"><b>🔥 ' + live + ' วันติดกัน</b><p class="hint">ฝึกวันละ 10-15 นาทีสม่ำเสมอ ดีกว่าฝึกนานๆ ครั้ง พูดผิดไม่เป็นไร ผิดคือข้อมูลให้ระบบจัดตารางทบทวน</p>' +
      '<label>โหมดเงียบ (ไม่ใช้ไมค์ เหมาะตอนอยู่ที่สาธารณะ)<input type="checkbox" data-set="silent" ' + (db.settings.mic ? '' : 'checked') + '></label>' +
      (SR ? '' : '<p class="hint">เบราว์เซอร์นี้ไม่รองรับการฟังเสียง จะใช้โหมดประเมินตัวเอง (แนะนำ Chrome/Edge)</p>') + '</div>');
  }
  A.more = function () { db.daily.newDone -= 3; save(); rHome(); };
  A.start = function () {
    var p = plan();
    S = { q: p.reviews.map(function (i) { return { k: 'r', id: i.id }; }).concat(p.news.map(function (i) { return { k: 'l', id: i.id }; })), done: 0, lat: [], r: null };
    S.total = S.q.length;
    if (!S.total) return toast('ยังไม่มีอะไรต้องฝึก');
    next();
  };
  function next() {
    stopAll();
    if (!S.q.length) return rDone();
    var t = S.q.shift(); S.cur = t; S.learnNew = false;
    ({ r: rReview, l: rLearn, x: rRelearn })[t.k](byId(t.id));
  }

  /* ---------- review (recall) ---------- */
  function rReview(it, fromLearn) {
    S.t0 = performance.now(); S.lat = null; S.said = ''; S.revealed = false; S.learnNew = !!fromLearn;
    view(prog() + '<div class="card"><div class="tag">' + (fromLearn ? 'ทดสอบของใหม่' : 'ทบทวน') + ' · ' + esc(it.packTitle) + '</div>' +
      '<p class="cue">' + esc(it.th) + '</p><p class="hint">พูดเป็นภาษาอังกฤษให้เร็วที่สุดเท่าที่ทำได้</p><div id="fb" class="fb"></div><div id="ans"></div></div>' +
      '<div class="row" id="ctl">' + (micOn() ? '<button class="btn" data-act="mic">🎤 พูด</button>' : '') + '<button class="btn primary" data-act="reveal">ดูเฉลย</button></div>');
    if (micOn()) A.mic();
  }
  A.mic = function () {
    if (!S || S.revealed) return;
    if (S.r) { try { S.r.abort(); } catch (e) {} S.r = null; }
    S.said = '';
    listen({
      onStart: function () { if (S.lat == null) S.lat = performance.now() - S.t0; },
      onText: function (t) { S.said = t; setFb('“' + esc(t) + '”'); },
      onErr: function (er) { setFb(er === 'not-allowed' ? 'ไม่ได้รับสิทธิ์ใช้ไมค์ กด “ดูเฉลย” แล้วประเมินตัวเองได้' : ''); },
      onEnd: function () { if (S.revealed) return; if (S.said) A.reveal(); else setFb('ไม่ได้ยินเสียง กด 🎤 ลองใหม่ หรือ “ดูเฉลย”'); }
    });
    setFb('🎤 กำลังฟัง…');
  };
  function suggest(acc, lat) {
    if (acc == null) return 0;
    if (acc < 0.6) return 1; if (acc < 0.85) return 2;
    if (lat == null) return 3;
    return lat <= EASY_MS ? 4 : lat <= GOOD_MS ? 3 : 2;
  }
  A.reveal = function () {
    if (!S || S.revealed) return; S.revealed = true;
    if (S.r) { var r = S.r; S.r = null; try { r.abort(); } catch (e) {} }
    var it = byId(S.cur.id), acc = null, h;
    if (S.said) { var c = SRS.compare(it.text, S.said); acc = c.acc; h = '<p class="en">' + markHtml(c) + '</p>'; }
    else h = '<p class="en">' + esc(it.text) + '</p>';
    var sug = suggest(acc, S.lat), info = [];
    if (S.lat != null) info.push('เริ่มพูดใน ' + (S.lat / 1000).toFixed(1) + ' วิ');
    if (acc != null) info.push('ตรง ' + Math.round(acc * 100) + '%');
    S.acc = acc;
    var lbl = [['ลืม', 1], ['ยาก', 2], ['ได้', 3], ['คล่อง', 4]];
    $('#ans').innerHTML = h + '<p class="hint">' + (info.join(' · ') || 'ประเมินตัวเองตามความรู้สึก') + '</p>' +
      '<div class="row"><button class="btn" data-act="play" data-r="1">🔊 ฟัง</button><button class="btn" data-act="play" data-r="0.7">🐢 ช้า</button></div>' +
      '<div class="grades">' + lbl.map(function (x) { return '<button class="btn ' + (sug === x[1] ? 'sug' : '') + '" data-act="grade" data-g="' + x[1] + '">' + x[0] + '</button>'; }).join('') + '</div>';
    var ctl = $('#ctl'); if (ctl) ctl.style.display = 'none';
    setFb(''); speak(it.text, 1);
  };
  A.grade = function (d) {
    var g = +d.g, id = S.cur.id, st = db.states[id] || null;
    if (!st) db.daily.newDone++;
    db.states[id] = SRS.review(st, g, Date.now());
    db.logs.push({ t: Date.now(), id: id, g: g, lat: S.lat, acc: S.acc });
    if (db.logs.length > 2000) db.logs = db.logs.slice(-2000);
    markStreak(); save(); S.done++;
    if (g === 1) S.q.push({ k: 'x', id: id });
    next();
  };
  A.play = function (d) {
    var it = byId(S.cur.id); if (!it) return;
    if (d.o) toast('สวมหูฟัง แล้วพูดตามให้ทันพร้อมกัน');
    speak(it.text, +d.r);
  };

  /* ---------- learn new (shadowing) ---------- */
  function rLearn() { S.ph = 0; drawLearn(); }
  function drawLearn() {
    var it = byId(S.cur.id), ph = S.ph;
    var titles = ['① ฟังและอ่านให้เข้าใจ', '② พูดตามโดยดูข้อความ', '③ พูดตามโดยไม่ดูข้อความ (แตะข้อความเพื่อเปิด)'];
    view(prog() + '<div class="card"><div class="tag">ของใหม่ · ' + esc(it.packTitle) + '</div><div class="tag">' + titles[ph] + '</div>' +
      '<p class="en ' + (ph === 2 ? 'blur' : '') + '" data-act="unblur">' + esc(it.text) + '</p><p class="th">' + esc(it.th) + '</p>' +
      '<div id="fb" class="fb"></div><audio id="mine" controls hidden></audio></div>' +
      '<div class="row wrap"><button class="btn" data-act="play" data-r="1">🔊 ปกติ</button><button class="btn" data-act="play" data-r="0.7">🐢 ช้า</button>' +
      '<button class="btn" data-act="play" data-r="' + db.settings.rate + '" data-o="1">🎧 พูดพร้อมกัน</button></div>' +
      '<div class="row wrap">' + (micOn() ? '<button class="btn" data-act="say">🎤 พูดแล้วตรวจ</button>' : '') +
      (canRec && db.settings.mic ? '<button class="btn" id="recbtn" data-act="rec">🎙 อัดเทียบเสียง</button>' : '') + '</div>' +
      '<button class="btn primary big" data-act="nextph">' + (ph < 2 ? 'ต่อไป →' : 'ทดสอบจากความหมาย →') + '</button>');
    if (ph === 0) speak(it.text, 1);
  }
  A.unblur = function (d, b) { b.classList.remove('blur'); };
  A.nextph = function () {
    stopAll();
    if (S.ph < 2) { S.ph++; drawLearn(); } else rReview(byId(S.cur.id), true);
  };
  A.say = function () {
    var it = byId(S.cur.id); stopAll(); S.said = '';
    setFb('🎤 กำลังฟัง…');
    listen({
      onText: function (t) { S.said = t; setFb('“' + esc(t) + '”'); },
      onErr: function () { setFb('ใช้ไมค์ไม่ได้ ลองอนุญาตสิทธิ์ไมค์ หรือใช้ 🎙 อัดเทียบเสียงแทน'); },
      onEnd: function () {
        if (!S.said) return setFb('ไม่ได้ยินเสียง ลองใหม่อีกครั้ง');
        var c = SRS.compare(it.text, S.said);
        setFb('<p class="en">' + markHtml(c) + '</p><p class="hint">ตรง ' + Math.round(c.acc * 100) + '% · สีแดง = คำที่หลุดหรือไม่ตรง</p>');
      }
    });
  };
  A.rec = function () {
    var b = $('#recbtn');
    if (mr && mr.state === 'recording') { mr.stop(); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      mstream = stream; mchunks = []; mr = new MediaRecorder(stream);
      mr.ondataavailable = function (e) { mchunks.push(e.data); };
      mr.onstop = function () {
        mstream.getTracks().forEach(function (t) { t.stop(); });
        var a = $('#mine'); if (!a) return;
        a.src = URL.createObjectURL(new Blob(mchunks, { type: mr.mimeType })); a.hidden = false;
        var bb = $('#recbtn'); if (bb) bb.textContent = '🎙 อัดใหม่';
        setFb('ฟังเสียงตัวเองด้านล่าง แล้วกด 🔊 เทียบกับต้นฉบับ');
      };
      mr.start(); if (b) b.textContent = '⏹ หยุดอัด';
    }).catch(function () { toast('เปิดไมค์ไม่ได้'); });
  };

  /* ---------- relearn (after Again) ---------- */
  function rRelearn(it) {
    view(prog() + '<div class="card"><div class="tag">ฝึกซ้ำ · ' + esc(it.packTitle) + '</div><p class="en">' + esc(it.text) + '</p><p class="th">' + esc(it.th) + '</p>' +
      '<p class="hint">ฟังแล้วพูดตามสองรอบ แล้วไปต่อ (ระบบจะนำกลับมาทบทวนเร็วๆ นี้)</p><div id="fb" class="fb"></div><audio id="mine" controls hidden></audio></div>' +
      '<div class="row"><button class="btn" data-act="play" data-r="1">🔊 ปกติ</button><button class="btn" data-act="play" data-r="0.7">🐢 ช้า</button></div>' +
      '<div class="row">' + (micOn() ? '<button class="btn" data-act="say">🎤 พูดแล้วตรวจ</button>' : '') + (canRec && db.settings.mic ? '<button class="btn" id="recbtn" data-act="rec">🎙 อัดเทียบ</button>' : '') + '</div>' +
      '<button class="btn primary big" data-act="nextx">ต่อไป →</button>');
    speak(it.text, 0.85);
  }
  A.nextx = function () { next(); };

  /* ---------- done ---------- */
  function rDone() {
    var ls = db.logs.slice(-S.total * 2).filter(function (l) { return l.lat != null; });
    var avg = ls.length ? (ls.reduce(function (a, l) { return a + l.lat; }, 0) / ls.length / 1000).toFixed(1) : null;
    view('<div class="card"><p class="cue">🎉 จบเซสชันวันนี้</p><p>ฝึกไป ' + S.done + ' รายการ' + (avg ? ' · เวลาตอบสนองเฉลี่ย ' + avg + ' วิ' : '') + '</p>' +
      '<p class="hint">ลองเอาประโยคที่ชอบ 1 ประโยค ไปใช้จริงใน stand-up หรือแชตวันนี้ การใช้จริงทำให้ฝังลึกกว่าเดิมมาก</p>' +
      '<button class="btn primary big" data-act="tab" data-v="home">กลับหน้าแรก</button></div>');
    S = null;
  }

  /* ---------- library ---------- */
  function rLib() {
    var h = '<h1>คลังวลี</h1>', packs = {};
    allItems().forEach(function (i) { (packs[i.pack] = packs[i.pack] || { t: i.packTitle, items: [] }).items.push(i); });
    Object.keys(packs).forEach(function (k) {
      var p = packs[k], learned = p.items.filter(function (i) { return db.states[i.id]; }).length;
      h += '<div class="card"><details><summary>' + esc(p.t) + ' <span class="badge">' + learned + '/' + p.items.length + '</span></summary>' +
        p.items.map(function (i) {
          return '<div class="item"><button class="btn" data-act="say1" data-id="' + esc(i.id) + '">🔊</button><div class="t">' + esc(i.text) + '<div class="hint">' + esc(i.th) + '</div></div><span class="badge">' + status(i.id) + '</span></div>';
        }).join('') + '</details></div>';
    });
    view(h);
  }
  A.say1 = function (d) { var it = byId(d.id); if (it) speak(it.text, 1); };

  /* ---------- stats ---------- */
  function rStats() {
    var learning = 0, fluent = 0;
    allItems().forEach(function (i) { var s = db.states[i.id]; if (!s) return; if (s.s >= 21) fluent++; else learning++; });
    var avg = function (a) { return a.length ? Math.round(a.reduce(function (x, y) { return x + y; }, 0) / a.length / 100) / 10 : null; };
    var lat = db.logs.filter(function (l) { return l.lat != null; }).map(function (l) { return l.lat; });
    var recent = avg(lat.slice(-30)), prev = avg(lat.slice(-60, -30));
    var days = [], mx = 1, k;
    for (k = 13; k >= 0; k--) {
      var d = ymd(Date.now() - k * DAY), n = db.logs.filter(function (l) { return ymd(l.t) === d; }).length;
      days.push(n); mx = Math.max(mx, n);
    }
    view('<h1>ความคืบหน้า</h1><div class="card"><div class="grid3"><div><b>' + fluent + '</b><span>คล่องแล้ว</span></div><div><b>' + learning + '</b><span>กำลังจำ</span></div><div><b>' + db.logs.length + '</b><span>ครั้งที่ฝึก</span></div></div>' +
      '<p class="hint">“คล่องแล้ว” = ระบบประเมินว่าจะจำได้นานกว่า 3 สัปดาห์ จะแสดงห่างๆ</p></div>' +
      '<div class="card"><b>เวลาตอบสนองเฉลี่ย (ยิ่งน้อยยิ่งคล่อง)</b><p class="cue">' + (recent == null ? '–' : recent + ' วิ') + '</p>' +
      '<p class="hint">' + (recent != null && prev != null ? 'เทียบกับ 30 ครั้งก่อนหน้า: ' + prev + ' วิ' : 'ต้องใช้ไมค์ตรวจเสียงเพื่อวัดค่านี้ ยิ่งฝึกยิ่งแม่น') + '</p></div>' +
      '<div class="card"><b>ฝึกต่อวัน (14 วันล่าสุด)</b><div class="bars">' + days.map(function (n) { return '<i style="height:' + Math.round(100 * n / mx) + '%" title="' + n + '"></i>'; }).join('') + '</div></div>');
  }

  /* ---------- settings ---------- */
  function rSet() {
    var vs = voices(), s = db.settings, packs = {};
    allItems().forEach(function (i) { packs[i.pack] = i.packTitle; });
    view('<h1>ตั้งค่า</h1><div class="card">' +
      '<label>ของใหม่ต่อวัน<input type="number" min="0" max="30" data-set="newPerDay" value="' + s.newPerDay + '"></label>' +
      '<label>เวลาต่อวัน (นาที)<input type="number" min="5" max="90" data-set="minutes" value="' + s.minutes + '"></label>' +
      '<label>ความเร็วเสียงปกติ<select data-set="rate">' + [0.8, 0.9, 1, 1.1, 1.2].map(function (r) { return '<option ' + (s.rate === r ? 'selected' : '') + '>' + r + '</option>'; }).join('') + '</select></label>' +
      '<label>เสียง<select data-set="voice"><option value="">อัตโนมัติ</option>' + vs.map(function (v) { return '<option ' + (s.voice === v.name ? 'selected' : '') + ' value="' + esc(v.name) + '">' + esc(v.name) + ' (' + v.lang + ')</option>'; }).join('') + '</select></label></div>' +
      '<div class="card"><b>เลือก pack ที่ฝึก</b>' + Object.keys(packs).map(function (k) {
        return '<label>' + esc(packs[k]) + '<input type="checkbox" data-set="pack" data-id="' + esc(k) + '" ' + (s.packsOff.indexOf(k) < 0 ? 'checked' : '') + '></label>';
      }).join('') + '</div>' +
      '<div class="card"><b>เพิ่มเนื้อหาจาก AI</b><p class="hint">คัดลอกพรอมต์ไปให้ AI (Claude/ChatGPT) สร้าง pack แล้ววาง JSON ที่ได้ด้านล่าง</p>' +
      '<button class="btn" data-act="copyprompt">📋 คัดลอกพรอมต์</button><textarea id="pk" placeholder=\'{"pack":"...","title":"...","items":[{"text":"...","th":"..."}]}\'></textarea>' +
      '<button class="btn primary big" data-act="importpack">นำเข้า pack</button></div>' +
      '<div class="card"><b>สำรองข้อมูล</b><p class="hint">ข้อมูลเก็บในเบราว์เซอร์เครื่องนี้ ควรส่งออกสำรองไว้เป็นระยะ และใช้นำย้ายไปอีกเครื่องได้</p>' +
      '<div class="row"><button class="btn" data-act="export">⬇ ส่งออก</button><button class="btn" data-act="pick">⬆ นำเข้า</button></div><input type="file" id="imp" accept="application/json" hidden>' +
      '<button class="btn big" data-act="reset" style="color:var(--bad)">ลบข้อมูลทั้งหมด</button></div>');
  }
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'imp' && t.files[0]) {
      var fr = new FileReader();
      fr.onload = function () { try { var d = JSON.parse(fr.result); if (!d.states) throw 0; var f = defaults(); db = Object.assign(f, d, { settings: Object.assign(f.settings, d.settings) }); save(); toast('นำเข้าสำเร็จ'); render(); } catch (x) { toast('ไฟล์ไม่ถูกต้อง'); } };
      fr.readAsText(t.files[0]); return;
    }
    var k = t.dataset && t.dataset.set; if (!k) return;
    var s = db.settings;
    if (k === 'silent') s.mic = !t.checked;
    else if (k === 'pack') s.packsOff = t.checked ? s.packsOff.filter(function (x) { return x !== t.dataset.id; }) : s.packsOff.concat(t.dataset.id);
    else if (k === 'newPerDay' || k === 'minutes') s[k] = Math.max(0, +t.value || 0);
    else if (k === 'rate') s.rate = +t.value;
    else if (k === 'voice') s.voice = t.value;
    save(); if (tab === 'home' && !S) rHome();
  });
  A.copyprompt = function () {
    if (navigator.clipboard) navigator.clipboard.writeText(PROMPT).then(function () { toast('คัดลอกแล้ว'); }, function () { toast('คัดลอกไม่ได้'); });
  };
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  A.importpack = function () {
    try {
      var d = JSON.parse($('#pk').value), pack = String(d.pack || 'custom').replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'custom';
      var title = String(d.title || pack), list = d.items || d, added = 0, have = {};
      allItems().forEach(function (i) { have[i.id] = 1; });
      list.forEach(function (x) {
        if (!x || typeof x.text !== 'string' || typeof x.th !== 'string') return;
        var id = pack + '-' + hash(x.text); if (have[id]) return;
        db.custom.push({ id: id, pack: pack, packTitle: title, type: x.text.split(' ').length > 9 ? 'clip' : 'chunk', text: x.text, th: x.th }); have[id] = 1; added++;
      });
      save(); toast('เพิ่ม ' + added + ' รายการ'); rSet();
    } catch (e) { toast('JSON ไม่ถูกต้อง'); }
  };
  A.export = function () {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(db)], { type: 'application/json' }));
    a.download = 'fluent-backup-' + ymd() + '.json'; a.click();
  };
  A.pick = function () { $('#imp').click(); };
  A.reset = function () { if (confirm('ลบข้อมูลฝึกและ pack ที่นำเข้าทั้งหมด?')) { db = defaults(); save(); render(); } };

  /* ---------- boot ---------- */
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = function () { if (tab === 'set' && !S) rSet(); };
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(function () {});
  render();
})();
