markdown_content = """# System Context & Architecture Spec: Local Movie Streaming Aggregator

## 1. Project Overview
**Name:** Velora
**Type:** Academic Major Project (College Level)
**Objective:** Build a high-fidelity, local web application that functions as a movie streaming aggregator. The platform will not host video files locally. Instead, it will act as a bridge, utilizing the **TMDB API** for movie metadata and **third-party aggregator APIs** (e.g., vidsrc) to inject video streams via iframes.
**Core Differentiator:** Multi-server redundancy. If one streaming server fails to load due to CORS or 404 errors, the user can seamlessly switch to a backup server via the UI.

---

## 2. Tech Stack
* **Frontend:** React.js (via Vite) or Next.js
* **Styling:** Tailwind CSS, Lucide React (for icons)
* **Backend:** Node.js, Express.js
* **Database:** MongoDB (using Mongoose)
* **External APIs:** * TMDB API (The Movie Database) - For posters, synopses, and IDs.
  * Aggregator APIs (vidsrc.to, vidsrc.me, 2embed, etc.) - For video playback.

---

## 3. UI/UX Design System
* **Theme:** Cinematic Dark Mode
* **Backgrounds:** Primary: `#111827` (gray-900), Secondary: `#1F2937` (gray-800)
* **Accents:** Vibrant Blue `#3B82F6` (for play buttons, active states, focus rings)
* **Typography:** Inter or Roboto (Clean, sans-serif)
* **Components:** High-utility, functional design. Emphasize responsive grids for movie posters and a pristine `aspect-video` container for the video player.

---

## 4. Core Features & Workflows

### A. Movie Discovery & Metadata
1. User searches for a movie via the UI.
2. Backend calls the TMDB search API.
3. Frontend renders the results in a grid (Posters, Titles, Year).

### B. The Aggregator Player (Crucial)
1. User clicks on a movie (e.g., *Inception*, TMDB ID: `27205`).
2. The `MultiSourceAggregator` component mounts.
3. The component possesses an array of server configurations:
   - Server 1: `https://vidsrc.to/embed/movie/{tmdbId}`
   - Server 2: `https://vidsrc.me/embed/movie?tmdb={tmdbId}`
   - Server 3: `https://multiembed.mov/directstream.php?video_id={tmdbId}&tmdb=1`
4. The video loads in an `iframe`. 
5. **Redundancy:** If the iframe fails to play, the user clicks "Server 2", updating the state, forcefully re-rendering the iframe using React `key` props, and loading the new source.

### C. Watch History & State Management
1. When a user watches a movie, its TMDB ID and metadata are saved to the local MongoDB database under their user profile.
2. A "Recently Watched" carousel populates on the home page based on DB queries.

---

## 5. Database Schema (MongoDB / Mongoose)