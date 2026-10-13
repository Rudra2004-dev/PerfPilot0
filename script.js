// Intro animation (runs immediately, before first paint)
(function () {
  if (
    window.matchMedia &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  document.documentElement.classList.add("anim");
  var timer,
    safety,
    started = false,
    done = false;
  function clean() {
    if (done) return;
    done = true;
    clearTimeout(timer);
    clearTimeout(safety);
    document.removeEventListener("animationend", onEnd, true);
    document.documentElement.classList.remove("anim", "go");
  }
  function onEnd(e) {
    if (
      e.animationName === "pillIn" &&
      e.target.classList.contains("btn-ghost")
    )
      clean();
  }
  function start() {
    if (started) return;
    started = true;
    clearTimeout(timer);
    document.addEventListener("animationend", onEnd, true);
    safety = setTimeout(clean, 2600);
    document.documentElement.classList.add("go");
  }
  function boot() {
    timer = setTimeout(start, 900);
    if (document.fonts && document.fonts.ready)
      document.fonts.ready.then(start, start);
    else start();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

// Mobile menu (runs once the DOM is ready)
document.addEventListener("DOMContentLoaded", function () {
  var b = document.getElementById("burger"),
    m = document.getElementById("menu");
  if (!b || !m) return;
  function set(open) {
    m.classList.toggle("open", open);
    b.setAttribute("aria-expanded", String(open));
    b.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  b.addEventListener("click", function (e) {
    e.stopPropagation();
    set(!m.classList.contains("open"));
  });
  m.addEventListener("click", function (e) {
    if (e.target.closest("a")) set(false);
  });
  document.addEventListener("click", function (e) {
    if (m.classList.contains("open") && !m.contains(e.target) && e.target !== b)
      set(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && m.classList.contains("open")) {
      set(false);
      b.focus();
    }
  });
});

// Background video crossfade loop (runs once the DOM is ready)
document.addEventListener("DOMContentLoaded", function () {
  var a = document.getElementById("bgVideoA"),
    b = document.getElementById("bgVideoB");
  if (!a || !b) return;
  if (
    window.matchMedia &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    a.removeAttribute("autoplay");
    a.pause();
    b.pause();
    try {
      a.currentTime = 0;
    } catch (e) {}
    return;
  }
  var FADE = 0.9,
    cur = a,
    nxt = b,
    swapping = false;
  function play(v) {
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }
  function tick() {
    if (swapping || !cur.duration) return;
    if (cur.duration - cur.currentTime > FADE) return;
    swapping = true;
    var out = cur;
    nxt.currentTime = 0;
    play(nxt);
    nxt.classList.add("is-active");
    out.classList.remove("is-active");
    var tmp = cur;
    cur = nxt;
    nxt = tmp;
    setTimeout(
      function () {
        out.pause();
        out.currentTime = 0;
        swapping = false;
      },
      FADE * 1000 + 100,
    );
  }
  play(a);
  a.addEventListener("timeupdate", tick);
  b.addEventListener("timeupdate", tick);
});

// URL form (runs once the DOM is ready)
document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("urlForm"),
    input = document.getElementById("urlValue"),
    placeholder = document.getElementById("urlPlaceholder"),
    mode = document.getElementById("urlMode"),
    status = document.getElementById("urlStatus");
  if (!form || !input) return;
  var options = [
    "Paste a URL to get started...",
    "Enter a website to analyze...",
  ];
  var index = 0;
  function render() {
    placeholder.innerHTML = "<span>" + options[index] + "</span>";
    mode.setAttribute(
      "aria-label",
      index ? "Use paste URL mode" : "Use website analysis mode",
    );
  }
  mode.addEventListener("click", function () {
    index = (index + 1) % options.length;
    render();
    input.focus();
  });
  input.addEventListener("input", function () {
    placeholder.hidden = input.value.length > 0;
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var value = input.value.trim();
    if (!value) {
      status.textContent = "Enter a URL first.";
      input.focus();
      return;
    }
    try {
      var url = new URL(
        /^https?:\/\//i.test(value) ? value : "https://" + value,
      );
      status.textContent = "URL ready: " + url.hostname;
    } catch (err) {
      status.textContent = "Please enter a valid URL.";
      input.focus();
    }
  });
  render();
});