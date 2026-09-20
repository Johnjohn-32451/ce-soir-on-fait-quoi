// Ce soir, on fait quoi ? -- Step 4: filters + Spin + result card + veto + favorites.

// ---------- Elements from index.html ----------
const statusEl = document.getElementById("status");
const filtersEl = document.getElementById("filters");
const moodEl = document.getElementById("filter-mood");
const budgetEl = document.getElementById("filter-budget");
const typeEl = document.getElementById("filter-type");
const noMatchEl = document.getElementById("no-match");
const noMatchTitleEl = document.getElementById("no-match-title");
const noMatchHintEl = document.getElementById("no-match-hint");
const resetEl = document.getElementById("reset-filters");
const restoreEl = document.getElementById("restore-vetoed");
const spinBtn = document.getElementById("spin-button");
const spinnerEl = document.getElementById("spinner");
const resultEl = document.getElementById("result");
const favoritesEl = document.getElementById("favorites");
const favoritesCountEl = document.getElementById("favorites-count");
const favoritesEmptyEl = document.getElementById("favorites-empty");
const favoritesListEl = document.getElementById("favorites-list");
const storageWarningEl = document.getElementById("storage-warning");

// ---------- Settings ----------
const SPIN_DURATION = 2000; // the animation lasts about 2 seconds (in milliseconds)
const FLICKER_SPEED = 90;   // the name on screen changes every 90 milliseconds
const FAVORITES_KEY = "ce-soir-favorites"; // the name of our slot in localStorage

// ---------- Things the app remembers while it runs ----------
let allPlaces = [];     // every place from places.json
let lastPlace = null;   // the place we landed on last time (so we never repeat it)
let isSpinning = false; // true while the animation is running
let vetoed = new Set(); // places excluded for this session (kept in memory only: a refresh clears it)
let favorites = [];     // names of the saved places (also saved in localStorage)
let storageBlocked = false; // becomes true if the browser refuses to let us use localStorage

// The card currently on screen (we need them to update its heart button)
let resultPlace = null;
let resultFavButton = null;

// ---------- Small helpers ----------

// Show a message to the user (isError = true makes it red)
function showStatus(message, isError) {
  statusEl.textContent = message;
  statusEl.className = isError ? "error" : "";
  statusEl.hidden = message === "";
}

// Turn a price number (1 to 3) into dots: 2 -> "●●○"
function priceDots(price) {
  return "●".repeat(price) + "○".repeat(3 - price);
}

// Pick a random item from a list
function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// ---------- Favorites (saved in localStorage) ----------
// Every touch of localStorage is inside try/catch: some browsers (private mode,
// blocked site data) throw an error, and we don't want the app to crash.

// Read the saved favorites. Returns a list of place names.
function loadFavorites() {
  let saved = null;
  try {
    saved = localStorage.getItem(FAVORITES_KEY);
  } catch (error) {
    storageBlocked = true; // storage is not available
    return [];
  }
  if (!saved) {
    return []; // nothing saved yet
  }
  try {
    const list = JSON.parse(saved);
    // Keep only text items, in case the saved data is not what we expect
    return Array.isArray(list) ? list.filter(function (item) { return typeof item === "string"; }) : [];
  } catch (error) {
    return []; // the saved data was damaged: start fresh
  }
}

// Write the favorites to localStorage
function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    storageBlocked = true; // the favorite still works until the page closes
  }
}

// Is this place in the favorites?
function isFavorite(place) {
  return favorites.includes(place.name);
}

// Add the place to the favorites, or remove it if it is already there
function toggleFavorite(place) {
  if (isFavorite(place)) {
    favorites = favorites.filter(function (name) { return name !== place.name; });
  } else {
    favorites.push(place.name);
  }
  saveFavorites();
  renderFavorites();
  // If this place is on the result card, update its heart button too
  if (resultPlace === place && resultFavButton) {
    updateFavoriteButton(resultFavButton, place);
  }
}

// Set the text and colour of a heart button: "♡ Save" or "♥ Saved"
function updateFavoriteButton(button, place) {
  const saved = isFavorite(place);
  button.textContent = saved ? "♥ Saved" : "♡ Save";
  button.classList.toggle("active", saved);
  button.setAttribute("aria-pressed", saved);
}

