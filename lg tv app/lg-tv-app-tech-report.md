# LG TV App Tech Report for VeloraTV

This report analyzes the technology, architecture, workflow, and publishing requirements needed to launch an LG TV app for **veloratv.in**, assuming you want to create the app UI in Antigravity and then ship it to the LG Content Store.[web:8][page:1][page:2]

## 1. Direct answer

To publish an app on the LG TV app store, you should plan for a **webOS TV web app**, not a typical Android/iOS app.[page:1] LG’s webOS TV platform supports app development with standard web technologies such as **HTML, CSS, and JavaScript**, and LG provides tooling through webOS CLI / Studio, simulator support, device testing, packaging into `.ipk`, and submission through LG Seller Lounge.[page:1][page:2]

For VeloraTV, the best-fit stack is a **hosted webOS TV app shell** that loads or orchestrates your streaming/catalog experience from your existing backend, while still being optimized for TV remote navigation, large-screen performance, and LG review requirements.[page:1][web:8]

## 2. What LG expects technically

LG’s official getting-started flow for webOS TV requires you to create a web app, assign an app id/title/version, package it with `ares-package`, install it onto a TV in Developer Mode, and launch it on the simulator or device for validation.[page:1] LG also exposes an ecosystem that includes developer guides, tools, references, app approval information, a self-checklist, Seller Lounge, and the LG Content Store submission path.[page:2]

That means your deliverable for store publishing is not just UI screens from Antigravity.[page:2] You need a complete app package with app metadata, manifest/config, remote-friendly navigation behavior, store assets, testing evidence, and a submission-ready `.ipk` build.[page:1][web:11][web:15]

## 3. Best app model for VeloraTV

Because VeloraTV already exists as a live-streaming/video platform, your LG app should likely be a **TV-first client** connected to your current web services rather than a fully separate product.[web:8] LG’s documentation explicitly notes that if you need continuous updates, a **hosted web app** is a good choice.[page:1]

### Recommended architecture

| Layer | What you should build | Why it matters |
|---|---|---|
| TV frontend | webOS TV web app built with HTML/CSS/JavaScript, optionally using a lightweight framework | This is the app type LG documents for webOS TV.[page:1] |
| App shell | Home, browse, search, player launcher, account/session flow, settings | LG store submission needs a real packaged TV app, not only a website.[page:1][web:11] |
| Content API | Existing VeloraTV APIs for catalog, streams, thumbnails, categories, search, user state | Reuse your current service backbone instead of rebuilding the platform.[web:8] |
| Video delivery | HLS/DASH streams, CDN, poster assets, fallback/error handling | Streaming quality and device compatibility will define TV usability.[web:8] |
| Admin/content ops | Existing CMS or media backend | Prevents app-side content hardcoding and speeds iteration.[page:1] |
| Submission assets | Icons, screenshots, descriptions, test credentials, policy details | Seller Lounge submission requires file upload, images, service info, and test info.[web:11][web:15] |

### Why hosted web app is the strongest option

A hosted approach keeps most product changes on your server side, which reduces friction for ongoing content and interface updates.[page:1] For a streaming brand like VeloraTV, that is usually more practical than shipping every content or UI tweak as a full app repackage, although major app-shell changes will still need testing and possibly resubmission depending on how you implement them.[page:1][page:2]

## 4. Tech stack you actually need

### Core stack

The minimum technical stack is:

- **HTML5** for structure.[page:1]
- **CSS** for TV-safe, 10-foot UI styling.[page:1]
- **JavaScript** for routing, focus handling, playback integration, API calls, and app lifecycle logic.[page:1]
- **webOS CLI / webOS Studio** for app generation, packaging, device install, and launch.[page:1]
- **LG TV Simulator + real LG TV testing** for pre-submission validation.[page:1]

### Suggested production stack for your case

| Area | Recommendation | Notes |
|---|---|---|
| Frontend framework | Vanilla JS or React with a very lean build | Keep performance and memory usage controlled on TV hardware.[page:1] |
| UI generation | Antigravity for screen generation and scaffolding | Useful for speed, but you still need manual TV adaptation and webOS packaging.[web:3][web:5] |
| State/data | Simple client state + REST APIs | Enough for catalog, profile, resume watch, and search if your backend already exists.[web:8] |
| Video playback | Use web video playback compatible with webOS TV and your streaming format | Must be tested on real LG TVs for playback reliability.[page:1] |
| Build/package | webOS CLI (`ares-generate`, `ares-package`, `ares-install`, `ares-launch`) | This is the official flow shown by LG.[page:1] |
| QA | Simulator first, then physical TV in Developer Mode | LG explicitly documents both paths.[page:1] |
| Release ops | Seller Lounge account + app metadata pipeline | Required for final submission.[page:2][web:7] |

