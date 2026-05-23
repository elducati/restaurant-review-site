# Restaurant Reviews — Nairobi

A browser-based restaurant review platform built with vanilla JavaScript and the Google Maps JavaScript API.

## Features

- Interactive Google Map with restaurant markers
- Sidebar list with star ratings and real-time filtering
- Google Places API integration to discover nearby restaurants
- Street View panoramas for restaurant locations
- Add restaurants (click on the map) and write reviews (in-memory)
- Responsive design (desktop + mobile)
- Keyboard accessible

## Setup

### 1. Get a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select existing)
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Street View Static API
4. Create an API key and restrict it by HTTP referrer to your domain

### 2. Configure the API Key

```bash
cp config.example.js config.js
```

Open `config.js` and replace `YOUR_API_KEY_HERE` with your actual API key.

**Never commit `config.js`** — it's in `.gitignore`.

### 3. Run

Serve the directory with any HTTP server (required for `fetch()` and the Google Maps API):

```bash
# Using Python
python -m http.server 8080

# Using Node
npx serve .

# Using VS Code
# Install "Live Server" extension → right-click index.html → Open with Live Server
```

Then open `http://localhost:8080` in a browser.

## Usage

- **Browse** restaurants in the sidebar or on the map
- **Filter** by minimum star rating using the stars in the sidebar header
- **View details** — click a restaurant card to open the review panel with Street View
- **Add a review** — in the review panel, fill out the form and submit
- **Add a restaurant** — click anywhere on the map, fill in the name and rating
- **Locate me** — click the crosshair button in the header to re-center on your position
- **Nearby results** — pan the map to discover restaurants from Google Places

## Project Structure

```
├── index.html            Main HTML
├── style.css             All styles (responsive, custom properties)
├── app.js                Application logic (IIFE pattern)
├── restaurants.json      Seed data (8 Nairobi restaurants)
├── config.example.js     API key template → copy to config.js
├── .env.example          Environment variable reference
├── .gitignore
└── README.md
```

## Data

All user data (reviews, added restaurants) is stored in memory only and will be lost on page refresh. The `restaurants.json` file provides seed data. Google Places API results are cached during the session.