// Draw the favorites list at the bottom of the page
function renderFavorites() {
  // Turn the saved names back into places (names that no longer exist are ignored)
  const savedPlaces = allPlaces.filter(function (place) {
    return favorites.includes(place.name);
  });

  favoritesCountEl.textContent = savedPlaces.length;
  favoritesEmptyEl.hidden = savedPlaces.length > 0;
  storageWarningEl.hidden = !storageBlocked;

  favoritesListEl.innerHTML = "";
  for (const place of savedPlaces) {
    const item = document.createElement("li");
    item.className = "favorite-item";

    // Left side: the name (a link to Maps) and the neighbourhood
    const info = document.createElement("div");
    info.className = "favorite-info";
    const link = document.createElement("a");
    link.href = place.maps;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = place.name;
    const small = document.createElement("small");
    small.textContent = place.type + " · " + place.area;
    info.appendChild(link);
    info.appendChild(small);
    item.appendChild(info);

    // Right side: a button to remove it from the favorites
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-button";
    removeBtn.textContent = "Remove";
    removeBtn.setAttribute("aria-label", "Remove " + place.name + " from favorites");
    removeBtn.addEventListener("click", function () {
      toggleFavorite(place);
    });
    item.appendChild(removeBtn);

    favoritesListEl.appendChild(item);
  }
}

// ---------- The result card ----------

// Build one card for one place.
// We use textContent instead of innerHTML so that characters like "&" in a
// name can never be misread as HTML.
function buildCard(place) {
  const card = document.createElement("article");
  card.className = "card";

  // Name
  const name = document.createElement("h2");
  name.textContent = place.name;
  card.appendChild(name);

  // Type, price and neighbourhood on one line
  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent = place.type + " · " + priceDots(place.price) + " · " + place.area;
  card.appendChild(meta);

  // Vibe tags
  const vibes = document.createElement("div");
  vibes.className = "vibes";
  for (const vibe of place.vibes) {
    const tag = document.createElement("span");
    tag.className = "vibe";
    tag.textContent = vibe;
    vibes.appendChild(tag);
  }
  card.appendChild(vibes);

  // Note: only shown when it is not empty
  if (place.note) {
    const note = document.createElement("p");
    note.className = "note";
    note.textContent = place.note;
    card.appendChild(note);
  }

  // Google Maps link (opens in a new tab)
  const link = document.createElement("a");
  link.className = "maps-link";
  link.href = place.maps;
  link.target = "_blank";
  link.rel = "noopener"; // safety: the new tab can't control this one
  link.textContent = "Open in Maps";
  card.appendChild(link);

  return card;
}

