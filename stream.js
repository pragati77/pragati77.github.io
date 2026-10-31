/* A tray of candies sliding along lanes, like events moving through Kafka partitions.
   The counter uses the real figure from my work: 5M+ events a day, about 58 a second. */
(function () {
  var canvas = document.getElementById("stream");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var counter = document.getElementById("count");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var RATE = 5000000 / 86400;
  var LANES = 5;
  var COLORS = ["#fff8fb", "#8fe3bd", "#ffe27a", "#c9b3ff", "#a9dcff"];
  var w = 0, h = 0, candies = [];

  function laneY(i) {
    var top = h * 0.17, bottom = h * 0.83;
    return top + ((bottom - top) * i) / (LANES - 1);
  }

  function seed() {
    candies = [];
    var per = Math.max(4, Math.round(w / 120));
    for (var lane = 0; lane < LANES; lane++) {
      var base = 26 + ((lane * 29) % 46);
      for (var k = 0; k < per; k++) {
        candies.push({
          lane: lane,
          x: Math.random() * w,
          r: 6 + Math.random() * 4,
          speed: base * (0.85 + Math.random() * 0.4),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          wrapped: Math.random() < 0.28
        });
      }
    }
  }

  function round(x, y, r, c) {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath(); ctx.arc(x - r * 0.32, y - r * 0.32, r * 0.27, 0, Math.PI * 2); ctx.fill();
  }

  function wrapped(x, y, r, c) {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(x, y, r * 1.15, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - r, y); ctx.lineTo(x - r * 1.9, y - r * 0.85); ctx.lineTo(x - r * 1.9, y + r * 0.85); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + r * 1.9, y - r * 0.85); ctx.lineTo(x + r * 1.9, y + r * 0.85); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.18, -0.4, 0, Math.PI * 2); ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.setLineDash([2, 9]);
    for (var i = 0; i < LANES; i++) {
      var y = laneY(i);
      ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(w - 8, y); ctx.stroke();
    }
    ctx.setLineDash([]);
    for (var j = 0; j < candies.length; j++) {
      var c = candies[j], cy = laneY(c.lane);
      if (c.wrapped) wrapped(c.x, cy, c.r, c.color); else round(c.x, cy, c.r, c.color);
    }
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    draw();
  }

  var last = 0, start = 0;
  function frame(t) {
    if (!start) { start = t; last = t; }
    var dt = Math.min((t - last) / 1000, 0.1);
    last = t;
    for (var i = 0; i < candies.length; i++) {
      var c = candies[i];
      c.x += c.speed * dt;
      if (c.x - c.r * 2 > w) c.x = -c.r * 2.2;
    }
    draw();
    if (counter) counter.textContent = Math.floor(((t - start) / 1000) * RATE).toLocaleString("en-US");
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();

  if (reduce) {
    if (counter) {
      counter.textContent = "58";
      var note = document.getElementById("count-note");
      if (note) note.textContent = " events every second.";
    }
  } else {
    requestAnimationFrame(frame);
  }
})();
