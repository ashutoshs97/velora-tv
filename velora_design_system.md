# Velora Design System: Prime Video Architecture

## 1. Design Philosophy & Aesthetic
The goal of this design system is to replicate the premium, immersive, and content-forward aesthetic of Prime Video for Velora. The interface relies on a heavy dark mode, edge-to-edge imagery, and horizontal "swimlane" carousels. The focus is always on the artwork, with UI elements remaining subtle until interacted with.

---

## 2. Color Palette (The "Prime" Theme)
To achieve the exact look and feel, use these specific hex codes. They map to a deep, cool-toned dark mode rather than a pure black layout.

### Backgrounds
* **Base Background (Space):** `#0F171E` - The primary background color for the entire application body.
* **Secondary Background (Squid Ink):** `#1A242F` - Used for dropdown menus, modal backgrounds, and search bar interiors.
* **Card Hover State:** `#252E39` - Subtle lightening for interactive elements.

### Accents & Actions
* **Primary Accent (Prime Blue):** `#00A8E1` - Used for the active navigation state, progress bars, and primary text links.
* **Play Button (Solid):** `#FFFFFF` (White background with black `#000000` play icon) - Draws immediate attention against the dark background.
* **Secondary Button:** `rgba(255, 255, 255, 0.2)` - Semi-transparent white for "Add to Watchlist" or "More Info" buttons.

### Typography Colors
* **Primary Text:** `#FFFFFF` - Headings, titles, and active nav items.
* **Secondary Text:** `#8197A4` - Synopses, metadata (Year, Rating, Runtime), and inactive nav items.

---

## 3. Typography
Prime Video uses Amazon Ember, a proprietary font. For Velora, the closest, high-quality open-source alternatives are **Inter** or **Roboto**.

* **Font Family:** `'Inter', sans-serif`
* **Hero Title (H1):** 48px to 64px, Font Weight: 800 (Extra Bold), Tracking: Tight (`-0.02em`).
* **Section Headers (H2):** 20px to 24px, Font Weight: 700 (Bold), Margin Bottom: 12px.
* **Body/Synopsis:** 16px, Font Weight: 400 (Regular), Line Height: 1.5.
* **Metadata (Tags):** 14px, Font Weight: 600 (Semi-Bold), Uppercase for ratings (e.g., U/A 16+).

---

## 4. Core Layout Components

### A. Global Navigation (The Header)
* **Position:** Fixed at the top (`position: fixed; z-index: 50; w-full`).
* **Background:** Starts completely transparent over the Hero banner. As the user scrolls, it transitions to a solid `#0F171E` with a blur effect (`backdrop-blur-md`).
* **Structure:**
    * *Left:* Velora Logo (White text, optionally with a Prime Blue dot/accent).
    * *Center:* Navigation Links (Home, Movies, TV Shows, Categories). Active link has a bottom border: `border-b-2 border-[#00A8E1]`.
    * *Right:* Search Icon (magnifying glass), User Avatar (circular, 32x32).

### B. The Hero Billboard (Featured Movie)
This is the most critical element for the premium feel. It occupies the top 70-80% of the viewport height (`min-h-[70vh]`).
* **Background:** Edge-to-edge high-resolution backdrop fetched from TMDB.
* **The Gradient Masks (Crucial):** You MUST apply CSS gradients over the image so the text is readable and the image fades seamlessly into the background below it.
    * *Left to Right Mask:* `linear-gradient(to right, #0F171E 0%, transparent 50%)`
    * *Bottom to Top Mask:* `linear-gradient(to top, #0F171E 0%, transparent 30%)`
* **Content Container:** Positioned absolutely, bottom-left (`left-12 bottom-12 w-1/3`).
* **Elements:**
    * Movie Logo (if available via TMDB) or H1 Title.
    * Metadata Row: [Prime Blue Checkmark] "Included with Velora" | 2023 | 2h 15m | 4K UHD.
    * Action Row: Huge white "Play" button, followed by circular semi-transparent buttons for "Watchlist" and "Share".

