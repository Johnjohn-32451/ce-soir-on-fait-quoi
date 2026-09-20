// Ce soir, on fait quoi ? -- Step 1: load places.json and show every place.

// The two elements from index.html that we will fill in
const statusEl = document.getElementById("status");
const listEl = document.getElementById("place-list");

// All the places will be stored here once loaded
let allPlaces = [];

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

// Build one card (an <li> element) for one place.
// We use textContent instead of innerHTML so that characters like "&" in a
// name can never be misread as HTML.
function buildCard(place) {
  const card = document.createElement("li");
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

// Draw all the cards on the page
function renderList(places) {
  listEl.innerHTML = ""; // empty the list first
  for (const place of places) {
    listEl.appendChild(buildCard(place));
  }
}

// Load places.json, then show it. If anything goes wrong we show a friendly
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
    showStatus(allPlaces.length + " places", false);
    renderList(allPlaces);
  } catch (error) {
    // The details go to the console (F12) for debugging
    console.error("Could not load places:", error);
    showStatus("Oups, impossible de charger les lieux. Réessaie dans un instant.", true);
  }
}

loadPlaces();