### What not to rely on

Do not assume a normal responsive website is enough for LG TV publishing.[page:2] Even if veloratv.in already works in a browser, LG store submission still expects an installable webOS TV app with TV navigation, packaging, and review-ready assets.[page:1][web:11]

## 5. Antigravity’s role

Antigravity can help you generate the **front-end experience faster**, especially layouts, screens, and interaction prototypes.[web:3][web:5] But it is not, by itself, the LG publishing layer.[page:1][page:2]

### Good use of Antigravity

Use Antigravity to create:

- Home screen layout
- Content rails and cards
- Search UI
- Detail page templates
- Settings/account pages
- Design system tokens for TV

### Work still needed after Antigravity

You or a developer will still need to:

1. Convert generated output into a webOS TV app structure.[page:1]
2. Add LG-compatible app configuration and packaging workflow.[page:1]
3. Implement remote focus states and directional navigation logic for all screens.[page:2]
4. Connect live APIs, auth, playback, and error handling.[web:8]
5. Test on simulator and real TV hardware in Developer Mode.[page:1]
6. Prepare Seller Lounge submission files and review data.[web:7][web:11][web:15]

## 6. TV-specific engineering you must plan for

This is the part many web teams underestimate.

### A. Remote navigation system

Your app must work smoothly with arrow keys, OK/select, back, and home-style navigation patterns because the primary input is a TV remote, not touch or mouse.[page:2] That means every interactive component needs a focus order, visible focus ring, predictable left/right/up/down movement, and safe fallback behavior when a row or modal ends.[page:2]

### B. 10-foot UI design

Text, spacing, and hit areas need to be larger than desktop web because users sit farther from the screen.[page:2] For VeloraTV, prioritize large thumbnails, strong contrast, limited text per card, obvious active states, and fast recovery when playback or network issues occur.[web:8][page:2]

### C. Performance constraints

A TV app has less tolerance for bloated JS bundles, heavy animation, and over-complex rendering than a modern desktop browser.[page:1] If Antigravity outputs large framework code, trim it aggressively and prefer lightweight components around your content rails and player flow.[page:1]

### D. Streaming reliability

Because VeloraTV is a video product, playback quality is central to app approval and retention.[web:8] You need stable manifest delivery, bitrate adaptation, poster loading, timeout handling, playback resume logic if supported in your backend, and clear unsupported-content messaging.[web:8]

### E. Authentication and session strategy

If users log in, TV login should be designed around remote usability, such as short-code/device-pairing patterns instead of forcing long email/password entry on-screen.[web:8] Even if you support direct login, pairing-based auth will often create a better TV experience for a streaming app.[web:8]

## 7. Backend and service checklist

You said the website is `veloratv.in`, so the smartest technical path is to audit your current platform and confirm whether these service layers already exist.[web:8]

| Service area | Needed for LG app? | Notes |
|---|---|---|
| Catalog API | Yes | Home rails, categories, featured items, search suggestions.[web:8] |
| Content detail API | Yes | Title page, synopsis, artwork, duration, genre, cast if shown.[web:8] |
| Stream URL service | Yes | Must securely return playable stream URLs.[web:8] |
| Auth/session API | Usually | Needed if the LG app is not fully anonymous.[web:8] |
| Profile/watch history | Recommended | Enables continue watching and personalized rails.[web:8] |
| Search API | Recommended | TV apps benefit from structured search results and keyboard optimization.[web:8] |
| Analytics/events | Strongly recommended | Track launch, browse depth, playback start/fail, exits, crashes.[page:2] |
| CMS/admin | Recommended | Lets your team control promotions and featured sections without app updates.[page:1] |

If any of these are missing, the LG app project becomes a backend-plus-frontend effort, not just a packaging task.[web:8]

## 8. Publishing workflow you need to support

LG’s documented and ecosystem-linked flow is straightforward but operationally strict.[page:1][page:2]

1. Register for LG developer-related accounts and Seller Lounge access.[web:6][web:7][web:15]
2. Create the webOS TV app and define app id/title/version.[page:1]
3. Build and package the app into `.ipk` with webOS CLI.[page:1]
4. Test in simulator and on a real LG TV using Developer Mode.[page:1]
5. Prepare store assets such as iconography, screenshots, descriptions, and any promo material.[web:1][web:11]
6. Fill submission sections in Seller Lounge, including file upload, images, service info, and test info.[web:11]
7. Track review and approval status through LG’s submission flow.[web:15][page:2]

### Submission materials you should expect

Based on Seller Lounge guidance and ecosystem references, prepare:

