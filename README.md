# eGuide: Gabay mo, saan ka man patungo. 🚇 🚍
> **eGov2026 Hackathon | Team eGovibes**

**eGuide** is a unified transit tracking and scan-to-pay mobile platform designed as a Progressive Web App (PWA) for Metro Manila commuters. It replaces the guesswork in commuting with certainty, powered by the **eGovPH ecosystem**.

---

## 👥 The Team: eGovibes
* **Justin Gabriel Jose** - Project Lead / Backend Dev
* **Antonio Rene Casison** - Frontend Dev / UI-UX
* **VJ Evangelista** - Research / Brand / Presenter
* **Mark Kenneth Galario** - Planning / Developer
* **Denisse Jane Karim** - Coordinator / Pitch / Presenter

*(2nd Year IT Students — PUP Sta. Mesa)*

---

## ⚠️ The Problem
The Philippines' mobility challenge is no longer traffic alone—it is **unpredictability**. Commuters cannot reliably estimate travel time, vehicle arrivals, transport costs, or even how crowded a ride will be. The absence of a unified platform across LRT-1, LRT-2, MRT-3, P2P buses, and the EDSA Carousel forces commuters to rely on fragmented sources—or travel without reliable information altogether.

* **The Scale**: MRT-3 served 135M+ riders last year. LRT-2 reached over 208,000 riders in a single day. The EDSA Carousel moved 10M+ in two months.
* **The Impact**: 72% of commuters say daily commute harms their work-life balance. Metro Manila loses an estimated **₱3.5 billion daily** in productivity due to unreliable mobility.

## 💡 Our Solution
eGuide brings all transit modes into a single app using the **eGovPH API Ecosystem**:
1. **eGovPH SSO & eVerify**: Single sign-on and mandatory eKYC verification to link your National ID.
2. **eGovAI Transit Assistant**: Smart assistant to answer queries like *"Puno ba MRT Cubao?"*
3. **eGovPay (Scan-to-Pay)**: Generate a National ID-linked QR code to pay at turnstiles instantly, or remotely reload Beep cards.
4. **Live Map**: Real-time vehicle tracking overlaid on custom map tiles.
5. **eMessage SMS Receipts**: Receive an instant SMS e-Ticket and digital receipt straight to your phone when you scan to pay.

## 📈 Impact, Value & Cost-Benefit
* **Impact**: Turns commuting from guesswork into certainty. Juan checks the app and *knows* the Carousel is 8 minutes away.
* **Value**: Commuters save time and gain peace of mind. Government agencies (LRTA, MRT-3, DOTr) receive a unified data layer instead of fragmented systems—a true working example of eGovPH interoperability.
* **Cost-Benefit**: Shared infrastructure is significantly cheaper than each agency building and maintaining separate apps.

---

## 🛠️ Technical Architecture & Implementation
While initially planned as a native Android app, we pivoted to a **Progressive Web App (PWA)** to ensure cross-platform compatibility (iOS, Android, Web) within the strict 7.5-hour hackathon sprint.

### Tech Stack
* **Core**: Next.js 16 (App Router) + React 19 + TypeScript
* **PWA Engine**: `@ducanh2912/next-pwa`
* **Geospatial**: `Leaflet` / `react-leaflet` for map overlays.
* **Middleware (Backend)**: Node.js (Next.js API Routes) acting as an orchestration layer for eGov APIs.

### The Simulated Data Engine (Project LIGTAS)
To guarantee a flawless demo without the risk of live GPS hardware failure during the pitch, our Next.js backend uses a simulated data engine.
* We mapped real-world route coordinates and historical congestion patterns directly from **Project LIGTAS**.
* The server acts as an intermediary, simulating live movement.
* **Scalability**: The architecture is fully modular—swapping the mock streams for live agency WebSocket feeds in production requires zero frontend rewrites.

---

## 🏆 Q&A Reviewer (For Judges)
**Q: Why use mock data instead of live GPS tracking for this demo?**
A: In a hackathon setting, relying on live external hardware introduces high failure risks. We built a Simulation Engine using verified datasets from Project LIGTAS. The architecture is fully prepared to swap these simulated streams with live WebSocket data in production.

**Q: How is user data secured, especially since it involves the National ID?**
A: We don't store or process sensitive identity data on our database. Authentication is handled entirely by the official eGovPH SSO and eVerify APIs. Our Next.js backend serves as a secure proxy layer.

**Q: How will this app be adopted by non-tech-savvy commuters?**
A: We designed the UI to be highly intuitive with a simple 5-tab bottom navigation. Paying for transit is a single-tap QR code generator, eliminating the physical barrier of waiting in ticket lines.

---
*“eGuide: Gabay mo, saan ka man patungo.”*
