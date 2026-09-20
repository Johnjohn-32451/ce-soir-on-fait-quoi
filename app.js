// Ce soir, on fait quoi ? -- Step 3: filters + Spin button + result card.

// ---------- Elements from index.html ----------
const statusEl = document.getElementById("status");
const filtersEl = document.getElementById("filters");
const moodEl = document.getElementById("filter-mood");
const budgetEl = document.getElementById("filter-budget");
const typeEl = document.getElementById("filter-type");
const noMatchEl = document.getElementById("no-match");
const resetEl = document.getElementById("reset-filters");
const spinBtn = document.getElementById("spin-button");
const spinnerEl = document.getElementById("spinner");
const resultEl = document.getElementById("result");

// ---------- Settings ----------
const SPIN_DURATION = 2000; // the animation lasts about 2 seconds (in milliseconds)
const FLICKER_SPEED = 90;   // the name on screen changes every 90 milliseconds

// ---------- Things the app remembers while it runs ----------
let allPlaces = [];     // every place from places.json
let lastPlace = null;   // the place we landed on last time (so we never repeat it)
let isSpinning = false; // true while the animation is running

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

  // The "Spin again" button lives inside the card
  const againBtn = document.createElement("button");
  againBtn.type = "button";
  againBtn.className = "again-button";
  againBtn.textContent = "Spin again";
  againBtn.addEventListener("click", startSpin);
  card.appendChild(againBtn);

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
}

// ---------- Filters ----------

// Return only the places that match the three filters.
// "any" means "don't filter on this one".
function getMatchingPlaces() {
  const mood = moodEl.value;
  const budget = budgetEl.value; // "any" or "1" / "2" / "3"
  const type = typeEl.value;

  return allPlaces.filter(function (place) {
    // Mood: the place must have that vibe among its vibes
    const moodOk = mood === "any" || place.vibes.includes(mood);
    // Budget: "up to N" means price <= N
    const budgetOk = budget === "any" || place.price <= Number(budget);
    // Type: exact match
    const typeOk = type === "any" || place.type === type;
    // A place is kept only if all three filters agree
    return moodOk && budgetOk && typeOk;
  });
}

// Turn the three dropdowns on or off (we turn them off during a spin)
function setFiltersDisabled(disabled) {
  moodEl.disabled = disabled;
  budgetEl.disabled = disabled;
  typeEl.disabled = disabled;
}

// Read the filters, then update the counter, the message and the Spin button.
// This runs every time the user changes a dropdown.
function applyFilters() {
  const matches = getMatchingPlaces();

  // The filters changed, so the old result may no longer match: hide it
  clearResult();

  if (matches.length === 0) {
    showStatus("", false);     // hide the counter
    noMatchEl.hidden = false;  // show the friendly message
    spinBtn.hidden = true;     // nothing to spin on
  } else {
    noMatchEl.hidden = true;
    spinBtn.hidden = false;
    showStatus(matches.length === 1 ? "1 place matches" : matches.length + " places match", false);
  }
}

// Put all three filters back on "any"
function resetFilters() {
  moodEl.value = "any";
  budgetEl.value = "any";
  typeEl.value = "any";
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
    filtersEl.hidden = false; // the filters only appear once the data is ready
    applyFilters();
  } catch (error) {
    // The details go to the console (F12) for debugging
    console.error("Could not load places:", error);
    showStatus("Oups, impossible de charger les lieux. Réessaie dans un instant.", true);
  }
}

// Re-filter whenever a dropdown changes, and when "Reset filters" is tapped
filtersEl.addEventListener("change", applyFilters);
resetEl.addEventListener("click", resetFilters);
spinBtn.addEventListener("click", startSpin);

loadPlaces();
