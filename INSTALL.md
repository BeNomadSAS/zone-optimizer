# Zone Optimizer - Installation

## Prerequisites

- **VS Code** with Live Server extension (or any static HTTP server)
- **bemap-js-api** built and available at `../bemap-js-api/dist/`
- A valid **Bemap account** (username/password) with access to Roads Extractor and Routing APIs

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd zone-optimizer
```

### 2. Install bemap-js-api

Copy the distribution files from the bemap-js-api project:

```bash
cp ../bemap-js-api/dist/bemap-js-api.js lib/bemap-js-api/
cp ../bemap-js-api/dist/bemap-js-api.css lib/bemap-js-api/
cp ../bemap-js-api/dist/leaflet.js lib/bemap-js-api/
cp ../bemap-js-api/dist/leaflet.css lib/bemap-js-api/
```

jQuery is already included in `lib/jquery/`.

### 3. Run the application

**Option A — VS Code Live Server (recommended)**

1. Open the project in VS Code
2. Right-click `index.html` → "Open with Live Server"

**Option B — Command line**

```bash
npx http-server -p 8080 --cors -o index.html
```

### 4. Configure credentials

On first launch, a modal dialog will prompt for:
- **Environment**: Beta, Preprod, or Prod
- **Username**: Your Bemap username
- **Password**: Your Bemap password

Credentials are stored in `localStorage` and used for all API calls.

## Project Structure

```
zone-optimizer/
  index.html              Entry point (HTML skeleton + script includes)
  css/app.css             Application styles
  js/app/                 Application modules (config, map, extraction, routing, etc.)
  js/dao/                 Data Access Objects (API calls via bemap.ajax)
  lib/bemap-js-api/       BeMap JS API library files
  lib/jquery/             jQuery 3.4.1
```

## Updating bemap-js-api

When bemap-js-api is rebuilt, copy the updated dist files:

```bash
cp ../bemap-js-api/dist/bemap-js-api.js lib/bemap-js-api/
cp ../bemap-js-api/dist/leaflet.js lib/bemap-js-api/
```

Once Leaflet.Draw is integrated into bemap-js-api, also copy:

```bash
cp ../bemap-js-api/dist/leaflet.draw.js lib/bemap-js-api/
cp ../bemap-js-api/dist/leaflet.draw.css lib/bemap-js-api/
```

And replace the CDN references in `index.html` with local paths.
