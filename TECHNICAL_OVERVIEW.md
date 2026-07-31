# eGuide: Technical Overview & Architecture Guide

This document provides a plain-language explanation of how the eGuide transit application works under the hood. It is designed to help you study the system's architecture, confidently explain the technical decisions made, and answer questions about the implementation.

---

## 1. Project Overview

**eGuide** is a comprehensive, interactive transit map covering the Philippines. It unifies multiple disparate modes of transportation into a single, cohesive interface. The application maps:
- **Buses** (e.g., BGC Bus lines, EDSA Carousel)
- **Trains** (LRT-1, LRT-2, MRT-3, MRT-7, PNR)
- **Airports & Seaports** (Major hubs across the country)
- **Live Aircraft** (Real-time tracking of flights overhead)

The core mapping technology is powered by **Leaflet** (via React-Leaflet), providing a highly responsive, layered map interface that dynamically updates based on user interaction.

---

## 2. Bus Routes & Road Following (OSRM)

Unlike trains, buses travel on complex public road networks. Drawing a straight line between two bus stops doesn't accurately represent the actual route the bus takes.

To solve this, the app uses **OSRM (Open Source Routing Machine)**. 
- **What is OSRM?** It is a high-performance routing engine designed to run on data from the OpenStreetMap (OSM) project. We use a public OSRM API endpoint to calculate the driving route between bus stations.
- **How it works:** Instead of just drawing a line from Station A to Station B, the app sends the coordinates of Station A and Station B to OSRM. OSRM calculates the actual driving path (following streets, highways, and one-way rules) and returns a detailed "polyline" (a complex shape made of hundreds of tiny coordinates) that the map renders.
- **Why we use Waypoints:** Sometimes, OSRM chooses the "fastest" route, which might not be the actual path a specific bus takes (e.g., a bus might take a specific slower avenue). To force OSRM to draw the correct route, we feed it intermediate "waypoints" (invisible coordinates between stations) to anchor the route to the exact streets the bus travels on, preventing looping or zigzag artifacts.

---

## 3. Rail Lines

Trains travel on fixed, dedicated infrastructure (elevated tracks or underground tunnels) rather than weaving through public road traffic. 

For rail lines (LRT, MRT, PNR), the app uses **Schematic Line Segments**. We simply render straight, direct lines connecting the coordinates of each station. Because trains cannot deviate from their tracks, there is no need to query a routing engine like OSRM. This keeps the application incredibly fast and lightweight.

---

## 4. Airports and Seaports

The Airports and Seaports layers are **Static Point-Marker Layers**.
- The coordinates for these major transit hubs were manually sourced and cross-referenced against real-world aviation (ICAO/IATA) and maritime data to ensure precision.
- They are stored locally in the codebase as structured JSON/JavaScript arrays and rendered onto the map as toggleable layers, meaning they require zero external API calls to render.

---

## 5. Live Aircraft Tracking (The Complex Layer)

The most advanced feature in the app is the real-time tracking of aircraft.

### What are OpenSky and ADS-B?
Modern aircraft broadcast their GPS position, altitude, and speed via a radio signal called **ADS-B (Automatic Dependent Surveillance–Broadcast)**. The **OpenSky Network** is a non-profit organization that crowd-sources these radio signals using a global network of ground receivers, aggregating them into an API that developers can query.

### Authentication & Token Caching
OpenSky requires an **OAuth2 client credentials flow** for authenticated access. 
- **How it works:** The app exchanges a `CLIENT_ID` and `CLIENT_SECRET` for a temporary "Bearer Token" (valid for about 30 minutes).
- **Why we cache it:** Requesting a new token every time a user opens the map would quickly trigger rate limits. Instead, our backend securely exchanges the credentials once, holds the token in server memory (caching), and reuses it for all subsequent requests until it is near expiration.

### The Backend Proxy (`/api/flights`)
We NEVER call the OpenSky API directly from the user's browser. Instead, the browser calls our own Next.js API route (`/api/flights`), which then talks to OpenSky. 
- **Protecting Credentials:** If the browser called OpenSky, the Bearer token would be visible to anyone inspecting the network tab.
- **Bypassing CORS:** Browsers block direct API calls to third-party domains that don't explicitly allow it (CORS). The server bypasses this.
- **Data Reduction:** OpenSky returns a massive global dataset. Our proxy filters the data to a strict Philippine "Bounding Box" (specific latitude/longitude boundaries) before sending it to the client, drastically reducing bandwidth and improving frontend performance.

