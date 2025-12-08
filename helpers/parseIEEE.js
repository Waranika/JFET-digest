import * as cheerio from "cheerio";

/**
 * Extract first image:
 * IEEE commonly uses <media:content> OR an <img> in content:encoded.
 */
function extractImage(item) {
  const media = item["media:content"] || item["media:thumbnail"];
  if (media) {
    if (Array.isArray(media) && media[0]?.url) return media[0].url;
    if (media.url) return media.url;
  }

  const html =
    item["content:encoded"] ||
    item.content ||
    item.description ||
    "";

  const $ = cheerio.load(html);
  const img = $("img").first().attr("src");
  return img || null;
}

/**
 * Cleanup for IEEE summaries:
 * - Remove HTML
 * - Remove "Read the full story" nonsense
 */
function cleanSummary(summary) {
  if (!summary) return "";

  let s = summary;

  // Remove “Read the full story” or similar endings
  s = s.replace(/read the (full )?story.*$/i, "");
  s = s.replace(/continue reading.*$/i, "");

  // Strip HTML
  s = s.replace(/<[^>]+>/g, " ");

  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

/**
 * Extract first meaningful paragraph
 */
function extractSummary(item) {
  const html =
    item["content:encoded"] ||
    item.content ||
    item.description ||
    "";

  const $ = cheerio.load(html);

  // First non-empty paragraph
  const p = $("p").first().text();
  if (p) return cleanSummary(p);

  return cleanSummary(html);
}

export function parseIEEEItem(item, feedMeta, feedConfig) {
  const imageUrl = extractImage(item);
  const summary = extractSummary(item);

  const publishedRaw =
    item.pubDate || item.isoDate || item.updated || item.published;

  const publishedAt = publishedRaw
    ? new Date(publishedRaw).toISOString()
    : null;

  return {
    title: item.title || "",
    url: item.link || "",
    summary,
    imageUrl,
    categories: item.categories || [],
    publishedAt,
    source: feedConfig?.name || feedMeta?.title || "IEEE Spectrum",
  };
}