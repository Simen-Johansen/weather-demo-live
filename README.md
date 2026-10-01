# Hamar Weather Forecast - Tomorrow's Outlook

A responsive web application that fetches and displays tomorrow's weather forecast for **Hamar, Norway** using the official **MET Norway (Meteorologisk institutt) Locationforecast 2.0 API**.

## Features

- **Tomorrow's Dynamic Date Detection**: Automatically filters the API timeseries to pinpoint tomorrow's full 24-hour timeline.
- **Hero Forecast Overview**:
  - High & low temperatures
  - Midday representative conditions & animated SVG weather iconography
  - Total rain accumulation (mm)
  - Maximum wind speed (m/s)
  - Average cloud cover percentage and atmospheric pressure (hPa)
- **4 Day Quarters Breakdown**:
  - Night (00:00 – 06:00)
  - Morning (06:00 – 12:00)
  - Afternoon (12:00 – 18:00)
  - Evening (18:00 – 24:00)
- **Interactive 24-Hour Timeline**:
  - Hour-by-hour scrollable card strip
  - Interactive "Selected Time Inspector" showing granular details (wind direction with rotating compass needle, humidity, precipitation, cloudiness)
- **Unit Toggle**: Instant switching between Celsius (°C) and Fahrenheit (°F).
- **MET Norway Compliance & Attribution**:
  - Uses Locationforecast 2.0 for coordinates `60.7945° N, 11.0679° E` (Hamar)
  - Compliant with MET Norway terms of service and NLOD / CC BY 4.0 licensing.
- **Graceful Fallback**: Includes realistic cached data fallback in case of direct CORS or rate limit restrictions.

## How to Run

1. Open a terminal in this directory:
   ```bash
   cd weather-demo-live
   ```
2. Start the local server:
   ```bash
   python -m http.server 8080
   ```
   *or with Node.js / npx:*
   ```bash
   npx serve .
   ```
3. Open your browser and navigate to:
   [http://localhost:8080](http://localhost:8080)
