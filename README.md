# Island Rides Phuket — Website

Plain static HTML/CSS site, no build step required. 7 pages: Home, Motorcycle Rental, Car Rental, Island Tours, Visa Services, Driver License, Ferry Tickets.

## Deploy to GitHub + Cloudflare Pages (no CLI, no code needed)

### 1. Put this folder on GitHub
- Go to [repo.new](https://repo.new) and create a new repository (e.g. `island-rides-website`).
- On the new repo page, click **"uploading an existing file"** and drag in all the files from this `website` folder (`index.html`, `styles.css`, all the other `.html` pages).
- Commit the files directly on GitHub — no `git` command line needed.

*(If you're comfortable with git, the equivalent commands are: `git init`, `git add .`, `git commit -m "Initial site"`, `git branch -M main`, `git remote add origin <your-repo-url>`, `git push -u origin main`.)*

### 2. Connect the repo to Cloudflare Pages
- Log in to the [Cloudflare dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
- Authorize Cloudflare to access your GitHub account, then select the `island-rides-website` repo.
- Build settings: leave **Framework preset** as "None" and **Build command** blank — this is a plain static site, nothing to build.
- Click **Save and Deploy**.

### 3. Done
Cloudflare gives you a free `*.pages.dev` URL immediately. Every time you push a change to GitHub, Cloudflare rebuilds and redeploys automatically — no CLI, no tokens shared with anyone.

### Custom domain (optional)
In the same Pages project → **Custom domains** → add your own domain (e.g. `islandridesphuket.com`) if you own one and want to point it here.

## Editing content later
- All page copy is plain HTML — open any `.html` file in a text editor.
- Tour/Jet Ski/ATV pricing lives inside `tours.html` in the `<script>` section near the bottom (the `TOURS` array). Keep it in sync with `Glide Import/Tours_Catalog.csv` in the main project folder.
- Shared design (colors, spacing, buttons) lives in `styles.css`, shared by every page.
- WhatsApp number used throughout: `66803140043` (+66 80 314 0043).

## Known placeholders / things to confirm before going fully live
- Motorcycle/car daily rental rates are not published on the site (only deposit examples) — the AI Business Brief notes prices change by season/model and should be confirmed before publishing fixed numbers.
- Jet Ski pricing/partner details are real (Phuket Jet Ski Club contract), but the contract is seasonal (1 May – 31 Oct 2026) and has a license/insurance number mismatch between the contract and the partner's marketing flyer — see `Island_Rides_Tours_Activities_SOP.docx` for details.
- No photos yet — card thumbnails currently use icon placeholders (`.card-photo`). Swap in real photos from `Bike Collection/` and `Car Photo/` when ready.
