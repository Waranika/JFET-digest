# JFET-digest  
*A minimalistic, automated tech newsletter — inspired by [mosfet.net](https://mosfet.net) by **n-o-d-e**.*

JFET-digest is a lightweight, low-noise newsletter generator designed to surface **only meaningful technological innovation**, filtering out politics, corporate drama, and unrelated noise.

It aggregates articles from high-quality sources (MIT News, Wired, TechXplore, IEEE Spectrum, ScienceDaily, …), normalizes the feeds through custom parsers, removes duplicates, strips political content, enhances metadata (images, summaries), and outputs a minimal clean newsletter sent automatically via email.

The goal:  
Pur signal, removing noise

---

## ✨ Features

### 📰 Multi-source aggregation
JFET-digest pulls concise, high-quality items from selected tech feeds:

- MIT News (Robotics, AI, Engineering, CS)
- Wired (AI & Science)
- TechXplore (ML/AI, CS, Engineering, Robotics)
- IEEE Spectrum (AI, Robotics, Computing)
- ScienceDaily (CS, Robotics, Engineering)

Each feed has its own dedicated parser under `helpers/`.

---

### 🧹 Intelligent filtering
The system automatically removes:

- political content  
- unrelated editorial or cultural pieces  
- repeated topics  
- duplicates across sources  
- non-technical news  

The result: **every article is strictly tech and innovation focused**.

---

### 🖼️ Image extraction
Many RSS feeds do not expose images consistently. JFET-digest enhances them using:

- `media:content` or `media:thumbnail` when available  
- HTML parsing for embedded images  
- automatic `og:image` scraping fallback  

Ensures each item has a usable preview image.

---

### 📨 Email delivery
Uses **Resend** to send a beautifully formatted HTML digest.

The email design is intentionally minimal, readable, and typography-focused.

### ⏱️ Automated scheduling (GitHub Actions)

The system uses two scheduled workflows:

.github/workflows/
├── prepare.yml # Runs at 04:00 UTC: fetches + parses + stores articles in today.yaml
└── send.yml # Runs at 09:00 UTC: reads YAML and sends the newsletter



This separation allows a manual editorial window between collection and sending.

---

### 🗂️ YAML-based editorial workflow

Fetched articles are converted into:

data/
today.yaml # Current day's draft newsletter (editable)
archive/
YYYY-MM-DD.yaml


You may:
- edit titles or summaries
- remove or reorder items
- add custom notes before sending

Each final digest is archived automatically.

### 📁 Project Structure

JFET-digest/
├── helpers/ # Source-specific RSS parsers
├── scripts/
│ ├── fetchArticles.js # Collects and filters all feeds
│ ├── prepareYaml.js # Generates YAML from article list
│ ├── sendNewsletter.js # Sends the digest using Resend
│ ├── buildNewsletterHtml.js
├── data/
│ ├── today.yaml
│ └── archive/
├── .github/workflows/
│ ├── prepare.yml
│ └── send.yml


---

### 🚀 Running locally

#### 1. Install dependencies

npm install

#### 2. Environment variables

Create a .env file with:

RESEND_API_KEY=your_resend_key
NEWSLETTER_TO=your@email

#### 3. Fetch today’s articles

node scripts/fetchArticles.js

 #### 4. Generate YAML

node scripts/prepareYaml.js

#### 5. Send the newsletter

node scripts/sendNewsletter.js
