/* Draws a quiet stream of events moving across lanes, like partitions in a Kafka topic.
   The counter uses the real figure from my work: 5M+ events a day, about 58 a second. */
(function () {
  var canvas = document.getElementById("stream");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var counter = document.getElementById("count");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var RATE = 5000000 / 86400;
  var LANES = 7;
  var w = 0, h = 0, events = [];

  function laneY(i) {
    var top = h * 0.14, bottom = h * 0.9;
    return top + ((bottom - top) * i) / (LANES - 1);
  }

  function seed() {
    events = [];
    for (var lane = 0; lane < LANES; lane++) {
      var speed = 28 + ((lane * 37) % 55);
      var n = Math.max(4, Math.round(w / 150));
      for (var k = 0; k < n; k++) {
        events.push({
          lane: lane,
          x: Math.random() * w,
          len: 6 + Math.random() * 16,
          speed: speed * (0.8 + Math.random() * 0.5),
          hot: Math.random() < 0.22
        });
      }
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

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = "round";
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(190, 225, 228, 0.14)";
    for (var i = 0; i < LANES; i++) {
      var y = laneY(i);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.lineWidth = 3;
    for (var j = 0; j < events.length; j++) {
      var e = events[j], y2 = laneY(e.lane);
      ctx.strokeStyle = e.hot ? "#f0a21b" : "rgba(120, 205, 212, 0.75)";
      ctx.beginPath(); ctx.moveTo(e.x, y2); ctx.lineTo(e.x + e.len, y2); ctx.stroke();
    }
  }

  var last = 0, start = 0;
  function frame(t) {
    if (!start) { start = t; last = t; }
    var dt = Math.min((t - last) / 1000, 0.1);
    last = t;
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      e.x += e.speed * dt;
      if (e.x > w + 4) { e.x = -e.len - 4; }
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
      if (note) note.textContent = " every second.";
    }
  } else {
    requestAnimationFrame(frame);
  }
})();