// Show the result card for the place we landed on
function showResult(place) {
  resultEl.innerHTML = ""; // remove any previous card
  const card = buildCard(place);
  card.classList.add("landed"); // a little "pop" animation (see style.css)

  // "Spin again" button
  const againBtn = document.createElement("button");
  againBtn.type = "button";
  againBtn.className = "again-button";
  againBtn.textContent = "Spin again";
  againBtn.addEventListener("click", startSpin);
  card.appendChild(againBtn);

  // A row with two smaller buttons: save as favorite, and veto
  const actions = document.createElement("div");
  actions.className = "card-actions";

  const favBtn = document.createElement("button");
  favBtn.type = "button";
  favBtn.className = "small-button";
  updateFavoriteButton(favBtn, place);
  favBtn.addEventListener("click", function () {
    toggleFavorite(place);
  });
  actions.appendChild(favBtn);

  const vetoBtn = document.createElement("button");
  vetoBtn.type = "button";
  vetoBtn.className = "small-button";
  vetoBtn.textContent = "✕ Veto";
  vetoBtn.addEventListener("click", function () {
    vetoPlace(place);
  });
  actions.appendChild(vetoBtn);

  card.appendChild(actions);

  // Remember what is on screen, so toggleFavorite can update the heart
  resultPlace = place;
  resultFavButton = favBtn;

  resultEl.appendChild(card);
  resultEl.hidden = false;
  // On a phone the card might be below the screen edge: scroll it into view
  resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Hide the result card and the spinning box
function clearResult() {
  resultEl.hidden = true;
  resultEl.innerHTML = "";
  spinnerEl.hidden = true;
  resultPlace = null;
  resultFavButton = null;
}

// ---------- Filters ----------

// Does this place pass the three filters? ("any" means "don't filter on this one")
function matchesFilters(place) {
  const mood = moodEl.value;
  const budget = budgetEl.value; // "any" or "1" / "2" / "3"
  const type = typeEl.value;

  // Mood: the place must have that vibe among its vibes
  const moodOk = mood === "any" || place.vibes.includes(mood);
  // Budget: "up to N" means price <= N
  const budgetOk = budget === "any" || place.price <= Number(budget);
  // Type: exact match
  const typeOk = type === "any" || place.type === type;
  // A place passes only if all three filters agree
  return moodOk && budgetOk && typeOk;
}

// The places we can spin on: they pass the filters AND have not been vetoed
function getMatchingPlaces() {
  return allPlaces.filter(function (place) {
    return matchesFilters(place) && !vetoed.has(place);
  });
}

// Turn the three dropdowns on or off (we turn them off during a spin)
function setFiltersDisabled(disabled) {
  moodEl.disabled = disabled;
  budgetEl.disabled = disabled;
  typeEl.disabled = disabled;
}

// Read the filters, then update the counter, the message and the Spin button.
// This runs every time the user changes a dropdown (or vetoes a place).
function applyFilters() {
  const matches = getMatchingPlaces();

  // Things changed, so the old result may no longer be valid: hide it
  clearResult();

  if (matches.length === 0) {
    // Is it because of the vetoes? (places that pass the filters but were vetoed)
    const vetoesToBlame = allPlaces.some(function (place) {
      return matchesFilters(place) && vetoed.has(place);
    });
    if (vetoesToBlame) {
      noMatchTitleEl.textContent = "You vetoed everything that matches 😅";
      noMatchHintEl.textContent = "Bring the vetoed places back, or try other filters.";
    } else {
      noMatchTitleEl.textContent = "Nothing matches these filters 🤷";
      noMatchHintEl.textContent = "Try loosening one of them.";
    }
    restoreEl.hidden = !vetoesToBlame;

    showStatus("", false);     // hide the counter
    noMatchEl.hidden = false;  // show the friendly message
    spinBtn.hidden = true;     // nothing to spin on
  } else {
    noMatchEl.hidden = true;
    spinBtn.hidden = false;
    let text = matches.length === 1 ? "1 place matches" : matches.length + " places match";
    if (vetoed.size > 0) {
      text += " · " + vetoed.size + " vetoed";
    }
    showStatus(text, false);
  }
}

// Put all three filters back on "any"
function resetFilters() {
  moodEl.value = "any";
  budgetEl.value = "any";
  typeEl.value = "any";
  applyFilters();
}

// ---------- Veto ----------

// Exclude a place until the page is refreshed, then spin again
function vetoPlace(place) {
  if (isSpinning) {
    return;
  }
  vetoed.add(place);
  applyFilters(); // updates the counter; shows the friendly message if nothing is left
  // Only spin again if there is still something to land on (this avoids any loop)
  if (getMatchingPlaces().length > 0) {
    startSpin();
  }
}

// Undo all vetoes
function restoreVetoed() {
  vetoed.clear();
  applyFilters();
}

// ---------- Spin ----------

// Choose the winning place.
// If more than one place matches, we never choose the one we landed on last time.
function pickWinner(matches) {
  let candidates = matches;
  if (matches.length > 1) {
    candidates = matches.filter(function (place) {
      return place !== lastPlace;
    });
  }
  return randomItem(candidates);
}

// The Spin button (and "Spin again") calls this
function startSpin() {
  // Safety: if a spin is already running, ignore the tap.
  // This is what stops a double-tap from starting two animations.
  if (isSpinning) {
    return;
  }

  const matches = getMatchingPlaces();
  if (matches.length === 0) {
    return; // nothing to spin on
  }

  isSpinning = true;
  setFiltersDisabled(true);   // no changing filters mid-spin
  clearResult();              // hide the previous card, if any
  spinBtn.hidden = true;      // the spinning box takes its place
  spinnerEl.hidden = false;

  // Decide the winner now; the animation is just for show
  const winner = pickWinner(matches);

  // The animation: show a random name every 90 ms...
  spinnerEl.textContent = randomItem(matches).name;
  const flicker = setInterval(function () {
    spinnerEl.textContent = randomItem(matches).name;
  }, FLICKER_SPEED);

  // ...and after 2 seconds, stop and show the winner
  setTimeout(function () {
    clearInterval(flicker);
    spinnerEl.hidden = true;
    lastPlace = winner;       // remember it so we don't repeat it next time
    showResult(winner);
    setFiltersDisabled(false);
    isSpinning = false;
  }, SPIN_DURATION);
}

// ---------- Loading ----------

// Load places.json, then get ready. If anything goes wrong we show a friendly
// message instead of a blank page.
async function loadPlaces() {
  try {
    const response = await fetch("places.json");
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("places.json is empty or not a list");
    }
    allPlaces = data;
    favorites = loadFavorites(); // read the saved favorites from localStorage
    filtersEl.hidden = false;    // the filters only appear once the data is ready
    favoritesEl.hidden = false;
    renderFavorites();
    applyFilters();
  } catch (error) {
    // The details go to the console (F12) for debugging
    console.error("Could not load places:", error);
    showStatus("Oups, impossible de charger les lieux. Réessaie dans un instant.", true);
  }
}

// Re-filter whenever a dropdown changes; wire up the other buttons
filtersEl.addEventListener("change", applyFilters);
resetEl.addEventListener("click", resetFilters);
restoreEl.addEventListener("click", restoreVetoed);
spinBtn.addEventListener("click", startSpin);

loadPlaces();