### C. The Swimlanes (Content Carousels)
* **Spacing:** 40px vertical margin between swimlanes (`mb-10`).
* **Aspect Ratios:**
    * *Standard Movies:* 16:9 (Landscape thumbnails).
    * *Originals/Featured:* 2:3 (Vertical poster format).
* **Card Design:**
    * Border radius: `rounded-md` (4px to 6px).
    * **Premium Glass Boundary:** Use a translucent inner border `border: 1px solid rgba(255,255,255,0.05)` and inner box-shadow `inset 0 0 0 1px rgba(255,255,255,0.03)` to mimic high-end tvOS elements.
    * No text under the card by default; rely entirely on the poster artwork.

### D. Server Aggregation & Redundancy
Velora utilizes a sophisticated multi-server load-balancing matrix tailored for 2025 open-source REST/Iframe endpoints. 
* **The 8-Tier Stack:** The default active array includes `VidSrc PRO`, `VidBinge`, `VidLink`, `VidSrc CC`, `XPrime`, `SmashyStream`, `AutoEmbed`, and `FilmKu`.
* **Iframe Configuration:** Crucially, the video player `<iframe>` must **not** use `sandbox` attributes, as third-party providers will detect the sandboxing and block the video feed.
* **Ad-Block UI:** The server UI must explicitly warn the user to utilize an ad-blocker (like `uBlock Origin`) via a yellow `AlertCircle` hint.

---

## 5. Micro-Interactions & Animations

### The "Prime" Hover Card Effect
When a user hovers over a movie card in a swimlane, Prime Video does not just scale the image; it expands the card to show a mini-trailer and metadata.

* **Implementation Strategy for Velora:**
    1.  **Delay:** Add a 500ms delay before expansion (`transition-delay: 500ms`). This prevents flickering when the user moves their mouse quickly across the screen.
    2.  **Scale & Elevate:** Scale the card to `1.25` (`scale-125`) and increase the z-index so it overlaps neighboring cards.
    3.  **Glow Activation:** Increase the inner border brightness to `rgba(255,255,255,0.15)` and add a heavy outer colored drop shadow `0 0 30px rgba(0, 168, 225, 0.15)`.
    4.  **Reveal Metadata:** Slide up a dark gradient overlay containing the movie title, a small "Play" button, and the synopsis.

---

## 6. The Watch Page (Aggregator View)
When the user clicks play and navigates to the video player, replicate the "X-Ray" layout.

* **Layout:**
    * Top 80% of the screen: The `MultiSourceAggregator` component (The video iframe).
    * Bottom 20% / Scrollable area below player: Tabbed interface.
* **Tabs:**
    * *Related:* More movies like this (TMDB similar endpoint).
    * *Details:* Full synopsis, director, studio.
    * *Cast & Crew:* Circular headshots of actors fetched from TMDB.
* **Player Wrapping:** Keep the area immediately surrounding the iframe pitch black to eliminate distractions, only showing the server switcher below it using the dark `#1A242F` squid ink color.

---

## 7. Tailwind CSS Quick Reference Guide
Use these utility classes to rapidly build the Velora components:

* **Body Background:** `bg-[#0F171E] text-white font-sans antialiased`
* **Nav Active Link:** `text-white font-bold border-b-2 border-[#00A8E1] pb-1`
* **Nav Inactive Link:** `text-[#8197A4] hover:text-white transition-colors`
* **Primary Play Button:** `bg-white text-black font-bold flex items-center px-8 py-3 rounded hover:bg-gray-200 transition`
* **Secondary Button:** `bg-white/20 text-white p-3 rounded-full hover:bg-white/30 backdrop-blur-sm`
* **Hero Title Tracking:** `tracking-[-0.03em] leading-[1.05]` to make text grip the screen powerfully.
* **Hero Gradient Overlay (Trifecta):** 
  - `bg-hero-gradient-x opacity-90`
  - `bg-hero-gradient-y`
  - `bg-gradient-to-b from-[#0F171E]/90 to-transparent` (The top vignette).
* **Card Scroll Entrance:** Utilize `@keyframes fadeUp` mapped to a `.animate-fade-up` utility class for cascading swimlanes.
