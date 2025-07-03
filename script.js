const body = document.body;
const sections = ["spells", "characters", "houses", "favorites"];
const modal = document.getElementById("modal");
const modalName = document.getElementById("modalName");
const modalType = document.getElementById("modalType");
const modalDesc = document.getElementById("modalDesc");
const closeModal = document.getElementById("closeModal");
const themeToggle = document.getElementById("themeToggle");

let allSpells = [],
  allCharacters = [],
  favorites = [];

function showSection(id) {
  sections.forEach((sec) =>
    document.getElementById(sec).classList.add("hidden")
  );
  document.getElementById(id).classList.remove("hidden");
  if (id === "favorites") displayFavorites();
  if (id === "houses") fetchHouses();
}

function toggleTheme() {
  body.classList.toggle("dark");
  body.classList.toggle("light");
  const isDark = body.classList.contains("dark");
  themeToggle.textContent = isDark ? "🌙" : "🌞";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  body.classList.remove("dark", "light");
  body.classList.add(savedTheme);
  themeToggle.textContent = savedTheme === "dark" ? "🌙" : "🌞";
}

function loadFavorites() {
  favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
}

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function isFavorited(item) {
  return favorites.some((fav) => fav.name === item.name);
}

function toggleFavorite(item, type) {
  const index = favorites.findIndex((fav) => fav.name === item.name);
  if (index !== -1) favorites.splice(index, 1);
  else favorites.push({ ...item, type });
  saveFavorites();
  displayFavorites();
  fetchCharacters();
  displaySpells(allSpells);
}

function displayFavorites() {
  const container = document.getElementById("favoriteList");
  container.innerHTML = "";
  favorites.forEach((item) => {
    const div = document.createElement("div");
    div.className = "info-card";
    div.innerHTML = `
      <h3>${item.name} ⭐</h3>
      <p><strong>Type:</strong> ${item.type || item.house || "Unknown"}</p>
      <p><strong>Description:</strong> ${
        item.description || item.ancestry || "None"
      }</p>
    `;
    container.appendChild(div);
  });
}

closeModal.addEventListener("click", () => (modal.style.display = "none"));
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

document.getElementById("sortSpellsBtn").addEventListener("click", () => {
  allSpells.sort((a, b) => a.name.localeCompare(b.name));
  displaySpells(allSpells);
});

document
  .getElementById("charSearchInput")
  .addEventListener("input", filterCharacters);
document
  .getElementById("houseFilter")
  .addEventListener("change", filterCharacters);

async function fetchSpells() {
  const res = await fetch("https://hp-api.onrender.com/api/spells");
  const spells = await res.json();
  allSpells = spells;
  populateTypeDropdown(spells);
  displaySpells(spells);

  document
    .getElementById("searchInput")
    .addEventListener("input", filterSpells);
  document
    .getElementById("typeFilter")
    .addEventListener("change", filterSpells);
}

function populateTypeDropdown(spells) {
  const types = new Set();
  spells.forEach((s) => s.type && types.add(s.type));
  const dropdown = document.getElementById("typeFilter");
  types.forEach((type) => {
    const opt = document.createElement("option");
    opt.value = type;
    opt.textContent = type;
    dropdown.appendChild(opt);
  });
}

function filterSpells() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const selected = document.getElementById("typeFilter").value;
  const filtered = allSpells.filter(
    (spell) =>
      spell.name.toLowerCase().includes(keyword) &&
      (selected === "All" || spell.type === selected)
  );
  displaySpells(filtered);
}

function displaySpells(spells) {
  const container = document.getElementById("spellList");
  const count = document.getElementById("spellCount");
  container.innerHTML = "";
  spells.forEach((spell) => {
    const card = document.createElement("div");
    card.className = "card";
    const fav = isFavorited(spell) ? "⭐" : "☆";
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <h3>${
            spell.name
          } <span class="fav" onclick="event.stopPropagation(); toggleFavorite(${JSON.stringify(
      spell
    )}, 'spell')">${fav}</span></h3>
          <p>${spell.type || "<span class='warn'>Unknown</span>"}</p>
        </div>
        <div class="card-back">
          <p onclick="this.classList.toggle('hidden')">${
            spell.description || "<span class='warn'>No description.</span>"
          }</p>
        </div>
      </div>
    `;
    card.addEventListener("click", () => {
      modalName.textContent = spell.name;
      modalType.textContent = spell.type || "Unknown";
      modalDesc.textContent = spell.description || "No description.";
      modal.style.display = "flex";
    });
    container.appendChild(card);
  });
  count.textContent = `Showing ${spells.length} of ${allSpells.length} spells`;
}

async function fetchCharacters() {
  const res = await fetch("https://hp-api.onrender.com/api/characters");
  const chars = await res.json();
  allCharacters = chars;
  populateHouseFilter(chars);
  displayCharacters(chars);
}

function populateHouseFilter(chars) {
  const houses = new Set();
  chars.forEach((c) => c.house && houses.add(c.house));
  const filter = document.getElementById("houseFilter");
  filter.innerHTML = '<option value="All">All Houses</option>';
  houses.forEach((h) => {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = h;
    filter.appendChild(opt);
  });
}

function filterCharacters() {
  const query = document.getElementById("charSearchInput").value.toLowerCase();
  const house = document.getElementById("houseFilter").value;
  const filtered = allCharacters.filter(
    (c) =>
      (c.name.toLowerCase().includes(query) ||
        (c.ancestry && c.ancestry.toLowerCase().includes(query)) ||
        (c.house && c.house.toLowerCase().includes(query))) &&
      (house === "All" || c.house === house)
  );
  displayCharacters(filtered);
}

function displayCharacters(chars) {
  const container = document.getElementById("charList");
  const count = document.getElementById("charCount");
  container.innerHTML = "";
  chars.slice(0, 50).forEach((c) => {
    const div = document.createElement("div");
    div.className = `info-card ${c.house?.toLowerCase() || "unknown"}`;
    const fav = isFavorited(c) ? "⭐" : "☆";
    div.innerHTML = `
      <h3>${
        c.name
      } <span class="fav" onclick="event.stopPropagation(); toggleFavorite(${JSON.stringify(
      c
    )}, 'character')">${fav}</span></h3>
      <p><strong>House:</strong> ${
        c.house || "<span class='warn'>Unknown</span>"
      }</p>
      <p><strong>Ancestry:</strong> ${
        c.ancestry || "<span class='warn'>Unknown</span>"
      }</p>
      <p><strong>Patronus:</strong> ${c.patronus || "None"}</p>
      <p><strong>Wand:</strong> ${
        c.wand?.wood || "<span class='warn'>N/A</span>"
      } ${c.wand?.core || ""}</p>
    `;
    container.appendChild(div);
  });
  count.textContent = `Showing ${chars.length} of ${allCharacters.length} characters`;
}

async function fetchHouses() {
  const res = await fetch("https://hp-api.onrender.com/api/houses");
  const houses = await res.json();
  const container = document.getElementById("houseList");
  container.innerHTML = "";
  houses.forEach((h) => {
    const div = document.createElement("div");
    div.className = "info-card";
    div.innerHTML = `
      <h3>${h.name}</h3>
      <p><strong>Founder:</strong> ${h.founder || "Unknown"}</p>
      <p><strong>Traits:</strong> ${h.traits.join(", ") || "None"}</p>
    `;
    container.appendChild(div);
  });
}

loadTheme();
loadFavorites();
fetchSpells();
fetchCharacters();
