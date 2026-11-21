/* Core: FSRS-4.5 scheduler + speech comparison helpers. No dependencies. */
(function (root) {
  'use strict';
  var W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
  var DECAY = -0.5, FACTOR = 19 / 81, DAY = 864e5, RETENTION = 0.9, MAX_DAYS = 365;
  var clamp = function (x, a, b) { return Math.min(b, Math.max(a, x)); };
  var d0 = function (g) { return clamp(W[4] - (g - 3) * W[5], 1, 10); };
  var retr = function (t, s) { return Math.pow(1 + FACTOR * t / s, DECAY); };
  function interval(s) {
    var i = s / FACTOR * (Math.pow(RETENTION, 1 / DECAY) - 1);
    return clamp(Math.round(i), 1, MAX_DAYS);
  }

  /* st: null (new) or {s, d, last, due, reps, lapses}; g: 1 Again, 2 Hard, 3 Good, 4 Easy */
  function review(st, g, now) {
    var s, d, lapses = 0, reps = 1;
    if (!st) {
      s = W[g - 1]; d = d0(g);
    } else {
      var t = Math.max(0, (now - st.last) / DAY), r = retr(t, st.s);
      d = clamp(W[7] * d0(3) + (1 - W[7]) * (st.d - W[6] * (g - 3)), 1, 10);
      if (g === 1) {
        s = Math.min(st.s, W[11] * Math.pow(d, -W[12]) * (Math.pow(st.s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]));
      } else {
        s = st.s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(st.s, -W[9]) * (Math.exp((1 - r) * W[10]) - 1) *
          (g === 2 ? W[15] : 1) * (g === 4 ? W[16] : 1));
      }
      lapses = st.lapses + (g === 1 ? 1 : 0); reps = st.reps + 1;
    }
    s = Math.max(0.1, s);
    var due = g === 1 ? now + 10 * 60000 : now + interval(s) * DAY;
    return { s: s, d: d, last: now, due: due, reps: reps, lapses: lapses };
  }

  /* ---- speech comparison ---- */
  var NUM = { one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10', thirty: '30' };
  var CONTR = [[/\bi am\b/g, "i'm"], [/\bdo not\b/g, "don't"], [/\bdoes not\b/g, "doesn't"], [/\bcan not\b/g, "can't"], [/\bcannot\b/g, "can't"],
    [/\bit is\b/g, "it's"], [/\bthat is\b/g, "that's"], [/\bi will\b/g, "i'll"], [/\blet us\b/g, "let's"], [/\bwe are\b/g, "we're"],
    [/\bwe will\b/g, "we'll"], [/\byou are\b/g, "you're"], [/\bi have\b/g, "i've"], [/\bwe have\b/g, "we've"], [/\bhere is\b/g, "here's"],
    [/\bwould not\b/g, "wouldn't"], [/\bwho is\b/g, "who's"]];
  function normTok(w) {
    w = w.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']/g, '');
    return NUM[w] || w;
  }
  function saidWords(s) {
    var x = s.toLowerCase().replace(/[’‘]/g, "'");
    CONTR.forEach(function (c) { x = x.replace(c[0], c[1]); });
    return x.split(/\s+/).map(normTok).filter(Boolean);
  }
  function compare(target, said) {
    var tokens = target.split(/\s+/).filter(Boolean);
    var tw = tokens.map(normTok), sw = saidWords(said), m = tw.length, n = sw.length;
    var dp = [], i, j;
    for (i = 0; i <= m; i++) { dp.push(new Array(n + 1).fill(0)); }
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++)
      dp[i][j] = tw[i - 1] === sw[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    var marks = new Array(m).fill(false);
    i = m; j = n;
    while (i > 0 && j > 0) {
      if (tw[i - 1] === sw[j - 1]) { marks[i - 1] = true; i--; j--; }
      else if (dp[i - 1][j] >= dp[i][j - 1]) i--; else j--;
    }
    var hit = marks.filter(Boolean).length;
    return { tokens: tokens, marks: marks, acc: m ? hit / m : 0 };
  }

  var api = { review: review, interval: interval, compare: compare, retrievability: retr };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SRS = api;
})(typeof window !== 'undefined' ? window : this);
