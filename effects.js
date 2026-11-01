/* Two small effects: a soft "mint tick" when you hover a link, and sections that fade in as you scroll. */
(function () {
  /* ---------- scroll reveal ---------- */
  if (window.__revealGuard) clearTimeout(window.__revealGuard);
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- candy clink ---------- */
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  var ctx = null, enabled = true, lastPlay = 0;
  try { enabled = localStorage.getItem("candySound") !== "off"; } catch (e) {}

  function getCtx() {
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // Mint tick: a tiny, dry tick, like a fingernail on a candy tin.
  var master = null;
  function getMaster(c) {
    if (master) return master;
    var lp = c.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 7000; lp.Q.value = 0.5;
    var g = c.createGain(); g.gain.value = 0.8;
    lp.connect(g); g.connect(c.destination);
    master = lp;
    return master;
  }

  function tick(c, when) {
    var out = getMaster(c);
    var n = Math.floor(c.sampleRate * 0.01), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    var src = c.createBufferSource(), hp = c.createBiquadFilter(), ng = c.createGain();
    src.buffer = buf; hp.type = "highpass"; hp.frequency.value = 3000; hp.Q.value = 0.8;
    ng.gain.value = 0.35;
    src.connect(hp); hp.connect(ng); ng.connect(out);
    src.start(when);

    var o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.value = 1700 + Math.random() * 200;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(0.08, when + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.02);
    o.connect(g); g.connect(out);
    o.start(when); o.stop(when + 0.05);
  }

  function clink() {
    if (!enabled) return;
    var now = performance.now();
    if (now - lastPlay < 90) return;
    lastPlay = now;
    var c = getCtx();
    if (c.state !== "running") return;           // browsers keep audio locked until the first click or key press
    tick(c, c.currentTime + 0.005);
  }

  // Browsers only allow sound after one click, tap or key press on the page. Hovering alone can't start audio.
  var btn = document.getElementById("sound-toggle");
  var unlocked = false;

  function paint() {
    if (!btn) return;
    if (!enabled) btn.textContent = "candy sound: off";
    else if (!unlocked) btn.textContent = "candy sound: click anywhere once";
    else btn.textContent = "candy sound: on";
    btn.setAttribute("aria-pressed", enabled ? "true" : "false");
  }

  function unlock() {
    if (unlocked) return;
    var c = getCtx();
    if (c.state === "running") { unlocked = true; paint(); return; }
    c.resume().then(function () { unlocked = true; paint(); });
  }
  ["pointerdown", "keydown", "touchend"].forEach(function (ev) {
    window.addEventListener(ev, unlock, { capture: true });
  });

  document.addEventListener("pointerenter", function (e) {
    if (e.pointerType === "touch") return;
    var a = e.target.closest ? e.target.closest("a") : null;
    if (a) clink();
  }, true);
  document.addEventListener("focusin", function (e) {
    if (e.target.matches && e.target.matches("a:focus-visible")) clink();
  });

  if (btn) {
    btn.addEventListener("click", function () {
      enabled = !enabled;
      try { localStorage.setItem("candySound", enabled ? "on" : "off"); } catch (e) {}
      paint();
      if (enabled) { getCtx(); setTimeout(clink, 30); }
    });
    paint();
  }
})();
