(() => {
  const S = [...document.querySelectorAll('.slide')], pr = document.getElementById('pr'), cnt = document.getElementById('cnt');
  let i = 0, tid, auto, at, AC, master, music = false, voice = false;
  function typeIt() {
    const el = document.getElementById('typed'), t = el.dataset.t; let k = 0;
    clearInterval(tid); el.textContent = '';
    tid = setInterval(() => { el.textContent = t.slice(0, ++k); if (k >= t.length) clearInterval(tid); }, 38);
  }
  function go(n) {
    if (n < 0 || n >= S.length || n === i) return;
    const o = S[i]; o.classList.remove('active'); o.classList.add('out');
    setTimeout(() => o.classList.remove('out'), 700);
    i = n; S[i].classList.add('active');
    pr.style.width = ((i + 1) / S.length * 100) + '%';
    cnt.textContent = (i + 1) + ' / ' + S.length;
    if (i === 0) typeIt();
    whoosh(); say(); sched(); if (i === S.length - 1) burst();
  }

  const on = (id, v) => document.getElementById(id).classList.toggle('on', v);
  function initAudio() {
    if (AC) return;
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = 0; master.connect(AC.destination);
    [220, 277.18, 329.63, 440].forEach((f, k) => {
      const o = AC.createOscillator(), g = AC.createGain(), l = AC.createOscillator(), lg = AC.createGain();
      o.type = 'sine'; o.frequency.value = f; g.gain.value = .05;
      l.frequency.value = .1 + k * .07; lg.gain.value = .03;
      l.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(master); o.start(); l.start();
    });
  }
  function setMusic(v) {
    music = v; initAudio(); AC.resume();
    master.gain.linearRampToValueAtTime(v ? 1 : 0, AC.currentTime + 1); on('bm', v);
  }
  function whoosh() {
    if (!AC || !music) return;
    const n = AC.sampleRate * .5, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
    for (let k = 0; k < n; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / n);
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = b; f.type = 'bandpass';
    f.frequency.setValueAtTime(400, AC.currentTime);
    f.frequency.exponentialRampToValueAtTime(3000, AC.currentTime + .4);
    g.gain.value = .15; s.connect(f); f.connect(g); g.connect(AC.destination); s.start();
  }
  function say() {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel(); if (!voice) return;
    const u = new SpeechSynthesisUtterance(S[i].dataset.say), vs = speechSynthesis.getVoices();
    const v = vs.find(v => v.lang.startsWith('kk')) || vs.find(v => v.lang.startsWith('ru'));
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'kk-KZ';
    u.rate = .95;
    u.onend = () => { if (auto && i < S.length - 1) setTimeout(next, 1200); };
    speechSynthesis.speak(u);
  }
  function sched() {
    clearTimeout(at);
    if (auto && !voice) at = setTimeout(() => i < S.length - 1 ? next() : go(0), 8000);
  }
  function setAuto(v) { auto = v; on('ba', v); sched(); if (v && voice) say(); }
  const tm = () => setMusic(!music), tv = () => { voice = !voice; on('bv', voice); say(); }, ta = () => setAuto(!auto);
  const tf = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  document.getElementById('bm').onclick = tm;
  document.getElementById('bv').onclick = tv;
  document.getElementById('ba').onclick = ta;
  document.getElementById('bf').onclick = tf;
  let C = [];
  function burst() {
    for (let k = 0; k < 140; k++) C.push({ x: w / 2, y: h * .6, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, r: Math.random() * 5 + 3, c: 'hsl(' + Math.random() * 360 + ',90%,60%)', l: 140 });
  }
  const next = () => go(i + 1), prev = () => go(i - 1);
  document.getElementById('nx').onclick = next;
  document.getElementById('pv').onclick = prev;
  addEventListener('keydown', e => {
    if (['ArrowRight', 'ArrowDown', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) prev();
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(S.length - 1);
    else if (e.key.toLowerCase() === 'p') ta();
    else if (e.key.toLowerCase() === 'm') tm();
    else if (e.key.toLowerCase() === 'v') tv();
    else if (e.key.toLowerCase() === 'f') tf();
  });
  let sx = 0;
  addEventListener('touchstart', e => sx = e.touches[0].clientX);
  addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) d < 0 ? next() : prev(); });
  let wl = 0;
  addEventListener('wheel', e => { if (Date.now() - wl < 900) return; wl = Date.now(); e.deltaY > 0 ? next() : prev(); });
  document.querySelectorAll('.card').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `perspective(700px) rotateY(${px * 14}deg) rotateX(${-py * 14}deg) scale(1.03)`;
    });
    c.addEventListener('pointerleave', () => c.style.transform = '');
  });
  const cv = document.getElementById('bg'), x = cv.getContext('2d'), m = { x: -999, y: -999 };
  let w, h, P = [];
  function rs() {
    w = cv.width = innerWidth; h = cv.height = innerHeight;
    P = Array.from({ length: Math.min(90, (w * h / 16000) | 0) }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .6, vy: (Math.random() - .5) * .6, r: Math.random() * 2 + 1 }));
  }
  addEventListener('resize', rs); rs();
  addEventListener('pointermove', e => { m.x = e.clientX; m.y = e.clientY; const r = document.documentElement.style; r.setProperty('--mx', e.clientX / w - .5); r.setProperty('--my', e.clientY / h - .5); });
  (function d() {
    x.clearRect(0, 0, w, h);
    for (const p of P) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      const dx = p.x - m.x, dy = p.y - m.y, ds = Math.hypot(dx, dy);
      if (ds < 120 && ds > 0) { p.x += dx / ds * 2; p.y += dy / ds * 2; }
      x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill();
    }
    for (let a = 0; a < P.length; a++) for (let b = a + 1; b < P.length; b++) {
      const q = Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y);
      if (q < 110) { x.strokeStyle = 'rgba(255,255,255,' + (.25 - q / 110 * .25) + ')'; x.beginPath(); x.moveTo(P[a].x, P[a].y); x.lineTo(P[b].x, P[b].y); x.stroke(); }
    }
    for (const c of C) { c.vy += .25; c.x += c.vx; c.y += c.vy; c.l--; x.fillStyle = c.c; x.fillRect(c.x, c.y, c.r, c.r * .6); }
    C = C.filter(c => c.l > 0);
    requestAnimationFrame(d);
  })();
  typeIt();
})();
