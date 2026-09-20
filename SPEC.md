# Ce soir, on fait quoi ?

## Objectif

A single-page web app that suggests one night out in Lausanne from a curated list, filtered by the user's mood, budget and type of outing. The user presses "Spin" and the app lands on one place.

## Utilisateurs

Me and my friends, on a phone.

## Fonctionnalites

### Must have

- A data file `places.json` with 20 to 30 real places. Each place has: name, type (bar / restaurant / activity), price level (1 to 3), vibe tags (chill, festive, romantic, cheap...), neighbourhood, and a Google Maps link.
- Filters for mood, budget and type.
- A "Spin" button with a short animation (about 2 seconds) that lands on a random place matching the filters.
- A result card showing the place details, the Maps link, and a "Spin again" button.
- Mobile-first layout (design for 375px wide first).
- If no place matches the filters, show a friendly message instead of crashing.

### Should have

- A "veto" button that excludes a place for the rest of the session.
- Favorites saved in the browser (localStorage).

### Could have

- A French / English toggle.
- A "group mode" where 2 to 4 people each pick a mood and the app finds the overlap.

## Contraintes techniques

- Plain HTML, CSS and JavaScript. No framework, no build step.
- One folder, fewer than 5 files: `index.html`, `style.css`, `app.js`, `places.json`.
- The main file must be named exactly `index.html`, in the root of the folder.
- All file paths must be relative (`places.json`, not `/places.json`) so the site works on GitHub Pages.
- No backend, no database, no API keys.
- Hosted for free on GitHub Pages.

## Hors perimetre

- User accounts
- Live opening hours or real-time data
- Payments
- Anything that needs a server

## Criteres d'acceptation

- It works on my phone.
- Every filter combination works, including ones that match nothing.
- Favorites survive a page refresh.
- A friend can use it without any explanation.

## Regles pour l'IA

- Do not invent places. Use only the places I put in `places.json`.
- Propose a plan before writing code, and build one step at a time.
- After each step, explain in simple terms what you changed and why.
- Keep the code simple and commented so a beginner can read it.
