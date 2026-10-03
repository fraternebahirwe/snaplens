// Lens explorer: the pull-up grid with Recents / Favourites / For you / Aesthetic / Games / search.
(function () {
  const sheet = document.getElementById("lensSheet");
  const grid = document.getElementById("lensGrid");
  const search = document.getElementById("lensSearch");
  const tabs = document.querySelectorAll(".tab");

  let tab = "foryou";
  let query = "";

  // ---- saved on this device only ----
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem("snaplens." + key)) || fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem("snaplens." + key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
  }
  let favs = load("favs", []);
  let recents = load("recents", []);
  let uses = load("uses", {});

  const plainName = f => f.name.replace(/^[^A-Za-z]+/, "");

  function visibleLenses() {
    const byId = id => FILTERS.find(f => f.id === id);
    let list;
    if (tab === "recents") list = recents.map(byId).filter(Boolean);
    else if (tab === "favourites") list = favs.map(byId).filter(Boolean);
    else if (tab === "aesthetic" || tab === "games") list = FILTERS.filter(f => f.cat === tab);
    else list = FILTERS;
    const q = query.trim().toLowerCase();
    return q ? FILTERS.filter(f => plainName(f).toLowerCase().includes(q) || (f.cat || "").includes(q)) : list;
  }

  function render() {
    const list = visibleLenses();
    const active = window.getLens && window.getLens();
    grid.replaceChildren();
    if (!list.length) {
      const e = document.createElement("p");
      e.className = "empty";
      e.textContent = tab === "recents" ? "Lenses you use will show up here." : tab === "favourites" ? "Tap the star on a lens to keep it here." : "No lenses found.";
      grid.appendChild(e);
      return;
    }
    list.forEach(f => {
      const t = document.createElement("div");
      t.className = "tile cat-" + (f.cat || "basic") + (active && active.id === f.id ? " selected" : "");
      t.setAttribute("role", "button");
      t.tabIndex = 0;
      t.innerHTML = '<span class="art"></span><button class="fav" aria-label="Favourite"></button><div class="meta"><span></span><small></small></div>';
      t.querySelector(".art").textContent = f.emoji || "✨";
      const fav = t.querySelector(".fav");
      fav.textContent = favs.includes(f.id) ? "★" : "☆";
      fav.classList.toggle("on", favs.includes(f.id));
      t.querySelector(".meta span").textContent = plainName(f);
      t.querySelector("small").textContent = uses[f.id] ? "▶ " + uses[f.id] + (uses[f.id] === 1 ? " use" : " uses") : f.faces ? "face lens" : "";
      fav.addEventListener("click", e => {
        e.stopPropagation();
        favs = favs.includes(f.id) ? favs.filter(x => x !== f.id) : [f.id, ...favs];
        save("favs", favs);
        render();
      });
      const choose = () => { window.setLens(f); close(); };
      t.addEventListener("click", choose);
      t.addEventListener("keydown", e => { if (e.key === "Enter") choose(); });
      grid.appendChild(t);
    });
  }

  function open() { sheet.hidden = false; render(); }
  function close() { sheet.hidden = true; }

  tabs.forEach(b => b.addEventListener("click", () => {
    tab = b.dataset.tab;
    query = ""; search.value = ""; search.hidden = true;
    tabs.forEach(x => x.classList.toggle("active", x === b));
    render();
  }));

  document.getElementById("searchBtn").addEventListener("click", () => {
    search.hidden = !search.hidden;
    if (!search.hidden) search.focus(); else { query = ""; render(); }
  });
  search.addEventListener("input", () => { query = search.value; render(); });
  document.getElementById("lensBtn").addEventListener("click", open);
  document.getElementById("closeSheet").addEventListener("click", close);
  window.addEventListener("keydown", e => { if (e.key === "Escape" && !sheet.hidden) close(); });

  // count uses and recents whenever a lens is chosen
  document.addEventListener("lenschange", e => {
    const id = e.detail.id;
    if (id === "normal") return;
    uses[id] = (uses[id] || 0) + 1;
    recents = [id, ...recents.filter(x => x !== id)].slice(0, 12);
    save("uses", uses);
    save("recents", recents);
  });
})();
