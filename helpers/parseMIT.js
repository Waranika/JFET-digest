// helpers/parseMIT.js
import { load } from "cheerio";

export function parseMITItem(item) {
    const description = item.content || item["content:encoded"] || item.summary || "";
    
    const $ = load(description);

    // Extract image (first <img>)
    const img = $("img").first().attr("src") || null;

    // Extract summary (first paragraph text)
    const summary = $("p").first().text()?.trim() || item.title;

    // Categories (normalize to strings — some feeds return objects)
    const rawCategories = item.categories || [];
    const categories = rawCategories
        .map((c) => {
            if (!c && c !== 0) return null;
            if (typeof c === "string") return c;
            if (typeof c === "object") {
                // common rss-parser shapes: { '#text': 'Name' } or { text: 'Name' }
                return (
                    c["#text"] || c["#"] || c.text || c.value || c.name || null
                );
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
        "Technology"
    ];

    const matchesAllowed = categories.some((c) =>
        allowed.some((a) => String(c).toLowerCase().includes(a.toLowerCase()))
    );

    if (!matchesAllowed) {
        return null; // skip irrelevant MIT news
    }

    return {
        title: item.title,
        url: item.link,
        summary,
        imageUrl: img,
        categories,
        publishedAt: item.pubDate || null,
        source: "MIT News"
    };
}
