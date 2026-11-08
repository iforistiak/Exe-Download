# exe.pro.bd — Direct Software & Utility Repository

A source-available, single-file software download directory built with standalone HTML, CSS, and vanilla JavaScript, paired with an optional Google Apps Script backend for download counters and maintainer email alerts.

## Features

- **Code-Driven Catalog**: Manage site settings (`SITE_CONFIG`), bilingual strings (`TRANSLATIONS`), and software packages (`SOFTWARE`) directly at the top of `index.html` without a database or admin dashboard.
- **Smart Download Dispatcher**: Supports `"direct"`, `"external"`, and `"auto"` link resolution with automatic Google Drive view-to-download link conversion, OS-matched primary installers, and multi-architecture dropdowns.
- **Live Search & Keyboard Navigation**: Debounced search with match highlighting, top-6 autocomplete suggestions (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`), `/` focus shortcut, and recent searches stored in `localStorage`.
- **Category, Platform & License Filtering**: Horizontal category chips, sticky desktop filter sidebar, mobile bottom-sheet drawer, Favorites filter, and four sort modes (Popular, Recently Updated, Highest Rated, Name A–Z).
- **Rich Software Details Modal**: Two-column desktop inspector with screenshot carousel, full overview, changelog, system requirements, one-click SHA-256 hash copy, verified badge, social share links, and related alternatives.
- **Side-by-Side Comparison**: Select up to 3 software packages in the floating comparison tray to inspect specifications side-by-side.
- **Global Download Counter (Optional)**: Connects to Google Apps Script (`Code.gs`) with 5-minute `sessionStorage` caching, optimistic UI updates, 1-hour per-package browser rate limiting, and automatic offline fallback.
- **Request Software & Report Broken Links**: Includes an interactive 1–5 star rating input, honeypot protection, minimum fill-time check, 60-second cooldown, 3-per-hour rate limit, duplicate detection, and `mailto:` fallback when `apiUrl` is empty.
- **Bilingual UI & Theme Modes**: Instant `EN / বাংলা` switch (`Hind Siliguri` typography in Bengali) and WCAG AA Light/Dark themes (`Plus Jakarta Sans`, `Inter`, and `JetBrains Mono`).
- **Installable PWA**: Built-in Web App Manifest and Service Worker (`sw.js`) for offline shell caching.

## Screenshots

```text
docs/screenshots/
├── 01-desktop-light-hero.png       # Light theme hero and search bar
├── 02-desktop-dark-directory.png   # Dark theme software grid and sidebar
├── 03-software-details-modal.png   # Two-column details modal and SHA-256 box
└── 04-mobile-bottom-sheet.png      # Mobile responsive view and sticky bar
```

## Quick Start

1. Clone or download this repository.
2. Open `index.html` in any code editor and customize `SITE_CONFIG` and `SOFTWARE` inside the `<script>` block.
3. Host `index.html` (and `public/sw.js` if using root-scoped service workers) on any static hosting provider (GitHub Pages, Cloudflare Pages, Netlify, Vercel, or any web server).
4. *(Optional)* Follow the Google Sheet + Apps Script setup below and paste your Web App URL into `SITE_CONFIG.apiUrl`.

## Configuration (`SITE_CONFIG`)

All global settings live in the `SITE_CONFIG` object at the top of the `<script>` tag in `index.html`:

| Property | Type | Description |
| :--- | :--- | :--- |
| `siteName` | `string` | Brand name displayed in the header, footer, and page title. |
| `tagline` | `string` | Subtitle appended to the document `<title>`. |
| `logoUrl` | `string` | Optional `https://` image URL for the header brand mark; falls back to text wordmark if empty. |
| `heroTitle` | `string` | Primary English headline displayed in the hero section. |
| `heroSubtitle` | `string` | Supporting description under the hero headline. |
| `accentColor` | `string` | Hex color code (`#FF5A1F`) used for PWA manifest theme color and generated canvas icons. |
| `contactEmail` | `string` | Maintainer email address (`hireistiak@gmail.com`) used for `mailto:` fallbacks and footer links. |
| `authorName` | `string` | Credit name displayed in the site footer (`Md. Istiak Islam`). |
| `authorUrl` | `string` | Profile or portfolio URL linked from the author credit in the footer. |
| `footerText` | `string` | Copyright notice shown in the bottom bar. |
| `apiUrl` | `string` | Google Apps Script Web App URL. Leave `""` to run in 100% local/mailto mode. |
| `publicToken` | `string` | Public client token (`exe-pro-bd-public-v1`) sent with POST requests as a basic bot filter. |
| `announcement` | `object` | Controls the top announcement bar (`enabled`, `text_en`, `text_bn`, `linkUrl`, `linkText_en`, `linkText_bn`). |
| `socialLinks` | `object` | External profile links (`facebook`, `youtube`, `telegram`, `github`). |
| `externalHosts` | `string[]` | Hostnames treated as external mirror pages when link `type` is `"auto"`. |

## How to Add a New Software

Append a new entry to the `SOFTWARE` array in `index.html` (and add its `id` to `ALLOWED_SOFTWARE_IDS` in `Code.gs` if using the Apps Script counter):

```javascript
{
  id: "handbrake",
  name: "HandBrake Video Transcoder",
  version: "1.8.2",
  category: "Media Players",
  platform: ["Windows", "macOS", "Linux"],
  size: "24 MB",
  license: "Open Source", // "Free" | "Open Source" | "Trial"
  rating: 4.8,
  downloads: 420000,
  releaseDate: "2026-10-15",
  featured: false,
  trending: false,
  verified: true,
  sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  requirements: "Windows 10/11 (64-bit), macOS 11+, or 64-bit Linux",
  changelog: "v1.8.2: Updated SVT-AV1 encoder and improved hardware queue stability.",
  description: "Open-source multi-platform video transcoder for MP4 and MKV.",
  longDescription: "HandBrake converts video from nearly any format to a selection of modern, widely supported codecs.",
  iconUrl: "https://example.com/icons/handbrake.png",
  screenshots: ["https://example.com/screens/handbrake-1.png"],
  downloadLinks: [
    {
      label: "Windows 64-bit (.exe)",
      url: "https://example.com/HandBrake-1.8.2-x86_64-Win_GUI.exe",
      platform: "Windows",
      size: "24 MB",
      type: "auto" // "direct" | "external" | "auto"
    }
  ]
}
```

## Google Sheet + Apps Script Setup (Step by Step)

1. Create a new Google Sheet in your Google Drive.
2. Rename the first tab to `counts` and add headers in Row 1: `id` (A1), `count` (B1), `updatedAt` (C1).
3. *(Optional)* Create a tab named `allowed` and list valid software IDs in Column A. (`Code.gs` also includes the built-in `ALLOWED_SOFTWARE_IDS` array.)
4. In the Google Sheet menu, click **Extensions → Apps Script**.
5. Replace the contents of `Code.gs` with the contents of [`Code.gs`](./Code.gs) from this repository.
6. Verify `CONFIG.CONTACT_EMAIL` at the top of `Code.gs` matches your email address (`hireistiak@gmail.com`).
7. Click **Deploy → New deployment**, select **Web app**, set:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
8. Authorize the script when prompted, copy the generated `https://script.google.com/macros/s/.../exec` URL, and paste it into `SITE_CONFIG.apiUrl` inside `index.html`.

## Security Notes

### Protected Areas
- **XSS Prevention**: All dynamic software strings, search queries, and user inputs are HTML-escaped before rendering. Inline event handler attributes (`onclick`, `onerror`) are strictly avoided.
- **Strict URL Validation**: External links, download targets, icons, and social URLs allow only `http:` and `https:` schemes; `javascript:`, `vbscript:`, and untrusted `data:` URLs are blocked. All external links enforce `rel="noopener noreferrer"`.
- **Content Security Policy & Referrer Policy**: Enforced via `<meta http-equiv="Content-Security-Policy">` and `<meta name="referrer" content="strict-origin-when-cross-origin">`.
- **Client-Side Form & Counter Guards**: Enforces field length limits, control-character stripping, honeypot field, 3-second minimum form fill time, 60-second submission cooldown, max 3 submissions per hour, duplicate payload fingerprinting, and human-speed click validation on download buttons.
- **Server-Side Enforcement (`Code.gs`)**: Whitelists actions (`download`, `request`, `report`), caps payload size at 4 KB, validates software IDs against `ALLOWED_SOFTWARE_IDS` / `allowed` sheet, uses `LockService` for concurrent writes, throttles via `CacheService`, caps daily emails via `PropertiesService`, HTML-escapes email bodies, strips CR/LF from email subjects, and records anomalies in a capped `logs` sheet (max 500 rows) without exposing stack traces.

### Known Client-Side Limits
- Because `index.html` is a static client-side application, `localStorage` and `sessionStorage` rate limits can be cleared by a user clearing browser data or using private browsing windows. Authoritative protection therefore relies on the server-side `CacheService` and `PropertiesService` guards in `Code.gs`.
- Google Apps Script `doPost` endpoints do not expose the caller's raw IP address to script code, so server-side throttling is keyed per software ID, per sender email hash, and globally per minute/hour/day.

## Project Structure

```text
.
├── index.html          # Standalone single-file application (HTML + CSS + JS)
├── Code.gs             # Google Apps Script backend for counters and email alerts
├── public/
│   └── sw.js           # Progressive Web App service worker
├── LICENSE             # PolyForm Noncommercial License 1.0.0
├── COMMERCIAL-USE.md   # Commercial licensing policy and contact instructions
├── NOTICE              # Required copyright and attribution notice
├── SECURITY.md         # Vulnerability reporting policy
├── README.md           # Documentation
└── .gitignore          # Git ignore rules
```

## Browser Support

- Chrome / Edge / Brave `105+`
- Firefox `110+`
- Safari / iOS Safari `15.4+`

## Disclaimer

All software names, logos, brands, and trademarks displayed in this repository belong to their respective owners and publishers. This project only indexes metadata and links to official vendor releases or publicly available mirrors. No binary installers or copyrighted archives are hosted in this repository, and the repository owner is not responsible for third-party software or external websites.

## License

This project is **source-available** (not open source) and is licensed under the **[PolyForm Noncommercial License 1.0.0](./LICENSE)**.

- **Non-Commercial Use Only**: You may view, modify, and use this code for personal, educational, or non-commercial purposes free of charge.
- **Attribution Required**: You must retain the `Required Notice` in [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE), as well as the author credit in `index.html` and `Code.gs`.
- **Commercial Use Prohibited Without Permission**: Selling, reselling, commercial hosting, or white-labeling requires a commercial license. See [`COMMERCIAL-USE.md`](./COMMERCIAL-USE.md) for details.

```text
Required Notice: Copyright (c) 2026 Md. Istiak Islam (hireistiak@gmail.com)
```

## Contact

- **Author & Maintainer**: Md. Istiak Islam
- **Email**: [hireistiak@gmail.com](mailto:hireistiak@gmail.com)
