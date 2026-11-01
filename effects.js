/* Two small effects: a candy "clink" when you hover a link, and sections that fade in as you scroll. */
(function () {
  /* ---------- scroll reveal ---------- */
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

  // One hard-candy hit: a bright glassy ping (a few inharmonic partials) plus a tiny noise tick.
  function hit(c, when, base, volume) {
    var partials = [[1, 1.0, 0.16], [2.76, 0.55, 0.09], [5.4, 0.3, 0.05]];
    partials.forEach(function (p) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = "sine";
      o.frequency.value = base * p[0];
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(volume * p[1], when + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, when + p[2] + 0.05);
      o.connect(g); g.connect(c.destination);
      o.start(when); o.stop(when + p[2] + 0.08);
    });
    var len = Math.floor(c.sampleRate * 0.012), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var n = c.createBufferSource(), hp = c.createBiquadFilter(), ng = c.createGain();
    n.buffer = buf; hp.type = "highpass"; hp.frequency.value = 4500;
    ng.gain.value = volume * 0.7;
    n.connect(hp); hp.connect(ng); ng.connect(c.destination);
    n.start(when);
  }

  function clink() {
    if (!enabled) return;
    var now = performance.now();
    if (now - lastPlay < 90) return;
    lastPlay = now;
    var c = getCtx();
    if (c.state !== "running") return;           // browsers keep audio locked until the first click or key press
    var t = c.currentTime, base = 1500 + Math.random() * 500;
    hit(c, t, base, 0.5);
    hit(c, t + 0.05, base * 1.26, 0.38);          // the second candy
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
