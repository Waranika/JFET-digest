import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

import { fetchArticles } from "./fetchArticles.js";
import { buildNewsletterHtml } from "./buildNewsletterHtml.js"; // the refactored function

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildPageHtml(articles) {
  const hasArticles = articles && articles.length > 0;

  const itemsHtml = hasArticles
    ? articles
        .map((a, idx) => {
          const snippet =
            a.summary && a.summary.length > 260
              ? a.summary.slice(0, 260).split(" ").slice(0, -1).join(" ") + "…"
              : a.summary || "";

          const category =
            (a.categories && a.categories[0]) || a.source || "Tech";

          const formattedDate = a.publishedAt
            ? new Date(a.publishedAt).toLocaleDateString("en-GB", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "Today";

          return `
            <article class="article-item">
              <div class="article-header" onclick="toggleArticle(${idx})">
                <h2 class="article-title">${a.title}</h2>
                <div class="article-meta">
                  ${formattedDate.toUpperCase()} &nbsp; | &nbsp; ${String(
            category
          ).toUpperCase()}
                </div>
              </div>

              <div class="article-content" id="article-${idx}">
                ${
                  a.imageUrl
                    ? `<img src="${a.imageUrl}" alt="" class="article-image" />`
                    : ""
                }

                ${snippet ? `<p class="article-snippet">${snippet}</p>` : ""}

                <p class="article-link">
                  <a href="${a.url}" target="_blank" rel="noopener noreferrer">Read the full article →</a>
                </p>
              </div>
            </article>
          `;
        })
        .join("")
    : `
      <div class="no-articles">
        <p>No new articles today.</p>
      </div>
    `;

  return `<!doctype html>
<html lang="en">
  <head>
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" type="image/png" sizes="32x32" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>JFETech Digest</title>

    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
          Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif;
      }

      .container {
        max-width: 760px;
        margin: 0 auto;
        padding: 10px 72px 60px 72px;
      }

      /* HEADER (updated to support gear + dropdown) */
      .header {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;

        width: 100vw;
        margin-left: calc(50% - 50vw); /* full-bleed */
        margin-bottom: 40px;
        padding-bottom: 5px;
        border-bottom: 1px solid #000;
      }

      .logo {
        display: block;
        max-width: 100px;
        height: auto;
        margin: 0 auto 16px auto;
      }

      /* Settings (gear + dropdown) */
      .settings-wrap {
        position: absolute;
        left: 0;
        top: 0;
        height: 44px;
        display: flex;
        align-items: center;
      }

      .settings-icon {
        width: 44px;
        height: 44px;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 10px;
        display: grid;
        place-items: center;
      }

      .settings-icon:hover {
        background: #f3f3f3;
      }

      .settings-icon svg {
        width: 20px;
        height: 20px;
        fill: #000;
        opacity: 0.9;
      }

      .settings-dropdown {
        position: absolute;
        left: 0;
        top: 48px;
        width: 280px;
        background: #fff;
        border: 1px solid #e6e6e6;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
        padding: 6px;
        display: none;
        z-index: 1000;
        text-align: left;
      }

      .settings-dropdown.open {
        display: block;
      }

      .dropdown-item {
        width: 100%;
        text-align: left;
        border: none;
        background: transparent;
        padding: 10px 10px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 13px;
      }

      .dropdown-item:hover {
        background: #f6f6f6;
      }

      .subscribe-panel {
        margin-top: 6px;
        padding: 8px 6px 4px 6px;
        border-top: 1px solid #efefef;
      }

      .subscribe-form {
        display: flex;
        gap: 8px;
      }

      .subscribe-form input {
        flex: 1;
        padding: 9px 10px;
        border: 1px solid #ddd;
        border-radius: 10px;
        font-size: 13px;
      }

      .subscribe-form button {
        padding: 9px 10px;
        border: 1px solid #000;
        background: #000;
        color: #fff;
        border-radius: 10px;
        cursor: pointer;
        font-size: 13px;
      }

      .subscribe-msg {
        margin-top: 8px;
        font-size: 12px;
        color: #333;
        min-height: 16px;
      }

      /* Articles */
      .article-item {
        margin-bottom: 0;
        border-bottom: 1px solid #e0e0e0;
      }

      .article-item:last-child {
        border-bottom: none;
      }

      .article-header {
        padding: 20px 0;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .article-header:hover {
        background-color: #fafafa;
      }

      .article-title {
        margin: 0 0 8px 0;
        font-size: 18px;
        line-height: 1.4;
        font-weight: 600;
        color: #000000;
      }

      .article-meta {
        font-size: 12px;
        line-height: 1.4;
        color: #666666;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .article-content {
        display: none;
        padding: 0 0 24px 0;
        animation: slideDown 0.3s ease-out;
      }

      .article-content.expanded {
        display: block;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .article-image {
        display: block;
        width: 100%;
        max-width: 100%;
        border-radius: 4px;
        margin: 0 0 16px 0;
      }

      .article-snippet {
        margin: 0 0 12px 0;
        font-size: 14px;
        line-height: 1.6;
        color: #333333;
      }

      .article-link {
        margin: 0;
        font-size: 13px;
      }

      .article-link a {
        color: #666666;
        text-decoration: none;
        font-weight: 500;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        font-size: 12px;
      }

      .article-link a:hover {
        color: #000000;
      }

      .no-articles {
        padding: 40px 0;
        text-align: center;
        color: #666666;
      }

      .no-articles p {
        font-size: 14px;
      }

      @media (max-width: 680px) {
        .container {
          padding: 40px 16px;
        }

        .article-title {
          font-size: 16px;
        }
      }
    </style>
  </head>

  <body>
    <div class="container">
      <header class="header">
        <!-- Settings gear (left) -->
        <div class="settings-wrap">
          <button class="settings-icon" aria-label="Settings" onclick="toggleSettingsDropdown(event)">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path
                d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"
              />
            </svg>
          </button>

          <div class="settings-dropdown" id="settingsDropdown" role="menu" aria-hidden="true">
            <button class="dropdown-item" type="button" onclick="toggleSubscribeForm(event)">
              Subscribe
            </button>

            <div class="subscribe-panel" id="subscribePanel" hidden>
              <form id="subscribe-form" class="subscribe-form">
                <input id="subscribe-email" type="email" placeholder="you@example.com" required />
                <button type="submit">Go</button>
              </form>
              <div id="subscribe-msg" class="subscribe-msg"></div>
            </div>
          </div>
        </div>

        <!-- Your logo (center) -->
        <img src="/android-chrome-192x192.png" alt="JFETech Logo" class="logo" />
      </header>

      <main>
        ${itemsHtml}
      </main>
    </div>

    <script>
      const SUBSCRIBE_ENDPOINT = "https://worker.jfet-api.workers.dev/subscribe";

      function toggleArticle(index) {
        const content = document.getElementById("article-" + index);
        if (content.classList.contains("expanded")) {
          content.classList.remove("expanded");
        } else {
          document.querySelectorAll(".article-content").forEach((el) => {
            el.classList.remove("expanded");
          });
          content.classList.add("expanded");
        }
      }

      function closeSettingsDropdown() {
        const dd = document.getElementById("settingsDropdown");
        if (!dd) return;
        dd.classList.remove("open");
        dd.setAttribute("aria-hidden", "true");

        const panel = document.getElementById("subscribePanel");
        if (panel) panel.hidden = true;
      }

      function toggleSettingsDropdown(e) {
        e?.preventDefault?.();
        e?.stopPropagation?.();

        const dd = document.getElementById("settingsDropdown");
        if (!dd) return;

        const open = dd.classList.toggle("open");
        dd.setAttribute("aria-hidden", open ? "false" : "true");

        if (!open) {
          const panel = document.getElementById("subscribePanel");
          if (panel) panel.hidden = true;
        }
      }

      function toggleSubscribeForm(e) {
        e?.preventDefault?.();
        e?.stopPropagation?.();

        const panel = document.getElementById("subscribePanel");
        if (!panel) return;

        panel.hidden = !panel.hidden;

        if (!panel.hidden) {
          setTimeout(() => document.getElementById("subscribe-email")?.focus(), 0);
        }
      }

      // Close dropdown on outside click
      document.addEventListener("click", (e) => {
        const wrap = document.querySelector(".settings-wrap");
        if (!wrap) return;
        if (!wrap.contains(e.target)) closeSettingsDropdown();
      });

      // Close dropdown on Escape
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeSettingsDropdown();
      });

      // Subscribe submit
      document.addEventListener("DOMContentLoaded", () => {
        const form = document.getElementById("subscribe-form");
        if (!form) return;

        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          e.stopPropagation();

          const msg = document.getElementById("subscribe-msg");
          const email = document.getElementById("subscribe-email").value.trim();

          msg.textContent = "Subscribing…";

          try {
            const res = await fetch(SUBSCRIBE_ENDPOINT, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.ok) {
              msg.textContent = data.message || "Subscription failed.";
              return;
            }

            msg.textContent = data.message || "Subscribed 🎉";
            form.reset();
          } catch (err) {
            msg.textContent = "Network error. Try again.";
          }
        });
      });
    </script>
  </body>
</html>`;
}

async function main() {
  console.log("Building web page…");

  // Absolute repo paths
  const repoRoot = path.join(__dirname, "..");
  const yamlPath = path.join(repoRoot, "data", "today.yaml");
  const outDir = path.join(repoRoot, "docs");
  const outFile = path.join(outDir, "index.html");

  // 1) Read YAML
  const raw = fs.readFileSync(yamlPath, "utf8");
  const data = YAML.parse(raw);
  const articles = data.articles || [];

  // 2) Build HTML
  const html = buildPageHtml(articles);

  // 3) Ensure docs/ exists + write index.html
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, html, "utf8");

  console.log(`✅ Wrote webpage to ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
