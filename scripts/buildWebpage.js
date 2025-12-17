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
                  ${formattedDate.toUpperCase()} &nbsp; | &nbsp; ${category.toUpperCase()}
                </div>
              </div>

              <div class="article-content" id="article-${idx}">
                ${
                  a.imageUrl
                    ? `<img src="${a.imageUrl}" alt="" class="article-image" />`
                    : ""
                }

                ${
                  snippet
                    ? `<p class="article-snippet">${snippet}</p>`
                    : ""
                }

                <p class="article-link">
                  <a href="${a.url}" target="_blank">Read the full article →</a>
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

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32"/>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
                         Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue',
                         Arial, sans-serif;
          }

          .container {
            max-width: 760px;
            margin: 0 auto;
            padding: 60px 72px;
          }

          .header {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 40px;
            text-align: center;
            color: #000000;
          }

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
        <script>
          function toggleArticle(index) {
            const content = document.getElementById('article-' + index);
            if (content.classList.contains('expanded')) {
              content.classList.remove('expanded');
            } else {
              // Close all other articles
              document.querySelectorAll('.article-content').forEach(el => {
                el.classList.remove('expanded');
              });
              content.classList.add('expanded');
            }
          }
        </script>
      </head>
      <body>
        <div class="container">
          <header class="header">
            JFETech Digest
          </header>

          <main>
            ${itemsHtml}
          </main>
        </div>
      </body>
    </html>
  `;
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
