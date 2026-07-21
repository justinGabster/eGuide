# Goal Description
Implementation Plan for "eGuide", an Android mobile application designed for Metro Manila commuters, submitted for the eGov2026 Hackathon. The app features live track viewing, proximity alerts, remote card reloading, AI transit assistance, crowd density prediction, and one-tap mobile fare payment.

## User Review Required
> [!IMPORTANT]
> Please review the proposed architecture, member responsibilities, and demo strategy below. Let me know if you would like to adjust any of the timelines, tech stack choices, or presentation angles. Once approved, we can begin setting up the Android project, backend repository, and initial code structures.

## 1. Android Architecture & API Blueprint

### Frontend (Android Native / Kotlin)
- **UI Architecture:** MVVM (Model-View-ViewModel) for clean separation of UI and business logic.
- **Login & Onboarding:**
  - **Login Page:** The first screen users see. Utilizes **eGovPH API** for Single Sign-On (SSO) authentication.
  - **eKYC Verification:** Immediately follows login. Integrates **eVerify API** to ensure mandatory identity verification before transit features unlock.
- **Header:**
  - **Profile/Settings:** Fetches and displays verified status and National ID (retrieved from the login/eKYC flow).
- **Bottom Navigation (5 Tabs):**
  - **[Home]:** Quick stats, AI assistant widget (powered by **eGovAI API**).
  - **[Payment]:** Scan-to-pay QR code generator linked to **eGovPay API** for seamless mobile fare payment on Metro Manila transit. Remote Beep card reloading interface.
  - **[Map]:** Custom styled **Google Maps API** fragment. Overlays for MRT/LRT/EDSA Carousel routes. Renders live vehicle locations and "Puno Na-Bayan?" crowd indicators (**eGovAI API** predictive engine).
  - **[Notifications]:** SMS alert preferences handled by **eMessage API** (5-10 min proximity alerts).
  - **[Transactions]:** Live receipt logs and digital wallet ledgers retrieved from **eGovPay API**.

### Backend (Node.js / Express)
- **API Orchestration Layer:** Acts as a middleware between the Android app and eGov APIs. Validates requests and shapes data for the mobile client.
- **WebSockets:** Real-time location and occupancy updates pushed to Android clients continuously.
- **Mock Data Engine:** Simulates GPS streams, fare deductions, and crowd density for the live demo.

## 2. Member-by-Member Action Plan (7.5-Hour Overnight Sprint)

> [!WARNING]
> Timeline is strictly compressed for a 5:30 AM submission deadline.

### Justin (Project Lead / Backend Developer)
- **10:00 PM - 12:00 AM:** Initialize backend (Node.js/Express). Connect to eGovPH, eVerify (eKYC), and eGovPay APIs.
- **12:00 AM - 02:00 AM:** Implement WebSockets for tracking and hook up eMessage API.
- **02:00 AM - 04:00 AM:** Finalize scan-to-pay transaction endpoints. Integrate the mocked LIGTAS data into the API responses.
- **04:00 AM - 05:30 AM:** Deployment, final endpoint testing with Antonio, and repository freeze.

### Kenneth (Idea & Planning / Developer)
- **10:00 PM - 12:00 AM:** Map out the exact JSON schemas needed for the app based on the Project LIGTAS datasets.
- **12:00 AM - 02:00 AM:** Format the LIGTAS data into mock API responses (GPS routes, crowding metrics).
- **02:00 AM - 04:00 AM:** Write the eKYC validation flow logic and assist Justin with the eGovAI predictive integration.
- **04:00 AM - 05:30 AM:** End-to-end system testing, verifying all simulated flows for the demo.

### VJ (Research / Brand / Presenter)
- **10:00 PM - 12:00 AM:** Finalize "eGuide" logo, color palette, and export assets for Antonio.
- **12:00 AM - 02:00 AM:** Refine the localized tone for the app and draft the initial pitch script.
- **02:00 AM - 04:00 AM:** Work with Dennise on refining the pitch narrative around eKYC and cashless transit.
- **04:00 AM - 05:30 AM:** Final presentation rehearsal and recording/prep.

### Antonio (Frontend Developer / UI/UX Designer)
- **10:00 PM - 12:00 AM:** Set up Android Studio project (Kotlin/MVVM). Build the eKYC Onboarding screen and Header.
- **12:00 AM - 02:00 AM:** Implement the 5 Bottom Tabs and the QR generator UI on the Payment tab.
- **02:00 AM - 04:00 AM:** Integrate Google Maps API. Render the map overlays and "Puno Na-Bayan?" UI markers.
- **04:00 AM - 05:30 AM:** Connect UI to Justin's backend. Bug fixing and UI polish for the demo recording.

### Dennise (Project Coordinator / Pitch / Presenter)
- **10:00 PM - 12:00 AM:** Create the slide deck skeleton and ensure all hackathon submission criteria are met.
- **12:00 AM - 02:00 AM:** Populate the pitch deck with market data (LIGTAS insights, eGov2026 themes).
- **02:00 AM - 04:00 AM:** Polish the slides and finalize the citizen impact metrics.
- **04:00 AM - 05:30 AM:** Co-rehearse with VJ and organize the final submission package (code, video, deck) before 5:30 AM.

## 3. Simulated Data & Demo Strategy (Powered by Project LIGTAS Data)

> [!TIP]
> For a flawless hackathon demo, relying on mocked, predictable data is safer and more impactful than hoping live external APIs or GPS signals perform perfectly under pressure.

- **Data Source:** All simulated data (GPS coordinates, headway tracking, and historical congestion timelines) will be explicitly derived from the **Project LIGTAS datasets**.
- **GPS Location Mocking:** Use LIGTAS route data to generate static JSON coordinate paths for the EDSA Carousel and LRT/MRT lines. The backend will emit these over WebSockets at intervals to simulate real-time movement on the Android Map tab.
- **"Puno Na-Bayan?" Simulation:** Hardcode the crowd density logic based on LIGTAS's 0-10 crowding scale. For example, trigger a 🔴 *Sardines Mode* status as the train hits the Cubao station pin.
- **QR Validation (eGovPay) & eKYC:** Create a mock validator web view for the scan-to-pay demo. For the onboarding demo, show a seamless eKYC flow that instantly verifies the user using the mocked backend.

## 4. Hackathon Pitch & Storytelling Alignment

- **The Hook:** Start with the daily struggle of a Metro Manila commuter—uncertain waiting times, crowded trains, and the hassle of physical Beep card top-ups.
- **The Inspiration:** Briefly mention the benchmarks (Singapore LTA, Project LIGTAS) to establish credibility. "We looked at world-class systems and localized them for the Filipino commuter."
- **The Core Value (eGov2026 Theme):** Emphasize how "eGuide" leverages the *entire* eGov API ecosystem (eGovPH, eVerify, eGovPay, eMessage, eGovAI) to create a unified, seamless government digital infrastructure.
- **The "Wow" Moments:**
  1.  **Puno Na-Bayan?:** Highlight how this reduces commuter anxiety by providing predictive, actionable insights.
  2.  **Mobile Scan-to-Pay:** Demonstrate the National ID-linked transit QR code, positioning it as the future of cashless Metro Manila transit, eliminating lines at ticketing booths.
- **The Impact:** Conclude with the broader impact: reduced congestion, data-driven transit management, and a modernized, world-class commuting experience for the National Capital Region.
