import * as cheerio from "cheerio";

// --- Fetch OG image (WIRED always provides one) --------------------
async function fetchOgImage(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; JFETDigestBot/1.0; +https://github.com/Waranika/JFET-digest)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const og = $('meta[property="og:image"]').attr("content");
    if (og) return og;

    const tw = $('meta[name="twitter:image"]').attr("content");
    if (tw) return tw;

    return null;
  } catch (err) {
    console.error("Failed to fetch WIRED og:image:", url, err.message);
    return null;
  }
}

// --- Clean summary --------------------------------------------------
function cleanWiredSummary(raw) {
  if (!raw) return "";

  return raw
    .replace(/\s*Read the full story at .*$/i, "")
    .replace(/\s*Read the full story on .*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

// --- Main parser -----------------------------------------------------
export async function parseWiredItem(item, feedMeta, feedConfig) {
  // Must await!
  const imageUrl = await fetchOgImage(item.link);

  const publishedRaw =
    item.isoDate || item.pubDate || item.published || item.updated;

  const summaryRaw =
    item.contentSnippet || item.summary || item.description || "";

  return {
    title: item.title || "",
    url: item.link || "",
    summary: cleanWiredSummary(summaryRaw),
    imageUrl,
    categories: item.categories || [],
    publishedAt: publishedRaw ? new Date(publishedRaw).toISOString() : null,
    source: feedConfig?.name || feedMeta?.title || "WIRED",
  };
}
