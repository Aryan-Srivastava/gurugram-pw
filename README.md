# Waypoint — Travel Planning & Experience Engine

Waypoint is a high-performance, real-time web application that dynamically generates and adjusts trip itineraries based on user preferences, budget constraints, and live updates (flights, weather, availability).

## 🚀 Features

- **Multi-City Itineraries:** Plan complex trips across multiple destinations.
- **Real-Time Data Integrations:**
  - **Weather:** Live integration with Open-Meteo API for real-time forecasts and WMO code parsing.
  - **Flights:** Integration with Aviationstack API (with rich mock fallbacks).
- **Dynamic Re-planning:** Automatically detects disruptions (e.g., storms, flight delays) and suggests indoor alternatives or adjusted schedules.
- **Algorithmic Activity Scoring:** Matches activities against a curated database based on user interests, budget tier, and real-time weather suitability.
- **Budget Tracking:** Real-time per-category spend tracking (Hotels, Activities, Food, Flights).
- **High-End UI:** Dark-mode first, glassmorphic UI built from scratch using custom CSS tokens and variables.
- **Zero-Build Vanilla JS:** No React, Vue, or Webpack. Fast, lightweight, and uses native ES modules.
- **Robust Security & Quality:** Prevents XSS via strict HTML sanitization before DOM injection.

## 🛠️ Technology Stack

- **HTML5 & CSS3:** Semantic HTML and robust custom CSS framework (`base.css`, `layout.css`, `animations.css`, `components.css`).
- **Vanilla JavaScript (ES Modules):** Centralized state management (`state.js`) with pub/sub architecture.
- **Node.js (for testing):** Native `assert` module used for unit testing.
- **Docker & Nginx:** Containerized for production deployment, serving static assets with gzip and caching headers.

## 📂 Project Structure

```
.
├── Dockerfile              # Production Docker image configuration
├── nginx.conf              # Nginx server configuration
├── package.json            # Node.js config for testing
├── public/                 # Static web assets
│   ├── index.html          # Main application entry point
│   ├── css/                # Custom CSS framework and styling
│   └── js/
│       ├── api/            # API integrations (Weather, Geocoding, Flights, Hotels)
│       ├── engine/         # Core logic (Parser, Generator, Budget, Replanner, Activities)
│       ├── ui/             # UI renderers (Form, Itinerary, Alerts, Loader)
│       ├── utils/          # Utilities (Date, Currency, Storage, Sanitize)
│       ├── main.js         # Application bootstrap and wiring
│       └── state.js        # Reactive state store
└── tests/                  # Unit tests for core engine logic
```

## 🚀 Getting Started

### Running Locally (Development)

Since the app uses native ES modules, you must serve it via a local HTTP server (opening `file://` will block CORS and ES modules).

1. Using Python:
   ```bash
   cd public
   python3 -m http.server 8080
   ```
2. Open `http://localhost:8080` in your browser.

### Running Tests

Unit tests are written using Node.js native assert module. Ensure Node is installed, then run:

```bash
npm test
```

## ☁️ Deployment

The app is containerized using Nginx and Docker, making it perfectly suited for **Google Cloud Run**.

1. Authenticate with Google Cloud:
   ```bash
   gcloud auth login
   gcloud config set project your-project-id
   ```
2. Deploy directly via source:
   ```bash
   gcloud run deploy waypoint-travel-engine \
     --source . \
     --platform managed \
     --allow-unauthenticated \
     --port 8080
   ```

## 🛡️ Security & Performance

- **XSS Prevention:** All user inputs (e.g., custom city names) are escaped via a custom `sanitize.js` utility before being injected into the DOM.
- **Performance:** Implements `preconnect` tags for external APIs to reduce latency. Caches weather data heavily in `localStorage` with a TTL to prevent API rate limiting. Nginx serves assets compressed and heavily cached.

## 📄 License

MIT License
