(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* ---------- Окошко демо ---------- */
  var modal = document.getElementById("modal");
  var modalClose = document.getElementById("modal-close");
  var lastFocus = null;

  function openModal(e) {
    lastFocus = e && e.currentTarget ? e.currentTarget : document.activeElement;
    modal.hidden = false;
    requestAnimationFrame(function () { modal.classList.add("is-open"); });
    modalClose.focus();
  }
  function closeModal() {
    if (modal.hidden) return;
    modal.classList.remove("is-open");
    setTimeout(function () { modal.hidden = true; }, 250);
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll(".js-wa").forEach(function (b) {
    b.addEventListener("click", openModal);
  });
  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (modal.hidden) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") { e.preventDefault(); modalClose.focus(); }
  });

  /* ---------- Шапка при прокрутке ---------- */
  var head = document.querySelector(".head");
  function onScroll() {
    head.classList.toggle("is-scrolled", window.scrollY > 20);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Ползунок до/после ---------- */
  var ba = document.getElementById("ba");
  var handle = ba.querySelector(".ba__handle");
  var pos = 50;
  var dragging = false;

  function setPos(p) {
    pos = Math.max(0, Math.min(100, p));
    ba.style.setProperty("--pos", pos + "%");
    handle.setAttribute("aria-valuenow", Math.round(pos));
    handle.setAttribute("aria-valuetext", Math.round(pos) + "% до ремонта");
  }
  function posFromEvent(e) {
    var r = ba.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  }
  ba.addEventListener("pointerdown", function (e) {
    if (e.target.closest(".bubble")) return;
    dragging = true;
    ba.classList.remove("is-hint");
    ba.classList.add("is-drag");
    if (ba.setPointerCapture) ba.setPointerCapture(e.pointerId);
    setPos(posFromEvent(e));
  });
  ba.addEventListener("pointermove", function (e) {
    if (dragging) setPos(posFromEvent(e));
  });
  function stopDrag() { dragging = false; ba.classList.remove("is-drag"); }
  ba.addEventListener("pointerup", stopDrag);
  ba.addEventListener("pointercancel", stopDrag);

  // На телефоне горизонтальное движение пальцем двигает ползунок,
  // вертикальное прокручивает страницу (touch-action: pan-y).
  handle.addEventListener("keydown", function (e) {
    var step = e.shiftKey ? 10 : 4;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") setPos(pos - step);
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") setPos(pos + step);
    else if (e.key === "Home") setPos(0);
    else if (e.key === "End") setPos(100);
    else return;
    ba.classList.remove("is-hint");
    e.preventDefault();
  });

  // Подсказка: ползунок один раз мягко качнётся
  setTimeout(function () {
    if (dragging) return;
    ba.classList.add("is-hint");
    setPos(32);
    setTimeout(function () {
      if (!dragging && ba.classList.contains("is-hint")) setPos(50);
    }, 1000);
    setTimeout(function () { ba.classList.remove("is-hint"); }, 2000);
  }, 1200);
  setPos(50);

  /* ---------- Вкладки услуг ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var photos = document.querySelectorAll(".services__photo img");

  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    var idx = Number(tab.dataset.photo);
    photos.forEach(function (img, i) { img.classList.toggle("is-on", i === idx); });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t); });
    t.addEventListener("keydown", function (e) {
      var n = null;
      if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
  });

  /* ---------- Выбор работ и заявка ---------- */
  var rows = Array.prototype.slice.call(document.querySelectorAll(".row"));
  var pickedN = document.getElementById("picked-n");
  var list = document.getElementById("check-list");
  var empty = document.getElementById("check-empty");
  var houseLabel = document.getElementById("check-house");
  var msgText = document.getElementById("msg-text");
  var houseBtns = document.querySelectorAll(".house__btn");
  var house = "новостройка";

  function selected() {
    return rows.filter(function (r) {
      return r.getAttribute("aria-pressed") === "true";
    });
  }

  function render() {
    var sel = selected();
    pickedN.textContent = sel.length;
    pickedN.classList.add("is-bump");
    setTimeout(function () { pickedN.classList.remove("is-bump"); }, 250);

    while (list.firstChild) list.removeChild(list.firstChild);
    sel.forEach(function (r) {
      var li = document.createElement("li");
      var name = document.createElement("span");
      name.textContent = r.textContent;
      var del = document.createElement("button");
      del.type = "button";
      del.className = "check__del";
      del.textContent = "×";
      del.setAttribute("aria-label", "Убрать: " + r.textContent);
      del.addEventListener("click", function () {
        r.setAttribute("aria-pressed", "false");
        render();
      });
      li.appendChild(name);
      li.appendChild(del);
      list.appendChild(li);
    });
    empty.hidden = sel.length > 0;

    houseLabel.textContent = house.charAt(0).toUpperCase() + house.slice(1);

    var where = house === "вторичка" ? "во вторичке" : "в новостройке";
    var text = "Здравствуйте, Эдуард! Нужен ремонт " + where + ".";
    if (sel.length) {
      text += " Работы: " + sel.map(function (r) {
        return r.dataset.name.toLowerCase();
      }).join(", ") + ".";
    }
    text += " Когда сможете приехать на осмотр?";
    msgText.classList.add("is-fade");
    setTimeout(function () {
      msgText.textContent = text;
      msgText.classList.remove("is-fade");
    }, 150);
  }

  rows.forEach(function (r) {
    r.addEventListener("click", function () {
      var on = r.getAttribute("aria-pressed") === "true";
      r.setAttribute("aria-pressed", on ? "false" : "true");
      render();
    });
  });
  houseBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      house = b.dataset.house;
      houseBtns.forEach(function (x) {
        x.setAttribute("aria-pressed", x === b ? "true" : "false");
      });
      render();
    });
  });
  render();

  /* ---------- Карточки «О мастере»: на телефоне по нажатию ---------- */
  document.querySelectorAll(".card").forEach(function (c) {
    c.addEventListener("click", function () {
      var on = c.getAttribute("aria-pressed") === "true";
      c.setAttribute("aria-pressed", on ? "false" : "true");
    });
  });

  /* ---------- Появление блоков ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Плавающая кнопка ---------- */
  var fab = document.getElementById("fab");
  var hero = document.querySelector(".hero");
  var blockers = [document.querySelector(".foot"), document.getElementById("send-btn")];
  var heroOut = false;
  var blocked = new Set();

  function updateFab() { fab.classList.toggle("is-on", heroOut && blocked.size === 0); }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      heroOut = !en[0].isIntersecting;
      updateFab();
    }, { threshold: 0.05 }).observe(hero);
    var bo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) blocked.add(en.target);
        else blocked.delete(en.target);
      });
      updateFab();
    });
    blockers.forEach(function (b) { bo.observe(b); });
  }
})();
