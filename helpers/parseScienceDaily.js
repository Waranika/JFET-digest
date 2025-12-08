import * as cheerio from "cheerio";

// --- fetch og:image like TechXplore ----------------------------------
async function fetchOgImage(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const og = $('meta[property="og:image"]').attr("content");
    if (og) return og;

    const tw = $('meta[name="twitter:image"]').attr("content");
    if (tw) return tw;

    return null;
  } catch (err) {
    console.error("[ScienceDaily] OG image fetch failed:", url, err.message);
    return null;
  }
}

// --- extract summary -------------------------------------------------
function cleanSummary(raw) {
  if (!raw) return "";

  let summary = raw;

  summary = summary.replace(/full story.*/i, "");
  summary = summary.replace(/read (the )?full story.*/i, "");
  summary = summary.replace(/<[^>]+>/g, " ");
  summary = summary.replace(/\s+/g, " ").trim();

  return summary;
}

function extractSummary(item) {
  const html =
    item["content:encoded"] ||
    item.content ||
    item.description ||
    item.summary ||
    "";

  const $ = cheerio.load(html);
  const p = $("p").first().text();

  if (p) return cleanSummary(p);

  return cleanSummary(html);
}

// --- main parser ------------------------------------------------------
export async function parseScienceDailyItem(item, feedMeta, feedConfig) {
  const pageUrl = item.link;
  let imageUrl = null;

  // 1) Try OG image from article page
  if (pageUrl) {
    imageUrl = await fetchOgImage(pageUrl);
  }

  // 2) ScienceDaily feeds never contain images, but keep fallback attempt
  if (!imageUrl) {
    const html =
      item["content:encoded"] ||
      item.content ||
      item.description ||
      item.summary ||
      "";
    const $ = cheerio.load(html);
    imageUrl = $("img").first().attr("src") || null;
  }

  const summary = extractSummary(item);

  const publishedRaw =
    item.pubDate || item.isoDate || item.published || item.updated;
  const publishedAt = publishedRaw ? new Date(publishedRaw).toISOString() : null;

  return {
    title: item.title || "",
    url: item.link || "",
    summary,
    imageUrl,
    categories: item.categories || [],
    publishedAt,
    source: feedConfig?.name || feedMeta?.title || "ScienceDaily",
  };
}
