// helpers/parseTechXplore.js
import * as cheerio from "cheerio";

const SITE_URL = "https://jfetnews.net";

function asset(filename) {
  return `${SITE_URL}/assets/${filename}`;
}

function fallbackImageFromCategory(item, feedConfig) {
  const src = (feedConfig?.name || "").toLowerCase();

  if (src.includes("robotics")) return asset("techXplore_robotics.jpg");
  if (src.includes("engineering")) return asset("techxplore_robotics.jpg");
  if (src.includes("computer science")) return asset("techxplore_cs.jpg");
  if (src.includes("ai")) return asset("techxplore_cs.jpg"); 

  // fallback
  return asset("techxplore_default.png");
}

function extractImage(item) {
  // Try media fields first
  const media = item["media:content"] || item["media:thumbnail"];

  if (media) {
    if (Array.isArray(media) && media[0]?.url) return media[0].url;
    if (media.url) return media.url;
  }

  // Otherwise parse HTML
  const html =
    item["content:encoded"] ||
    item.content ||
    item.summary ||
    item.description ||
    "";

  const $ = cheerio.load(html);
  const img = $("img").first().attr("src");
  return img || null;
}

async function fetchOgImage(url) {
  const start = Date.now();
  try {
    const duration = Date.now() - start;
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; JFETDigestBot/1.0; +https://github.com/Waranika/JFET-digest)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    // Log non-200 cases
    if (!res.ok) {
      console.error(
        `[TechXplore][OG] Non-200 response: ${res.status} ${res.statusText} for ${url} (after ${duration}ms)`
      );
      return null;
    }

    
    const html = await res.text();

    const $ = cheerio.load(html);

    const og = $('meta[property="og:image"]').attr("content");
    if (og) return og;

    const tw = $('meta[name="twitter:image"]').attr("content");
    if (tw) return tw;

    if (!og && !tw) {
      console.error(
        `[TechXplore][OG] No og:image or twitter:image found in fetched page: ${url}`
      );
      console.error(
        `[TechXplore][OG] Head snippet:\n` +
        html.slice(0, 400).replace(/\n/g, " ")
      );
    }

    return null;
  } catch (err) {
    console.error("TechXplore og:image fetch failed:", url, err.message);
    return null;
  }
}

function cleanSummary(raw) {
  if (!raw) return "";

  let summary = raw;

  // Remove "Explore further" junk
  summary = summary.replace(/Explore further:.*/i, "");

  // Remove "Provided by X" footer
  summary = summary.replace(/Provided by.*/i, "");

  // Remove excessive HTML if any
  summary = summary.replace(/<[^>]+>/g, " ");

  return summary.trim();
}

export async function parseTechXploreItem(item, feedMeta, feedConfig) {
  const imageUrl = await fetchOgImage(item.link);

  if (!imageUrl) {
    imageUrl = fallbackImageFromCategory(item, feedConfig);
  }

  const publishedRaw =
    item.isoDate || item.pubDate || item.published || item.updated;
  const publishedAt = publishedRaw ? new Date(publishedRaw).toISOString() : null;

  const rawSummary =
    item.contentSnippet || item.summary || item.description || "";
  const summary = cleanSummary(rawSummary);

  return {
    title: item.title || "",
    url: item.link || "",
    summary,
    imageUrl,
    categories: item.categories || [],
    publishedAt,
    source: feedConfig?.name || feedMeta?.title || "TechXplore",
  };
}