- App package (`.ipk`).[page:1][web:11]
- App icon and visual assets.[web:11]
- Screenshots and possibly promo assets for listing quality.[web:1][web:11]
- Service description / app metadata.[web:11]
- Test credentials or test instructions for reviewers.[web:11]
- Compliance/support information required inside Seller Lounge.[web:7][web:15]

## 9. Recommended build plan for VeloraTV

### Phase 1: Discovery and audit

Before building, audit `veloratv.in` for the current frontend stack, playback method, content APIs, authentication flow, and whether your existing player already works in a TV browser context.[web:8] This phase decides whether the LG app can be a thin client over your current platform or requires deeper backend changes.[web:8]

### Phase 2: TV UX system

Design a TV-specific system in Antigravity, not a direct clone of the website.[web:3][web:5] Focus on content rails, detail pages, remote focus styles, readable typography, loading states, and error states built specifically for distance viewing.[page:2]

### Phase 3: webOS app shell

Implement the generated UI inside a webOS TV app project using the official app structure and CLI workflow.[page:1] Add boot flow, routing, key handling, API client layer, player integration, logging, and fallback handling.[page:1]

### Phase 4: Device validation

Start with simulator testing, then move quickly to real LG TV checks because playback, focus movement, and performance often behave differently on physical devices.[page:1] Treat real-device testing as mandatory before submission, not optional QA.[page:1]

### Phase 5: Submission ops

Prepare the store listing, screenshots, test notes, and support materials in parallel with final QA so publishing does not stall after engineering is done.[web:1][web:11][web:15]

## 10. Build vs. buy decision

You can build this yourself, but the key question is **how much of VeloraTV already exists as reusable infrastructure**.[web:8]

| Option | When it fits | Risk level |
|---|---|---|
| Build custom webOS app | Best if VeloraTV already has APIs, streaming backend, and product control needs | Medium, because TV QA and review requirements still add complexity.[page:1][web:8] |
| Use Antigravity + custom finishing | Best if you want fast UI creation but can still hand off technical integration and packaging | Medium, because generated UI still needs real engineering.[web:3][page:1] |
| OTT platform/white-label vendor | Best if backend, DRM, device distribution, and multi-TV rollout are not yet mature | Lower engineering effort, but less product control and higher vendor dependence.[web:2][web:9] |

For your case, a custom or semi-custom build is likely justified if VeloraTV already has live content, branding, and a functioning platform backend.[web:8]

## 11. Realistic tech recommendation

If you want the most practical route, build the LG app with this stack:

- **TV frontend:** HTML, CSS, JavaScript web app for webOS TV.[page:1]
- **Generation/design aid:** Antigravity for screens and component scaffolding.[web:3][web:5]
- **Packaging/tooling:** webOS CLI and/or webOS Studio.[page:1]
- **Testing:** webOS TV Simulator plus at least one real LG TV in Developer Mode.[page:1]
- **Delivery model:** hosted web app shell connected to VeloraTV APIs, unless your use case requires a heavier packaged client.[page:1][web:8]
- **Publishing:** LG Seller Lounge submission workflow with `.ipk`, images, service info, and test info.[web:11][web:15]

## 12. Main risks to watch

- Treating the website as already TV-ready when TV navigation and playback flows are fundamentally different.[page:2][web:8]
- Over-trusting generated code from Antigravity without optimizing bundle size and focus behavior.[web:3][page:1]
- Delaying real-device testing until late in the project.[page:1]
- Under-preparing store assets and reviewer instructions for Seller Lounge.[web:11][web:15]
- Missing backend endpoints for catalog, playback, or authentication and discovering that too late.[web:8]

## 13. Final recommendation

Yes, you can use Antigravity as part of the build process, but the publishable LG TV app still needs a proper **webOS TV engineering layer** around it.[page:1][page:2] The cleanest route for VeloraTV is a hosted webOS TV app tied to your existing streaming platform, with a TV-first UX, remote navigation system, lightweight frontend code, official webOS packaging, real-device testing, and Seller Lounge submission prep from the start.[page:1][web:8][web:11]

## 14. Suggested next action list

1. Audit `veloratv.in` frontend, APIs, auth, and player capabilities.[web:8]
2. Define the LG TV information architecture: Home, Categories, Search, Detail, Player, Settings.[page:2]
3. Build TV UI in Antigravity with focus-state specs.[web:3]
4. Create a real webOS TV app project using LG CLI.[page:1]
5. Integrate APIs and playback.[web:8]
6. Test in simulator and on LG TV hardware.[page:1]
7. Prepare Seller Lounge assets and submit.[web:11][web:15]
