// scripts/fetchArticles.js
import Parser from "rss-parser";

// --- import helpers for each source -------------------------------
import { parseMITItem } from "../helpers/parseMIT.js";
import { parseWiredItem } from "../helpers/parseWired.js";
import { parseTechXploreItem } from "../helpers/parseTechXplore.js";
import { parseIEEEItem } from "../helpers/parseIEEE.js";  
import { parseScienceDailyItem } from "../helpers/parseScienceDaily.js";           

// Parser with HTML-related fields enabled
const parser = new Parser({
  customFields: {
    item: ["content:encoded", "content", "media:content", "media:thumbnail"],
  },
});

// ------------------------------------------------------------------
// Feed registry: add as many sources as you want
// ------------------------------------------------------------------

const FEEDS = [
  // --- MIT ---------------------------------------------------------
  {
    name: "MIT Robotics",
    url: "https://news.mit.edu/topic/mitrobotics-rss.xml",
    parser: parseMITItem,
  },
  {
    name: "MIT Artificial Intelligence",
    url: "https://news.mit.edu/topic/mitartificial-intelligence2-rss.xml",
    parser: parseMITItem,
  },
  {
    name: "MIT Engineering",
    url: "https://news.mit.edu/rss/topic/mechanical-engineering",
    parser: parseMITItem,
  },
  {
    name: "MIT Computer Science",
    url: "https://news.mit.edu/rss/topic/mechanical-engineering",
    parser: parseMITItem,
  },

  // --- Wired ------------------------------------------------------
  {
    name: "WIRED (AI)",
    url: "https://www.wired.com/feed/tag/ai/latest/rss",
    parser: parseWiredItem,
  },
  {
    name: "WIRED science",
    url: "https://www.wired.com/feed/category/science/latest/rss",
    parser: parseWiredItem,
  },

  // --- TechXplore --------------------------------
 {
    name: "TechXplore — Computer Science",
    url: "https://techxplore.com/rss-feed/computer-sciences-news/",
    parser: parseTechXploreItem,
  },
  {
    name: "TechXplore — Engineering",
    url: "https://techxplore.com/rss-feed/engineering-news/",
    parser: parseTechXploreItem,
  },
  {
    name: "TechXplore — Robotics",
    url: "https://techxplore.com/rss-feed/robotics-news/",
    parser: parseTechXploreItem,
  },
  {
    name: "TechXplore — AI & Machine Learning",
    url: "https://techxplore.com/rss-feed/machine-learning-ai-news/",
    parser: parseTechXploreItem,
  },

  // --- ScienceDaily feeds ----------------------------------------
  {
    name: "ScienceDaily — Robotics",
    url: "https://www.sciencedaily.com/rss/computers_math/robotics.xml",
    parser: parseScienceDailyItem,
  },
  {
    name: "ScienceDaily — Engineering",
    url: "https://www.sciencedaily.com/rss/matter_energy/engineering.xml",
    parser: parseScienceDailyItem,
  },
  {
    name: "ScienceDaily — Computer Science",
    url: "https://www.sciencedaily.com/rss/computers_math/computer_science.xml",
    parser: parseScienceDailyItem,
  },
  {
    name: "ScienceDaily — Artificial Intelligence",
    url: "https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml",
    parser: parseScienceDailyItem,
  },


  // --- IEEE Spectrum ------------------------------------------
  {
    name: "IEEE Spectrum — Robotics",
    url: "https://spectrum.ieee.org/rss/robotics/fulltext",
    parser: parseIEEEItem,
  },
  {
    name: "IEEE Spectrum — AI",
    url: "https://spectrum.ieee.org/rss/artificial-intelligence/fulltext",
    parser: parseIEEEItem,
  },
  {
    name: "IEEE Spectrum — Computing & Chips",
    url: "https://spectrum.ieee.org/rss/computing/fulltext",
    parser: parseIEEEItem,
  },
  {
    name: "IEEE Spectrum — Automaton (Robotics blog)",
    url: "https://spectrum.ieee.org/feeds/topic/robotics.rss",
    parser: parseIEEEItem,
  },
  {
    name: "IEEE Spectrum — DIY",
    url: "https://spectrum.ieee.org/feeds/topic/diy.rss",
    parser: parseIEEEItem,
  },

];

// ------------------------------------------------------------------
// Politics filter
// ------------------------------------------------------------------

const POLITICS_PATTERNS = [
  /\bTrump\b/i,
  /\bBiden\b/i,
  /\bMacron\b/i,
  /\bLe Pen\b/i,
  /\bvisa\b/i,
  /\bH-?1B\b/i,
  /\bimmigration\b/i,
  /\belection\b/i,
  /\bcampaign\b/i,
  /\bparliament\b/i,
  /\bCongress\b/i,
  /\bSenate\b/i,
  /\bWhite House\b/i,
  /\bpolitic(s|al)?\b/i,
  /\bpolicy\b/i,
];

function isProbablyPolitical(article) {
  const text = [
    article.title,
    article.summary,
    (article.categories || []).join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return POLITICS_PATTERNS.some((re) => re.test(text));
}

// ------------------------------------------------------------------
// Main export
// ------------------------------------------------------------------

export async function fetchArticles(limitPerFeed = 1) {
  const all = [];

  for (const feedConfig of FEEDS) {
    try {
      const feed = await parser.parseURL(feedConfig.url);
      const items = (feed.items || []).slice(0, limitPerFeed);
      let feedArticleCount = 0;
      console.log(`${feedConfig.name}:`);

      for (const item of items) {
        const parserFn = feedConfig.parser;

        let parsed = null;

        if (parserFn) {
          parsed = await parserFn(item, feed, feedConfig); // use helper
        } else {
          console.warn("No parser provided for feed:", feedConfig.name);
          continue;
        }

        if (!parsed) continue; // parser may skip irrelevant content

        // Override the source with feed name
        parsed.source = feedConfig.name;

        // Normalize dates
        if (parsed.publishedAt) {
          parsed.publishedAt = new Date(parsed.publishedAt).toISOString();
        }

        // Political noise filter
        if (isProbablyPolitical(parsed)) continue;

        // Skip invalid
        if (!parsed.title || !parsed.url) continue;

        all.push(parsed);
        feedArticleCount++;
        console.log(`  - ${parsed.title}`);
      }
      console.log(`  → ${feedArticleCount} article(s) added\n`);
    } catch (err) {
      console.error("Failed to fetch feed:", feedConfig.name);
      console.error(err.message);
    }
  }

  console.log(`sorting articles...`);
  // Sort newest → oldest
  all.sort((a, b) => {
    if (!a.publishedAt || !b.publishedAt) return 0;
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });

  // ------------------------------------------------------------------
  // Deduplicate by title
  // Keep the first occurrence (we sorted newest → oldest, so this keeps the newest)
  // Normalize titles by trimming, collapsing whitespace and lowercasing.
  console.log(`deduplicating articles...`);
  const seen = new Set();
  const deduped = [];

  function normalizeTitle(t) {
    if (!t) return "";
    return t
      .replace(/<[^>]*>/g, "") // strip any HTML tags that might appear
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  for (const art of all) {
    const nt = normalizeTitle(art.title);
    if (!nt) continue; // skip items without a usable title
    if (seen.has(nt)) {
      console.log(`  [DUPLICATE] "${art.title}" from ${art.source}`);
      continue;
    }
    seen.add(nt);
    deduped.push(art);
  }

  const removed = all.length - deduped.length;
  console.log(`removed ${removed} duplicate articles.`);
  return deduped;
  
  
}

