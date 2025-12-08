import { writeFile } from "fs/promises";
import { fetchArticles } from "./fetchArticles.js";

function buildPageHtml(articles) {
  const hasArticles = articles && articles.length > 0;

  const itemsHtml = hasArticles
    ? articles
        .map((a) => {
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
              <h2 class="article-title">
                <a href="${a.url}">${a.title}</a>
              </h2>

              <div class="article-meta">
                ${formattedDate} &nbsp; | &nbsp; ${category}
              </div>

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
                <a href="${a.url}">Read the full article →</a>
              </p>
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
            padding: 24px 16px;
            background: #f5f5f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
                         Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue',
                         Arial, sans-serif;
          }

          .container {
            max-width: 640px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            padding: 24px;
          }

          .header {
            font-size: 22px;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            margin-bottom: 22px;
          }

          .article-item {
            padding: 28px 0;
            border-bottom: 1px solid #eeeeee;
          }

          .article-item:last-child {
            border-bottom: none;
          }

          .article-title {
            margin: 0 0 4px 0;
            font-size: 19px;
            line-height: 1.35;
            font-weight: 600;
            letter-spacing: 0.01em;
          }

          .article-title a {
            color: #111111;
            text-decoration: none;
          }

          .article-title a:hover {
            color: #0066cc;
          }

          .article-meta {
            margin: 0 0 14px 0;
            font-size: 11px;
            line-height: 1.4;
            color: #999999;
            text-transform: uppercase;
            letter-spacing: 0.12em;
          }

          .article-image {
            display: block;
            width: 100%;
            max-width: 100%;
            border-radius: 4px;
            margin: 0 0 12px 0;
          }

          .article-snippet {
            margin: 0 0 8px 0;
            font-size: 13px;
            line-height: 1.6;
            color: #333333;
          }

          .article-link {
            margin: 0;
            font-size: 12px;
          }

          .article-link a {
            color: #999999;
            text-decoration: none;
            font-weight: 500;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            font-size: 11px;
          }

          .article-link a:hover {
            color: #0066cc;
          }

          .no-articles {
            padding: 40px 0;
            text-align: center;
            color: #555555;
          }

          .no-articles p {
            font-size: 14px;
          }

          .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #eeeeee;
            font-size: 11px;
            color: #999999;
            line-height: 1.5;
          }

          @media (max-width: 680px) {
            .container {
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            JFETech Digest
          </header>

          <main>
            ${itemsHtml}
          </main>

          <footer class="footer">
            This is the webpage of the JFETechDigest<br/>
            Links go directly to the original publishers.
          </footer>
        </div>
      </body>
    </html>
  `;
}

async function main() {
  const articles = await fetchArticles(1);
  const html = buildPageHtml(articles);
  await writeFile("index.html", html, "utf8");
  console.log("index.html written");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
