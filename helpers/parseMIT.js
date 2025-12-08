// helpers/parseMIT.js
import { load } from "cheerio";

function absolutizeMitUrl(src) {
  if (!src) return null;
  // Already absolute
  if (/^https?:\/\//i.test(src)) return src;
  // MIT feeds often use /sites/...
  try {
    return new URL(src, "https://news.mit.edu").toString();
  } catch {
    return src;
  }
}

function extractImage(item) {
  // 1) Try media:content / media:thumbnail
  const media = item["media:content"] || item["media:thumbnail"];

  if (media) {
    if (Array.isArray(media) && media.length > 0) {
      const m = media[0];
      const url = m.url || (m.$ && m.$.url);
      if (url) return absolutizeMitUrl(url);
    } else if (typeof media === "object") {
      const url = media.url || (media.$ && media.$.url);
      if (url) return absolutizeMitUrl(url);
    }
  }

  // 2) Fallback: look for first <img> in HTML body
  const html =
    item["content:encoded"] ||
    item.content ||
    item.description ||
    item.summary ||
    "";

  const $ = load(html);
  const img = $("img").first().attr("src") || null;
  return img ? absolutizeMitUrl(img) : null;
}

export function parseMITItem(item) {
  const html =
    item["content:encoded"] ||
    item.content ||
    item.description ||
    item.summary ||
    "";

  const $ = load(html);

  // Extract summary (first paragraph text; fall back to description/title)
  let summary = $("p").first().text()?.trim();
  if (!summary) {
    summary = (item.description || item.summary || "").trim() || item.title;
  }

  const imageUrl = extractImage(item);

  // Categories (normalize to strings — some feeds return objects)
  const rawCategories = item.categories || [];
  const categories = rawCategories
    .map((c) => {
      if (!c && c !== 0) return null;
      if (typeof c === "string") return c;
      if (typeof c === "object") {
        // common rss-parser shapes: { '#text': 'Name' } or { text: 'Name' }
        return c["#text"] || c["#"] || c.text || c.value || c.name || null;
      }
      return String(c);
    })
    .filter(Boolean);

  // Only include MIT innovation / tech topics
  const allowed = [
    "Robotics",
    "Artificial intelligence",
    "Engineering",
    "Computer science",
    "Nanotechnology",
    "Materials science",
    "Mechanical engineering",
    "Technology",
  ];

  const matchesAllowed = categories.some((c) =>
    allowed.some((a) => String(c).toLowerCase().includes(a.toLowerCase()))
  );

  // If no categories found, accept the article anyway (feed is already scoped)
  if (categories.length > 0 && !matchesAllowed) {
    console.log(
      `    [MIT] Skipped: "${item.title}" (categories: ${
        categories.join(", ") || "none"
      })`
    );
    return null;
  }

  const publishedRaw =
    item.isoDate || item.pubDate || item.published || item.updated || null;
  const publishedAt = publishedRaw ? new Date(publishedRaw).toISOString() : null;

  return {
    title: item.title,
    url: item.link,
    summary,
    imageUrl,
    categories,
    publishedAt,
    source: "MIT News",
  };
}
