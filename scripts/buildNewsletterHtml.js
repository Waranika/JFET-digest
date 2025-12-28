function buildNewsletterHtml(articles) {
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
            <tr>
              <td style="padding: 28px 0; border-bottom: 1px solid #eeeeee;">

                <h2 style="
                  margin: 0 0 4px 0;
                  font-size: 19px;
                  line-height: 1.35;
                  font-weight: 600;
                  letter-spacing: 0.01em;
                ">
                  <a href="${a.url}" style="color:#111111; text-decoration:none;">
                    ${a.title}
                  </a>
                </h2>

                <div style="
                  margin: 0 0 14px 0;
                  font-size: 11px;
                  line-height: 1.4;
                  color: #999999;
                  text-transform: uppercase;
                  letter-spacing: 0.12em;
                ">
                  ${formattedDate} &nbsp; | &nbsp; ${category}
                </div>

                ${
                  a.imageUrl
                    ? `
                <img
                  src="${a.imageUrl}"
                  alt=""
                  style="
                    display:block;
                    width:100%;
                    max-width:100%;
                    border-radius:4px;
                    margin:0 0 12px 0;
                  "
                />`
                    : ""
                }

                ${
                  snippet
                    ? `
                <p style="
                  margin: 0 0 8px 0;
                  font-size: 13px;
                  line-height: 1.6;
                  color: #333333;
                ">
                  ${snippet}
                </p>`
                    : ""
                }

                <p style="margin: 0; font-size: 12px;">
                  <a href="${a.url}" style="
                    color:#999999;
                    text-decoration:none;
                    font-weight:500;
                    letter-spacing:0.04em;
                    text-transform:uppercase;
                    font-size: 11px;
                  ">
                    Read the full article →
                  </a>
                </p>
              </td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td style="padding: 40px 0; text-align: center; color: #555;">
          <p style="font-size: 14px; margin: 0;">No new articles today.</p>
        </td>
      </tr>
    `;

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>JFET</title>
      </head>
      <body style="margin:0; padding:0; background:#f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
          <tr>
            <td align="center">
              <table width="640" cellpadding="0" cellspacing="0" style="
                background:#ffffff;
                border-radius:8px;
                padding:24px 24px 18px 24px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
                             Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue',
                             Arial, sans-serif;
              ">
                <tr>
                  <td>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 22px;">
                      <tr>
                        <td style="
                          font-size:22px;
                          font-weight:600;
                          letter-spacing:0.06em;
                          text-transform:uppercase;
                          text-align: left;
                        ">
                          JFETech Digest
                        </td>
                      </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${itemsHtml}
                    </table>

                    <!-- Footer (table-safe) -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                      <tr>
                        <td style="
                          padding-top:12px;
                          border-top:1px solid #eeeeee;
                          font-size:11px;
                          color:#999999;
                          line-height:1.5;
                        ">
                          You’re receiving this email because you subscribed to Tech Digest.<br/>
                          Links go directly to the original publishers.<br/>
                          <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#999999; text-decoration:underline;">
                            Unsubscribe
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export { buildNewsletterHtml };