### Altitude & Proximity Filtering Concept
*(Note: Designed to isolate relevant transit data)*
To ensure the map isn't cluttered with international flights merely cruising at 35,000 feet over the Philippines en route to Australia or Japan, the architectural concept involves filtering planes based on altitude (e.g., below 10,000 feet) and proximity to known airports. This ensures the map highlights actionable, local transit (takeoffs and landings) rather than high-altitude overflights.

### Route Lookup (`adsbdb.com`)
When a user clicks on an aircraft, we want to know where it's going. We use a secondary, free, and unauthenticated API called **adsbdb.com**.
- We take the aircraft's `Callsign` (e.g., "PAL123") and query adsbdb.
- It returns the Origin airport, Destination airport, and Airline name. Because this is unauthenticated and safe, it is called directly from the client.

### ETA Calculation (The Math)
To tell the user when a flight will arrive, we combine three data sources:
1. **Departure Times:** We query OpenSky's `/flights/aircraft` endpoint to find when the plane first appeared on radar (`firstSeen`).
2. **Haversine Distance:** We take the plane's exact live GPS coordinates (from OpenSky) and the Destination airport's exact coordinates (from adsbdb), and use the mathematical "Haversine formula" to calculate the remaining "great-circle" distance (the shortest path over the curvature of the Earth).
3. **Estimated Arrival:** We divide that remaining distance by the plane's live velocity to get the remaining seconds of flight time. We add that to the current time to display a dynamic ETA. 
*(Why it's an estimate: Planes rarely fly in perfectly straight lines due to weather, air traffic control, and approach patterns, but great-circle math provides a very close approximation).*

### Rate Limiting & On-Demand Execution
To strictly respect API rate limits, the heavy lookups (Routes and ETAs) **only execute when a user explicitly clicks a specific plane's popup**. Furthermore, the results are stored in an in-memory Map cache on the frontend. If a user clicks the same plane 10 times, the API is only queried once.

---

## 6. Map Controls & Navigation

The user interface revolves around a gesture-driven Map Controls panel (or dropdowns on desktop).
- **Categories:** Users can toggle entire categories on or off (e.g., turning off all "Trains").
- **Specific Lines:** Users can drill down and select a specific route (e.g., "MRT-3"). 
- **Dynamic Highlighting:** When a specific line is selected via the map controls or the home page quick-links (via URL query parameters like `?mode=trains`), the map dynamically dims unrelated routes and smoothly pans/zooms to center the selected transit line, utilizing Leaflet's bounds calculation.

---

## 7. Common Challenges & Technical Fixes

Throughout development, several notable technical hurdles were overcome:

1. **OSRM Zigzag / Loop Artifacts**
   - *Problem:* When calculating BGC bus routes, OSRM sometimes generated chaotic loops or zigzagged down incorrect side streets because it was trying to find the mathematically "fastest" route between two distant stops.
   - *Fix:* We manually introduced "anchor waypoints" along specific avenues (like 5th Ave or McKinley Pkwy). By forcing the router through these exact intersections, OSRM generated clean, highly accurate road-following polylines without loops.

2. **Loop Route Station Ordering**
   - *Problem:* For circular routes (like certain BGC buses), determining the "start" and "end" of the line caused mapping engines to draw lines cutting directly across the circle to connect the last station back to the first.
   - *Fix:* The route arrays were carefully structured sequentially, and OSRM was instructed to follow the exact array order linearly, ensuring the polygon correctly wrapped around the physical road loop.

3. **Z-Index and Icon Distinctions**
   - *Problem:* Differentiating between stationary infrastructure (stations) and moving entities (live aircraft or buses) was visually confusing.
   - *Fix:* We separated the layers. Stations use standard circular markers, while Live Aircraft use custom Leaflet `DivIcons` containing SVG graphics. These SVGs are mathematically rotated via CSS (`transform: rotate(Xdeg)`) to point in their actual physical heading (`true_track`), and given dynamic drop-shadows to visually float above the map layer.

4. **React 'useEffect' Synchronization**
   - *Problem:* Firing HTTP requests inside React effects without proper cleanup caused memory leaks and duplicate API calls when components mounted and unmounted rapidly.
   - *Fix:* Implemented robust cleanup functions (e.g., `clearInterval`) and boolean mounting flags (`let mounted = true`) in the popup components to ensure asynchronous fetch promises are aborted safely if the user closes the popup before the data arrives.
